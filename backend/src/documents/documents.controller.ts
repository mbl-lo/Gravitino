import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                cb(null, `${uniqueSuffix}${ext}`);
            }
        }),

        fileFilter: (req, file, cb) => {
            const allowedMimes = [
                'image/jpeg', 
                'image/png', 
                'application/pdf', 
                'image/heic'
            ];

            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Недопустимый формат файла. Разрешены только JPG, PNG, PDF и HEIC.'), false
                );
            }
        }
    }))
    upload(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Файл не был загружен.');
        }
        
        return this.documentsService.uploadFile(file);
    }

    @Get()
    getAllDocuments() {
        return this.documentsService.getAllDocuments();
    }
}