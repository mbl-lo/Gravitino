import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('hasAnomalies') hasAnomalies?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.documentsService.exportToJson({
      search,
      status,
      hasAnomalies: hasAnomalies === 'true' ? true : hasAnomalies === 'false' ? false : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="documents-export-${Date.now()}.json"`,
    });

    return result;
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async upload(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не были загружены.');
    }

    return this.documentsService.create(files, body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const document = await this.documentsService.findOneDetails(id);
    
    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    return document;
  }

  @Get(':id/file')
  async getFile(@Param('id') id: string) {
    const filePath = await this.documentsService.getFilename(id);

    if (!filePath) {
      throw new NotFoundException('Путь к файлу или оригинальное имя отсутствует в базе данных');
    }

    const fullPath = join(process.cwd(), filePath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('Файл физически отсутствует на сервере в папке uploads');
    }

    const fileStream = createReadStream(fullPath);
    return new StreamableFile(fileStream);
  }

  @Patch(':id/fields/:fieldKey')
  async updateField(
    @Param('id') id: string,
    @Param('fieldKey') fieldKey: string,
    @Body('newValue') newValue: string,
    @Body('userId') userId: string,
  ) {
    if (!newValue) {
      throw new BadRequestException('Необходимо передать новое значение поля');
    }

    return this.documentsService.updateFields(id, fieldKey, newValue, userId);
  }

  @Post(':id/confirm')
async confirm(
  @Param('id') id: string,
  @Body('userId') userId: string,
) {
  if (!userId) {
    throw new BadRequestException('userId is required');
  }
  return this.documentsService.confirm(id, userId);
  }
}