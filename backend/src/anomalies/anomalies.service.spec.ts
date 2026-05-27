import { NotFoundException } from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';

describe('AnomaliesService', () => {
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
    service = new AnomaliesService(prisma as never);

    prisma.validationRule.upsert.mockImplementation(({ where }) =>
      Promise.resolve({ id: `rule-${where.code}`, code: where.code }),
    );
    prisma.anomaly.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: `anomaly-${data.type}`, ...data }),
    );
    prisma.anomaly.deleteMany.mockResolvedValue({ count: 0 });
    prisma.document.update.mockResolvedValue({});
  });

  it('creates only the first two required anomaly checks', async () => {
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
      ],
      vehicle: { fuelRatePer100km: 10 },
    });

    const result = await service.validateDocument('document-id');

    expect(result.checks).toEqual([
      'odometer_end_gt_start',
      'fuel_basic_check',
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
      ],
      vehicle: { fuelRatePer100km: 10 },
    });

    const result = await service.validateDocument('document-id');

    expect(result.anomaliesCount).toBe(0);
    expect(prisma.anomaly.deleteMany).toHaveBeenCalledWith({
      where: {
        documentId: 'document-id',
        type: { in: ['odometer_order', 'fuel_overrun'] },
      },
    });
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'document-id' },
      data: { hasAnomalies: false },
    });
  });

  it('throws when the document does not exist', async () => {
    prisma.document.findUnique.mockResolvedValue(null);

    await expect(service.validateDocument('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
