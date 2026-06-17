import { NotFoundException } from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';

describe('AnomaliesService', () => {
  const validSignatureAndTimeFields = [
    {
      fieldKey: 'signature_driver',
      recognizedValue: 'recognized',
      correctedValue: null,
    },
    {
      fieldKey: 'signature_mechanic',
      recognizedValue: 'recognized',
      correctedValue: null,
    },
    {
      fieldKey: 'signature_dispatcher',
      recognizedValue: 'recognized',
      correctedValue: null,
    },
    {
      fieldKey: 'departure_time',
      recognizedValue: '08:15',
      correctedValue: null,
    },
    {
      fieldKey: 'arrival_time',
      recognizedValue: '16:42',
      correctedValue: null,
    },
    {
      fieldKey: 'total_hours',
      recognizedValue: '8.45',
      correctedValue: null,
    },
    {
      fieldKey: 'downtime_hours',
      recognizedValue: '1.25',
      correctedValue: null,
    },
  ];
  const prisma = {
    document: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    validationRule: {
      upsert: jest.fn(),
    },
    anomaly: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: AnomaliesService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockSettings = { get: jest.fn().mockResolvedValue({ maxFuelDeviation: 20 }) };
    service = new AnomaliesService(prisma as never, mockSettings as never);

    prisma.validationRule.upsert.mockImplementation(({ where }) =>
      Promise.resolve({ id: `rule-${where.code}`, code: where.code }),
    );
    prisma.anomaly.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: `anomaly-${data.type}`, ...data }),
    );
    prisma.anomaly.deleteMany.mockResolvedValue({ count: 0 });
    prisma.document.update.mockResolvedValue({});
  });

  it('keeps odometer and fuel as part of the basic validation checks', async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'document-id',
      fields: [
        {
          fieldKey: 'odometer_start',
          recognizedValue: '1000',
          correctedValue: null,
        },
        {
          fieldKey: 'odometer_end',
          recognizedValue: '990',
          correctedValue: null,
        },
        {
          fieldKey: 'fuel_used_liters',
          recognizedValue: '80',
          correctedValue: null,
        },
        ...validSignatureAndTimeFields,
      ],
      vehicle: { fuelRatePer100km: 10 },
    });

    const result = await service.validateDocument('document-id');

    expect(result.checks).toEqual([
      'odometer_end_gt_start',
      'fuel_basic_check',
      'signatures_required',
      'working_time_valid',
    ]);
    expect(result.anomaliesCount).toBe(1);
    expect(prisma.anomaly.create).toHaveBeenCalledTimes(1);
    expect(prisma.anomaly.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        documentId: 'document-id',
        type: 'odometer_order',
        fieldKey: 'odometer_end',
        status: 'open',
      }),
    });
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'document-id' },
      data: { hasAnomalies: true },
    });
  });

  it('creates a fuel overrun anomaly when fuel exceeds the 20 percent limit', async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'document-id',
      fields: [
        {
          fieldKey: 'odometer_start',
          recognizedValue: '1000',
          correctedValue: null,
        },
        {
          fieldKey: 'odometer_end',
          recognizedValue: '1200',
          correctedValue: null,
        },
        {
          fieldKey: 'fuel_used_liters',
          recognizedValue: '40',
          correctedValue: null,
        },
        ...validSignatureAndTimeFields,
      ],
      vehicle: { fuelRatePer100km: 10 },
    });

    const result = await service.validateDocument('document-id');

    expect(result.anomaliesCount).toBe(1);
    expect(prisma.anomaly.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'fuel_overrun',
        fieldKey: 'fuel_used_liters',
        expectedValue: '<= 24',
        actualValue: '40',
      }),
    });
  });

  it('clears first-check anomalies and marks the document clean when checks pass', async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'document-id',
      fields: [
        {
          fieldKey: 'odometer_start',
          recognizedValue: '1000',
          correctedValue: null,
        },
        {
          fieldKey: 'odometer_end',
          recognizedValue: '1200',
          correctedValue: null,
        },
        {
          fieldKey: 'fuel_used_liters',
          recognizedValue: '20',
          correctedValue: null,
        },
        ...validSignatureAndTimeFields,
      ],
      vehicle: { fuelRatePer100km: 10 },
    });

    const result = await service.validateDocument('document-id');

    expect(result.anomaliesCount).toBe(0);
    expect(prisma.anomaly.deleteMany).toHaveBeenCalledWith({
      where: {
        documentId: 'document-id',
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
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'document-id' },
      data: { hasAnomalies: false },
    });
  });

  it('creates a critical signature anomaly when a required signature is missing', async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'document-id',
      fields: [
        {
          fieldKey: 'odometer_start',
          recognizedValue: '1000',
          correctedValue: null,
        },
        {
          fieldKey: 'odometer_end',
          recognizedValue: '1200',
          correctedValue: null,
        },
        {
          fieldKey: 'fuel_consumption',
          recognizedValue: '20',
          correctedValue: null,
        },
        {
          fieldKey: 'fuel_rate',
          recognizedValue: '10 l/100km',
          correctedValue: null,
        },
        {
          fieldKey: 'signature_driver',
          recognizedValue: 'recognized',
          correctedValue: null,
        },
        {
          fieldKey: 'signature_mechanic',
          recognizedValue: 'not recognized',
          correctedValue: null,
        },
        {
          fieldKey: 'signature_dispatcher',
          recognizedValue: 'recognized',
          correctedValue: null,
        },
        ...validSignatureAndTimeFields.filter(
          (field) => !field.fieldKey.startsWith('signature_'),
        ),
      ],
      vehicle: null,
    });

    const result = await service.validateDocument('document-id');

    expect(result.anomaliesCount).toBe(1);
    expect(prisma.anomaly.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'missing_signature',
        severity: 'critical',
        fieldKey: 'signatures',
        actualValue: 'signature_mechanic',
      }),
    });
  });

  it('creates a time anomaly when arrival is earlier than departure', async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'document-id',
      fields: [
        {
          fieldKey: 'odometer_start',
          recognizedValue: '1000',
          correctedValue: null,
        },
        {
          fieldKey: 'odometer_end',
          recognizedValue: '1200',
          correctedValue: null,
        },
        {
          fieldKey: 'fuel_consumption',
          recognizedValue: '20',
          correctedValue: null,
        },
        {
          fieldKey: 'fuel_rate',
          recognizedValue: '10 l/100km',
          correctedValue: null,
        },
        ...validSignatureAndTimeFields.filter(
          (field) =>
            field.fieldKey !== 'departure_time' &&
            field.fieldKey !== 'arrival_time',
        ),
        {
          fieldKey: 'departure_time',
          recognizedValue: '18:10',
          correctedValue: null,
        },
        {
          fieldKey: 'arrival_time',
          recognizedValue: '08:20',
          correctedValue: null,
        },
      ],
      vehicle: null,
    });

    const result = await service.validateDocument('document-id');

    expect(result.anomaliesCount).toBe(1);
    expect(prisma.anomaly.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'time_invalid',
        severity: 'high',
        fieldKey: 'arrival_time',
      }),
    });
  });

  it('throws when the document does not exist', async () => {
    prisma.document.findUnique.mockResolvedValue(null);

    await expect(service.validateDocument('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
