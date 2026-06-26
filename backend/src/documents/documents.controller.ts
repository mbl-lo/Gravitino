import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  StreamableFile,
  Res,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  Body,
  BadRequestException,
  Query,
  Patch
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { createReadStream, existsSync } from 'fs';
import { join, extname } from 'path';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { OcrService } from './ocr.service';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly ocrService: OcrService,
    private readonly anomaliesService: AnomaliesService,
  ) {}

  @Get()
  async getDocumentsList(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('hasAnomalies') hasAnomalies?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.documentsService.getDocumentsList({
      search,
      status,
      hasAnomalies: hasAnomalies === 'true' ? true : hasAnomalies === 'false' ? false : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Get('export')
  async exportDocuments(
    @Res({ passthrough: true }) res: Response,
    @Query('format') format?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('hasAnomalies') hasAnomalies?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filters = {
      search,
      status,
      hasAnomalies: hasAnomalies === 'true' ? true : hasAnomalies === 'false' ? false : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };
    const ts = Date.now();
    const fmt = (format ?? 'json').toUpperCase();

    if (fmt === 'CSV') {
      const csv = await this.documentsService.exportToCsv(filters);
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="documents-${ts}.csv"` });
      return csv;
    }

    if (fmt === 'XLSX') {
      const buffer = await this.documentsService.exportToXlsx(filters);
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="documents-${ts}.xlsx"` });
      res.send(buffer);
      return;
    }

    const result = await this.documentsService.exportToJson(filters);
    res.set({ 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="documents-${ts}.json"` });
    return result;
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

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.confirm(id, user.id);
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
      'Content-Type': document.fileMimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${document.originalFileName}"`,
    });

    return new StreamableFile(fileStream);
  }

  @Patch(':id/fields/:fieldKey')
  @UseGuards(JwtAuthGuard)
  async updateDocumentFields(
    @Param('id') id: string,
    @Param('fieldKey') fieldKey: string,
    @Body('value') value: string,
    @CurrentUser() user: any,
  ) {
    if (value === undefined) {
      throw new BadRequestException('Необходимо передать новое значение поля');
    }

    return this.documentsService.updateFields(id, fieldKey, value, user.id);
  }

  @Get('training/statistics')
  @UseGuards(JwtAuthGuard)
  async getTrainingStatistics() {
    return this.documentsService.getTrainingStatistics();
  }

  @Get('training/documents')
  @UseGuards(JwtAuthGuard)
  async getTrainingDocumentsList(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.documentsService.getTrainingDocumentsList({
      search,
      status,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Get('training/documents/:id')
  @UseGuards(JwtAuthGuard)
  async getTrainingDocument(@Param('id') id: string) {
    return this.documentsService.getTrainingDocument(id);
  }

  @Post('training/documents/:id/confirm-labeling')
  @UseGuards(JwtAuthGuard)
  async confirmLabeling(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.confirmLabeling(id, user.id);
  }

  @Post('training/documents/:id/add-to-training-set')
  @UseGuards(JwtAuthGuard)
  async addToTrainingSet(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.addToTrainingSet(id, user.id);
  }

  @Post(':id/validate')
  async validateDocument(@Param('id') id: string) {
    return this.anomaliesService.validateDocument(id);
  }

  @Get('anomalies/all')
  async getAllAnomalies() {
    return this.anomaliesService.getAllAnomalies();
  }
}
