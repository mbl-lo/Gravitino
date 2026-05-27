import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  StreamableFile,
  Res,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { createReadStream, existsSync } from 'fs';
import { join, extname } from 'path';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { OcrService } from './ocr.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly ocrService: OcrService,
  ) {}

  @Get()
  async getDocumentsList() {
    return this.documentsService.getDocumentsList();
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
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
  upload(@UploadedFile() file: any, @Body() body: any) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен.');
    }

    return this.documentsService.create(file, body);
  }

  @Post(':id/run-ocr')
  async runOcr(@Param('id') id: string) {
    const ocrResult = this.ocrService.process(id);
    return this.documentsService.saveOcrResult(id, ocrResult);
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
