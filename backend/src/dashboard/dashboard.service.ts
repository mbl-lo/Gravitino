import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const total = await this.prisma.document.count();

    const processing = await this.prisma.document.count({
      where: {
        ocrStatus: {
          in: ['pending', 'processing'],
        },
      },
    });

    const errors = await this.prisma.document.count({
      where: {
        ocrStatus: 'error',
      },
    });

    return {
      total,
      processing,
      errors,
    };
  }
}