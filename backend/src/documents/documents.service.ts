import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDocumentsList() {
    return this.prisma.document.findMany({
      select: {
        id: true,
        originalFileName: true,
        status: true,
        ocrStatus: true,
        hasAnomalies: true,
        createdAt: true,
      },

      where: {
        ocrStatus: {
          in: ['pending', 'processing', 'error'],
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}