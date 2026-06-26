import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnomaliesService {
  constructor(private prisma: PrismaService) {}

  
  private readonly validationAnomalyTypes = [
    'odometer_order',
    'fuel_overrun',
    'missing_signature',
    'time_invalid',
  ];

  
  async validateDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        fields: true,
        vehicle: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Документ с ID ${documentId} не найден`);
    }

    
    const rejectedAnomalies = await this.prisma.anomaly.findMany({
      where: {
        documentId,
        status: 'rejected',
        type: { in: this.validationAnomalyTypes },
      },
    });

    
    const rejectedKeys = new Set(
      rejectedAnomalies.map((a) => `${a.type}_${a.fieldKey || ''}`)
    );

    
    const fieldsMap: Record<string, { recognizedValue: string | null; correctedValue: string | null }> = {};
    for (const field of document.fields) {
      fieldsMap[field.fieldKey] = {
        recognizedValue: field.recognizedValue,
        correctedValue: field.correctedValue,
      };
    }

    const getValue = (key: string): string | null => {
      const f = fieldsMap[key];
      if (!f) return null;
      return f.correctedValue ?? f.recognizedValue;
    };

    
    const anomaliesToCreate: any[] = [];

    
    const odometerStart = parseFloat(getValue('odometer_start') || '0');
    const odometerEnd = parseFloat(getValue('odometer_end') || '0');

    if (odometerEnd <= odometerStart && odometerStart > 0) {
      const key = `odometer_order_odometer_end`;
      if (!rejectedKeys.has(key)) {
        anomaliesToCreate.push({
          documentId,
          type: 'odometer_order',
          severity: 'high',
          fieldKey: 'odometer_end',
          message: `Спидометр при возвращении (${odometerEnd}) меньше или равен спидометру при выезде (${odometerStart})`,
          expectedValue: `> ${odometerStart}`,
          actualValue: String(odometerEnd),
          status: 'open',
        });
      }
    }

    
    const fuelUsed = parseFloat(getValue('fuel_used_liters') || getValue('fuel_consumption') || '0');
    const fuelRate = document.vehicle?.fuelRatePer100km
      ? Number(document.vehicle.fuelRatePer100km)
      : null;
    const mileage = odometerEnd - odometerStart;

    if (fuelRate && mileage > 0) {
      const expectedFuel = (fuelRate * mileage) / 100;
      const limit = expectedFuel * 1.2; 

      if (fuelUsed > limit) {
        const key = `fuel_overrun_fuel_used_liters`;
        if (!rejectedKeys.has(key)) {
          anomaliesToCreate.push({
            documentId,
            type: 'fuel_overrun',
            severity: 'high',
            fieldKey: 'fuel_used_liters',
            message: `Расход топлива (${fuelUsed}л) превышает норму более чем на 20%`,
            expectedValue: `<= ${limit.toFixed(0)}`,
            actualValue: String(fuelUsed),
            status: 'open',
          });
        }
      }
    }

    
    const requiredSignatures = ['signature_driver', 'signature_mechanic', 'signature_dispatcher'];
    const missingSignatures = requiredSignatures.filter((sig) => {
      const val = getValue(sig);
      return !val || val.toLowerCase().includes('не распознана') || val.toLowerCase().includes('not recognized');
    });

    if (missingSignatures.length > 0) {
      const key = `missing_signature_signatures`;
      if (!rejectedKeys.has(key)) {
        anomaliesToCreate.push({
          documentId,
          type: 'missing_signature',
          severity: 'critical',
          fieldKey: 'signatures',
          message: `Отсутствуют обязательные подписи`,
          actualValue: missingSignatures.join(', '),
          status: 'open',
        });
      }
    }

    
    const departureTime = getValue('departure_time');
    const arrivalTime = getValue('arrival_time');

    if (departureTime && arrivalTime && arrivalTime < departureTime) {
      const key = `time_invalid_arrival_time`;
      if (!rejectedKeys.has(key)) {
        anomaliesToCreate.push({
          documentId,
          type: 'time_invalid',
          severity: 'high',
          fieldKey: 'arrival_time',
          message: `Время прибытия (${arrivalTime}) раньше времени выезда (${departureTime})`,
          expectedValue: `> ${departureTime}`,
          actualValue: arrivalTime,
          status: 'open',
        });
      }
    }

    
    await this.prisma.anomaly.deleteMany({
      where: {
        documentId,
        type: { in: this.validationAnomalyTypes },
        status: 'open',
      },
    });

    
    for (const anomalyData of anomaliesToCreate) {
      await this.prisma.anomaly.create({ data: anomalyData });
    }

    
    await this.updateDocumentAnomaliesFlag(documentId);

    return {
      checks: this.validationAnomalyTypes.filter((type) =>
        anomaliesToCreate.some((a) => a.type === type)
      ),
      anomaliesCount: anomaliesToCreate.length,
    };
  }

  
  async rejectAnomaly(anomalyId: string, userId: string) {
    const anomaly = await this.prisma.anomaly.findUnique({
      where: { id: anomalyId },
    });

    if (!anomaly) {
      throw new NotFoundException(`Аномалия с ID ${anomalyId} не найдена`);
    }

    if (anomaly.status === 'rejected') {
      throw new BadRequestException('Аномалия уже отклонена');
    }

    const updated = await this.prisma.anomaly.update({
      where: { id: anomalyId },
      data: {
        status: 'rejected',
        resolvedById: userId,
        resolvedAt: new Date(),
      },
    });

    
    await this.updateDocumentAnomaliesFlag(anomaly.documentId);

    return updated;
  }

  
  private async updateDocumentAnomaliesFlag(documentId: string) {
    const openAnomaliesCount = await this.prisma.anomaly.count({
      where: {
        documentId,
        status: 'open',
      },
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: { hasAnomalies: openAnomaliesCount > 0 },
    });
  }

  
  async getDocumentAnomalies(documentId: string) {
    return this.prisma.anomaly.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}