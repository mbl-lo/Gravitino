import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DocumentFieldValue = {
  fieldKey: string;
  recognizedValue: string | null;
  correctedValue: string | null;
};

type PreparedAnomaly = {
  validationRuleId: string;
  type: string;
  severity: string;
  fieldKey: string;
  message: string;
  expectedValue: string;
  actualValue: string;
};

@Injectable()
export class AnomaliesService {
  constructor(private readonly prisma: PrismaService) {}

  async validateDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        fields: {
          select: {
            fieldKey: true,
            recognizedValue: true,
            correctedValue: true,
          },
        },
        vehicle: {
          select: {
            fuelRatePer100km: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`);
    }

    const [odometerRule, fuelRule] = await Promise.all([
      this.prisma.validationRule.upsert({
        where: { code: 'ODOMETER_END_GT_START' },
        update: { isEnabled: true },
        create: {
          code: 'ODOMETER_END_GT_START',
          title: 'Odometer end must be greater than odometer start',
          description: 'Checks that odometer_end > odometer_start.',
          isEnabled: true,
          params: { minDelta: 1 },
        },
      }),
      this.prisma.validationRule.upsert({
        where: { code: 'FUEL_BASIC_CHECK' },
        update: { isEnabled: true },
        create: {
          code: 'FUEL_BASIC_CHECK',
          title: 'Fuel consumption must be within the basic limit',
          description:
            'Checks fuel_used_liters against mileage and vehicle fuel rate.',
          isEnabled: true,
          params: { maxOverrunPercent: 20 },
        },
      }),
    ]);

    const anomalies: PreparedAnomaly[] = [];
    const odometerStart = this.numberField(document.fields, 'odometer_start');
    const odometerEnd = this.numberField(document.fields, 'odometer_end');

    if (
      odometerStart !== null &&
      odometerEnd !== null &&
      odometerEnd <= odometerStart
    ) {
      anomalies.push({
        validationRuleId: odometerRule.id,
        type: 'odometer_order',
        severity: 'high',
        fieldKey: 'odometer_end',
        message: 'odometer_end must be greater than odometer_start',
        expectedValue: `> ${odometerStart}`,
        actualValue: String(odometerEnd),
      });
    }

    const fuelAnomaly = this.checkFuel(
      document.fields,
      odometerStart,
      odometerEnd,
      document.vehicle?.fuelRatePer100km,
      fuelRule.id,
    );

    if (fuelAnomaly) {
      anomalies.push(fuelAnomaly);
    }

    await this.prisma.anomaly.deleteMany({
      where: {
        documentId,
        type: { in: ['odometer_order', 'fuel_overrun'] },
      },
    });

    const createdAnomalies = await Promise.all(
      anomalies.map((anomaly) =>
        this.prisma.anomaly.create({
          data: {
            documentId,
            validationRuleId: anomaly.validationRuleId,
            type: anomaly.type,
            severity: anomaly.severity,
            fieldKey: anomaly.fieldKey,
            message: anomaly.message,
            expectedValue: anomaly.expectedValue,
            actualValue: anomaly.actualValue,
            status: 'open',
          },
        }),
      ),
    );

    await this.prisma.document.update({
      where: { id: documentId },
      data: { hasAnomalies: createdAnomalies.length > 0 },
    });

    return {
      documentId,
      checks: ['odometer_end_gt_start', 'fuel_basic_check'],
      anomaliesCount: createdAnomalies.length,
      anomalies: createdAnomalies,
    };
  }

  private checkFuel(
    fields: DocumentFieldValue[],
    odometerStart: number | null,
    odometerEnd: number | null,
    vehicleFuelRate: unknown,
    validationRuleId: string,
  ): PreparedAnomaly | null {
    if (
      odometerStart === null ||
      odometerEnd === null ||
      odometerEnd <= odometerStart
    ) {
      return null;
    }

    const fuelUsed =
      this.numberField(fields, 'fuel_used_liters') ??
      this.numberField(fields, 'fuel_consumed') ??
      this.numberField(fields, 'calculated_consumption') ??
      this.calculateFuelFromBalances(fields);
    const fuelRate =
      this.toNumber(vehicleFuelRate) ??
      this.numberField(fields, 'fuel_rate_per_100km') ??
      this.numberField(fields, 'consumption_rate');

    if (fuelUsed === null || fuelRate === null || fuelRate <= 0) {
      return null;
    }

    const mileage = odometerEnd - odometerStart;
    const expectedFuel = (mileage / 100) * fuelRate;
    const maxFuel = expectedFuel * 1.2;

    if (fuelUsed <= maxFuel) {
      return null;
    }

    return {
      validationRuleId,
      type: 'fuel_overrun',
      severity: fuelUsed > expectedFuel * 1.5 ? 'high' : 'medium',
      fieldKey: 'fuel_used_liters',
      message: 'fuel consumption exceeds the basic allowed limit',
      expectedValue: `<= ${this.round(maxFuel)}`,
      actualValue: String(this.round(fuelUsed)),
    };
  }

  private calculateFuelFromBalances(fields: DocumentFieldValue[]) {
    const start =
      this.numberField(fields, 'fuel_start_balance') ??
      this.numberField(fields, 'fuel_start');
    const issued =
      this.numberField(fields, 'fuel_issued') ??
      this.numberField(fields, 'fuel_refilled');
    const end =
      this.numberField(fields, 'fuel_end_balance') ??
      this.numberField(fields, 'fuel_end');

    if (start === null || issued === null || end === null) {
      return null;
    }

    return start + issued - end;
  }

  private numberField(fields: DocumentFieldValue[], key: string) {
    const field = fields.find((item) => item.fieldKey === key);
    return this.toNumber(field?.correctedValue ?? field?.recognizedValue);
  }

  private toNumber(value: unknown) {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    const normalized = String(value).replace(/\s/g, '').replace(',', '.');
    const match = normalized.match(/-?\d+(\.\d+)?/);

    if (!match) {
      return null;
    }

    const number = Number(match[0]);
    return Number.isFinite(number) ? number : null;
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }
}
