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

    const [odometerRule, fuelRule, signatureRule, timeRule] = await Promise.all(
      [
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
        this.prisma.validationRule.upsert({
          where: { code: 'SIGNATURES_REQUIRED' },
          update: { isEnabled: true },
          create: {
            code: 'SIGNATURES_REQUIRED',
            title: 'Required signatures must be recognized',
            description:
              'Checks driver, mechanic and dispatcher signatures in document fields.',
            isEnabled: true,
            params: {
              requiredFields: [
                'signature_driver',
                'signature_mechanic',
                'signature_dispatcher',
              ],
            },
          },
        }),
        this.prisma.validationRule.upsert({
          where: { code: 'WORKING_TIME_VALID' },
          update: { isEnabled: true },
          create: {
            code: 'WORKING_TIME_VALID',
            title: 'Working time must be valid',
            description:
              'Checks departure and arrival time order, total hours and downtime.',
            isEnabled: true,
            params: { totalHoursTolerance: 0.25 },
          },
        }),
      ],
    );

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

    const signatureAnomaly = this.checkSignatures(
      document.fields,
      signatureRule.id,
    );

    if (signatureAnomaly) {
      anomalies.push(signatureAnomaly);
    }

    const timeAnomaly = this.checkTime(document.fields, timeRule.id);

    if (timeAnomaly) {
      anomalies.push(timeAnomaly);
    }

    await this.prisma.anomaly.deleteMany({
      where: {
        documentId,
        type: {
          in: [
            'odometer_order',
            'fuel_overrun',
            'missing_signature',
            'time_invalid',
          ],
        },
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
      checks: [
        'odometer_end_gt_start',
        'fuel_basic_check',
        'signatures_required',
        'working_time_valid',
      ],
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
      this.numberField(fields, 'fuel_consumption') ??
      this.numberField(fields, 'calculated_consumption') ??
      this.calculateFuelFromBalances(fields);
    const fuelRate =
      this.toNumber(vehicleFuelRate) ??
      this.numberField(fields, 'fuel_rate_per_100km') ??
      this.numberField(fields, 'fuel_rate') ??
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

  private checkSignatures(
    fields: DocumentFieldValue[],
    validationRuleId: string,
  ): PreparedAnomaly | null {
    const requiredSignatures = [
      'signature_driver',
      'signature_mechanic',
      'signature_dispatcher',
    ];
    const missing = requiredSignatures.filter(
      (fieldKey) => !this.booleanField(fields, fieldKey),
    );

    if (missing.length === 0) {
      return null;
    }

    return {
      validationRuleId,
      type: 'missing_signature',
      severity: 'critical',
      fieldKey: 'signatures',
      message: 'required signatures are missing or not recognized',
      expectedValue: requiredSignatures.join(', '),
      actualValue: missing.join(', '),
    };
  }

  private checkTime(
    fields: DocumentFieldValue[],
    validationRuleId: string,
  ): PreparedAnomaly | null {
    const departure = this.timeField(fields, 'departure_time');
    const arrival = this.timeField(fields, 'arrival_time');

    if (departure === null || arrival === null) {
      return {
        validationRuleId,
        type: 'time_invalid',
        severity: 'high',
        fieldKey: departure === null ? 'departure_time' : 'arrival_time',
        message: 'departure_time and arrival_time must be valid',
        expectedValue: 'HH:mm departure and arrival time',
        actualValue: this.timeActualValue(fields),
      };
    }

    if (arrival <= departure) {
      return {
        validationRuleId,
        type: 'time_invalid',
        severity: 'high',
        fieldKey: 'arrival_time',
        message: 'arrival_time must be later than departure_time',
        expectedValue: `> ${this.fieldRawValue(fields, 'departure_time')}`,
        actualValue: this.fieldRawValue(fields, 'arrival_time') ?? 'missing',
      };
    }

    const totalHours = this.numberField(fields, 'total_hours');
    const downtimeHours = this.numberField(fields, 'downtime_hours');
    const calculatedHours = (arrival - departure) / 60;

    if (totalHours !== null && Math.abs(totalHours - calculatedHours) > 0.25) {
      return {
        validationRuleId,
        type: 'time_invalid',
        severity: 'medium',
        fieldKey: 'total_hours',
        message: 'total_hours does not match departure and arrival time',
        expectedValue: String(this.round(calculatedHours)),
        actualValue: String(this.round(totalHours)),
      };
    }

    if (
      downtimeHours !== null &&
      totalHours !== null &&
      downtimeHours > totalHours
    ) {
      return {
        validationRuleId,
        type: 'time_invalid',
        severity: 'medium',
        fieldKey: 'downtime_hours',
        message: 'downtime_hours cannot be greater than total_hours',
        expectedValue: `<= ${this.round(totalHours)}`,
        actualValue: String(this.round(downtimeHours)),
      };
    }

    return null;
  }

  private numberField(fields: DocumentFieldValue[], key: string) {
    const field = fields.find((item) => item.fieldKey === key);
    return this.toNumber(field?.correctedValue ?? field?.recognizedValue);
  }

  private booleanField(fields: DocumentFieldValue[], key: string) {
    const rawValue = this.fieldRawValue(fields, key);

    if (!rawValue) {
      return false;
    }

    const normalized = rawValue.trim().toLowerCase();

    if (
      normalized.includes('false') ||
      normalized.includes('no') ||
      normalized.includes('not') ||
      normalized.includes('missing') ||
      normalized.includes('absent') ||
      normalized.includes('нет') ||
      normalized.includes('не ')
    ) {
      return false;
    }

    return true;
  }

  private timeField(fields: DocumentFieldValue[], key: string) {
    const rawValue = this.fieldRawValue(fields, key);

    if (!rawValue) {
      return null;
    }

    const match = rawValue.trim().match(/^(\d{1,2})[:.](\d{2})$/);

    if (!match) {
      return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  }

  private timeActualValue(fields: DocumentFieldValue[]) {
    return `departure_time=${this.fieldRawValue(fields, 'departure_time') ?? 'missing'}, arrival_time=${this.fieldRawValue(fields, 'arrival_time') ?? 'missing'}`;
  }

  private fieldRawValue(fields: DocumentFieldValue[], key: string) {
    const field = fields.find((item) => item.fieldKey === key);
    return field?.correctedValue ?? field?.recognizedValue ?? null;
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

  async getAllAnomalies() {
    const anomalies = await this.prisma.anomaly.findMany({
      include: {
        document: true,
      },
      orderBy: {
        id: 'desc',
      }
  });

  const fieldLabels: Record<string, string> = {
    odometr_end: 'Расчетный пробег',
    fuel_used_liters: 'Отклонение топлива',
      signatures: 'Подпись механика/водителя',
      arrival_time: 'Время работы/выезда',
      departure_time: 'Время выезда',
      total_hours: 'Время работы',
      downtime_hours: 'Время простоя'
    };

    return anomalies.map((anomaly) => ({
      id: anomaly.id,
      documentId: anomaly.documentId,
      documentNumber: anomaly.document?.documentNumber || 'Новый', 
      type: 
        anomaly.type === 'odometer_order' ? 'Несоответствие пробега' :
        anomaly.type === 'fuel_overrun' ? 'Расход топлива выше нормы' :
        anomaly.type === 'missing_signature' ? 'Отсутствует подпись' :
        anomaly.type === 'time_invalid' ? 'Неверный временной интервал' : anomaly.type,
      fieldLabel: fieldLabels[anomaly.fieldKey!] || anomaly.fieldKey,
      severity: anomaly.severity,
      status: anomaly.status, 
    }));
  }
}
