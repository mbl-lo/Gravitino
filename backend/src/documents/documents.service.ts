import {Injectable} from '@nestjs/common';

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
}