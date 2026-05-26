import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

    async create(file: any, body: any) {
        return this.prisma.document.create({
            data: {
            originalFileName: file.originalname,
            originalFileUrl: file.path, 
            fileMimeType: file.mimetype,
            fileSize: file.size,
            uploadedById: "33333333-3333-4333-8333-333333333334",
            },
        });
    }

  async findAll() {
    return this.prisma.document.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Документ с ID ${id} не найден в базе данных`);
    }

    return document;
  }

  async getFilename(id: string): Promise<string> {
    const document = await this.findOne(id);
    return document.originalFileUrl;
  }
}