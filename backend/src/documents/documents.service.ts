import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(file: any, body: any) {
    const { uploadedById } = body;
    return this.prisma.document.create({
        data: {
        originalFileName: file.originalname,
        originalFileUrl: file.path, 
        fileMimeType: file.mimetype,
        fileSize: file.size,
         uploadedById: uploadedById,
        },
    });
  }
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

  async findOneDetails(id: string) {
    const document = await this.prisma.document.findUnique({
      where: {id},
    });

    if (!document) {
      return null;
    }

    const mockFields = [
      {
        id: 'mock-f1',
        fieldKey: 'odometer_start',
        fieldLabel: 'Одометр (выезд)',
        recognizedValue: '1000',
        correctedValue: null,
      },
      {
        id: 'mock-f2',
        fieldKey: 'odometer_end',
        fieldLabel: 'Одометр (возврат)',
        recognizedValue: '990', 
        correctedValue: null,
      }
    ]

    const mockAnomalies = [
      {
        id: 'mock-anomaly-1',
        documentId: id,
        validationRuleId: 'rule-ODOMETER_END_GT_START',
        type: 'odometer_order', 
        severity: 'high',
        fieldKey: 'odometer_end',
        message: 'odometer_end must be greater than odometer_start',
        expectedValue: '> 1000',
        actualValue: '990',
        status: 'open',
        createdAt: new Date(),
      }
    ];

    return {
      ...document,
      fields: mockFields,
      anomalies: mockAnomalies,
    };
  }
}