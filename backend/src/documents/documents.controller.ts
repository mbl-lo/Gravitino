import { Controller, Get, Post, Param, NotFoundException, StreamableFile, Res, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { createReadStream, existsSync } from 'fs';
import { join, extname } from 'path';
import { Response } from 'express';
import { diskStorage } from 'multer';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll() {
    return this.documentsService.findAll();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: any, @Body() body: any) {
    if (!file) {
      throw new NotFoundException('Файл не передан');
    }
    return this.documentsService.create(file, body);
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