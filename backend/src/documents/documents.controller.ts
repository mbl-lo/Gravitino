import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  StreamableFile,
  Res,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { createReadStream, existsSync } from 'fs';
import { join, extname } from 'path';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { OcrService } from './ocr.service';
import { AnomaliesService } from '../anomalies/anomalies.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly ocrService: OcrService,
    private readonly anomaliesService: AnomaliesService,
  ) {}

  @Get()
  async getDocumentsList() {
    return this.documentsService.getDocumentsList();
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),

      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'application/pdf',
          'image/heic',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Недопустимый формат файла. Разрешены только JPG, PNG, PDF и HEIC.',
            ),
            false,
          );
        }
      },
    }),
  )
  async upload(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не были загружены.');
    }

    const result = await this.documentsService.create(files, body);

    result.files.forEach((doc) => {
      this.runOcr(doc.id).catch((err) => {
        console.error(`Ошибка при фоновой обработке документа ${doc.id}:`, err);
      });
    });

    return result;
  }

  @Post(':id/run-ocr')
  async runOcr(@Param('id') id: string) {
    const ocrResult = this.ocrService.process(id);
    const saved = await this.documentsService.saveOcrResult(id, ocrResult);
    const validation = await this.anomaliesService.validateDocument(id);
    return { ...saved, validation };
  }

  @Get(':id')
  async getDocumentDetails(@Param('id') id: string) {
    const document = await this.documentsService.findOneDetails(id);
    if (!document) {
      throw new NotFoundException('Документ не найден');
    }
    return document;
  }

  @Get(':id/file')
  async getFile(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const document = await this.documentsService.findOne(id);
    const filePath = await this.documentsService.getFilename(id);
    
    if (!filePath || !document.originalFileName) {
      throw new NotFoundException('Путь к файлу или оригинальное имя отсутствует в базе данных');
    }

    const absolutePath = join(process.cwd(), filePath);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Файл физически отсутствует на сервере в папке uploads');
    }

    const fileStream = createReadStream(absolutePath);
    
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `inline; filename="${document.originalFileName}"`,
    });

    return new StreamableFile(fileStream);
  }
}
