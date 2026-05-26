import {Injectable, NotFoundException} from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class DocumentsService {

    private mockDatabase: any[] = [];

    uploadFile(file: Express.Multer.File) {
        const newDocument = {
            id: Date.now(),
            filename: file.filename,
            originalname: file.originalname,
            path: file.path,
            size: file.size,
            status: 'Ожидает обработки',
            uploadedAt: new Date(),
        };
       
        this.mockDatabase.push(newDocument);

        return {
            message: 'Файл успешно загружен',
            document: newDocument,
        };
    }

    getAllDocuments() {
        return this.mockDatabase;
    }

    getFilename(id: string): string {
        const document = this.documents.find(doc => doc.id === id);
        if (!document) {
            throw new NotFoundException('Документ с таким id не найден');
        }

        const filePath = join(process.cwd(), 'uploads', document.filename);
        if (!existsSync(filePath)) {
            throw new NotFoundException('Файл не найден');
        }

        return document.filename;
    }
}