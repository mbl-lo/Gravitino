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

    const completed = await this.prisma.document.count({
      where: {
        ocrStatus: 'completed',
      },
    });

    const confirmed = await this.prisma.document.count({
      where: {
        confirmedAt: {
          not: null,
        },
      },
    });

    const withAnomalies = await this.prisma.document.count({
      where: {
        hasAnomalies: true,
      },
    });

    return {
      total,
      processing,
      errors,
      completed,
      confirmed,
      withAnomalies,
    };
  }
}