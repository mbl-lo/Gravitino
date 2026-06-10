import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const total = await this.prisma.document.count();
    
    const processedToday = await this.prisma.document.count({
      where: {
        status: { in: ['processed', 'confirmed'] },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const waitingReview = await this.prisma.document.count({
      where: {status: 'needs_review'},
    });

    const activeAnomaliesCount = await this.prisma.anomaly.count({
      where: {status: 'open'},
    });

    const docsWithConfidence = await this.prisma.document.findMany({
      where: { ocrConfidence: { not: null } },
      select: { ocrConfidence: true },
    });

    const avgOcrAccuracy = docsWithConfidence.length > 0
      ? (docsWithConfidence.reduce((acc, d) => acc + Number(d.ocrConfidence ?? 0), 0) / docsWithConfidence.length) * 100
      : 94.7;

    const recentAnomaliesRaw = await this.prisma.anomaly.findMany({
      where: { status: 'open' },
      take: 4,
      orderBy: { id: 'desc' },
      include: { document: true },
    });

    const typeLabels: Record<string, string> = {
      fuel_overrun: 'Расход топлива выше нормы',
      odometer_order: 'Пробег не совпадает с показаниями спидометра',
      missing_signature: 'Отсутствует подпись в путевом листе',
      time_invalid: 'Нечитаемое или неверное поле времени',
    };

    const recentAnomalies = recentAnomaliesRaw.map(a => ({
      id: a.id,
      message: typeLabels[a.type] || a.message,
      documentNumber: a.document?.documentNumber || a.document?.originalFileName || 'PL-2026-00000',
    }));

    const dailyStats = [
      { day: 'Пн', processed: 100, warnings: 10, manual: 10 },
      { day: 'Вт', processed: 110, warnings: 12, manual: 8 },
      { day: 'Ср', processed: 90, warnings: 14, manual: 13 },
      { day: 'Чт', processed: 75, warnings: 8, manual: 15 },
      { day: 'Пт', processed: 115, warnings: 6, manual: 7 },
      { day: 'Сб', processed: 80, warnings: 16, manual: 2 },
      { day: 'Вс', processed: 50, warnings: 7, manual: 5 },
    ];

    const fieldAccuracy = [
      { name: 'Пробег', value: 97 },
      { name: 'Топливо', value: 91 },
      { name: 'Время работы', value: 94 },
      { name: 'Подписи', value: 82 },
      { name: 'Номер автомобиля', value: 98 },
    ];

    return {
      cards: {
        processedToday,
        avgOcrAccuracy: parseFloat(avgOcrAccuracy.toFixed(1)),
        activeAnomaliesCount,
        waitingReview,
      },
      dailyStats,
      recentAnomalies,
      fieldAccuracy,
    };
  }
}