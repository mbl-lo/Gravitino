import { Injectable, NotFoundException, BadRequestException   // === Training endpoints ===

  async getTrainingStatistics() {
    const totalFields = await this.prisma.documentField.count();
    const labeledFields = await this.prisma.documentField.count({
      where: {
        OR: [
          { correctedValue: { not: null } },
          { isEdited: true }
        ]
      }
    });
    const unlabeledFields = totalFields - labeledFields;

    // Documents that have at least one unlabeled field or are not confirmed
    const documentsPendingLabeling = await this.prisma.document.count({
      where: {
        OR: [
          { status: { not: 'confirmed' } },
          {
            fields: {
              some: {
                OR: [
                  { correctedValue: null },
                  { isEdited: false }
                ]
              }
            }
          }
        ]
      }
    });

    const lastTrainingDateResult = await this.prisma.document.findFirst({
      where: {
        isInTrainingSet: true
      },
      orderBy: {
        trainingSetAddedAt: 'desc'
      },
      select: {
        trainingSetAddedAt: true
      }
    });

    return {
      totalFields,
      labeledFields,
      unlabeledFields,
      documentsPendingLabeling,
      lastTrainingDate: lastTrainingDateResult?.trainingSetAddedAt || null
    };
  }

  async getTrainingDocumentsList(filters?: {
    search?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = {
      OR: [
        { status: { not: 'confirmed' } },
        {
          fields: {
            some: {
              OR: [
                { correctedValue: null },
                { isEdited: false }
              ]
            }
          }
        }
      ]
    };

    if (filters?.search) {
      where.OR = [
        { documentNumber: { contains: filters.search, mode: 'insensitive' } },
        { originalFileName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromDate) {
      where.createdAt = { gte: filters.fromDate };
    }

    if (filters?.toDate) {
      where.createdAt = { ...where.createdAt, lte: filters.toDate };
    }

    return this.prisma.document.findMany({
      where,
      include: {
        fields: true,
        anomalies: true,
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getTrainingDocument(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        fields: true,
        anomalies: true,
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        driver: true,
        vehicle: true
      }
    });

    if (!document) {
      throw new NotFoundException(`Документ с ID ${id} не найден`);
    }

    return document;
  }

  async confirmLabeling(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException(`Документ с ID ${id} не найден`);
    }

    // Check if all fields are labeled (have correctedValue or isEdited)
    const unlabeledFields = await this.prisma.documentField.count({
      where: {
        documentId: id,
        OR: [
          { correctedValue: null },
          { isEdited: false }
        ]
      }
    });

    if (unlabeledFields > 0) {
      throw new BadRequestException(
        `Невозможно подтвердить разметку: ${unlabeledFields} полей не размечены`
      );
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedById: userId
      }
    });

    await this.auditService.logAction({
      userId,
      entityType: 'Document',
      entityId: id,
      action: 'CONFIRMED_LABELING'
    });

    return updated;
  }

  async addToTrainingSet(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException(`Документ с ID ${id} не найден`);
    }

    if (document.isInTrainingSet) {
      throw new BadRequestException('Документ уже добавлен в обучающий набор');
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        isInTrainingSet: true,
        trainingSetAddedAt: new Date()
      }
    });

    await this.auditService.logAction({
      userId,
      entityType: 'Document',
      entityId: id,
      action: 'ADDED_TO_TRAINING_SET'
    });

    return updated;
  }
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(files: any[], body: any) {
    const uploadedById = body?.uploadedById ?? '33333333-3333-4333-8333-333333333334';
    const division = body?.division ?? 'Центральный парк';
    const documentType = body?.documentType ?? 'Путевой лист легкового автомобиля';
    const tripDate = body?.tripDate ? new Date(body.tripDate) : null;

    const createdDocuments = await Promise.all(
      files.map((file) =>
        this.prisma.document.create({
          data: {
            originalFileName: file.originalname,
            originalFileUrl: file.path,
            fileMimeType: file.mimetype,
            fileSize: file.size,
            uploadedById: uploadedById,
            ocrStatus: 'pending',
            status: 'processing',
            //division: division,
            tripDate: tripDate,
            //documentType: documentType,
          },
        })
      )
    );
    return {
      message: 'Файлы успешно загружены',
      files: createdDocuments,
    };
  }

  async getDocumentsList(filters?: {
    search?: string;
    status?: string;
    hasAnomalies?: boolean;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where = this.buildWhereClause(filters);

    return this.prisma.document.findMany({
      where: where,
      include: {
        fields: true,     
        anomalies: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async exportToJson(filters: {
    search?: string;
    status?: string;
    hasAnomalies?: boolean;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const documents = await this.getDocumentsList(filters);

    const formattedDocuments = documents.map(doc => {
      const fieldsObject = Object.fromEntries(
        (doc.fields ?? []).map((field) => [
          field.fieldKey,
          {
            label: field.fieldLabel,
            value: field.correctedValue ?? field.recognizedValue,
            isEdited: field.isEdited ?? false,
          },
        ])
      );

      return {
        id: doc.id,
        documentNumber: doc.documentNumber,
        status: doc.status,
        hasAnomalies: doc.hasAnomalies,
        ocrConfidence: doc.ocrConfidence,
        tripDate: doc.tripDate,
        createdAt: doc.createdAt,
        fields: fieldsObject,
        anomalies: doc.anomalies
      };
    });

    return {
      exportedAt: new Date().toISOString(),
      totalCount: formattedDocuments.length,
      documents: formattedDocuments, 
    };
  }

  private docToRow(doc: any) {
    const f = (key: string) => {
      const field = doc.fields?.find((f: any) => f.fieldKey === key);
      return field?.correctedValue ?? field?.recognizedValue ?? '';
    };
    const fuelValue = f('fuel_consumption') || f('fuel_used_liters');
    return {
      'Номер документа': doc.documentNumber ?? f('document_number') ?? '',
      'Дата': doc.tripDate ? new Date(doc.tripDate).toLocaleDateString('ru-RU') : f('date'),
      'Водитель': f('driver_name'),
      'Табельный номер': f('driver_number'),
      'Автомобиль': f('vehicle_model'),
      'Госномер': f('vehicle_plate'),
      'Маршрут': f('route'),
      'Пробег (км)': f('mileage'),
      'Расход топлива (л)': fuelValue,
      'Статус': doc.status,
      'Точность OCR (%)': doc.ocrConfidence ? (Number(doc.ocrConfidence) * 100).toFixed(1) : '',
      'Аномалии': doc.hasAnomalies ? 'Да' : 'Нет',
    };
  }

  async exportToCsv(filters: { search?: string; status?: string; hasAnomalies?: boolean; fromDate?: Date; toDate?: Date }) {
    const documents = await this.getDocumentsList(filters);
    const rows = documents.map(doc => this.docToRow(doc));
    if (rows.length === 0) return '\uFEFFНомер документа;Дата;Водитель\n';

    const headers = Object.keys(rows[0]);
    const lines = [
      '\uFEFF' + headers.join(';'),
      ...rows.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(';')),
    ];
    return lines.join('\n');
  }

  async exportToXlsx(filters: { search?: string; status?: string; hasAnomalies?: boolean; fromDate?: Date; toDate?: Date }): Promise<Buffer> {
    const documents = await this.getDocumentsList(filters);
    const rows = documents.map(doc => this.docToRow(doc));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Путевые листы');

    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key, width: 20 }));
      sheet.getRow(1).font = { bold: true };
      rows.forEach(row => sheet.addRow(row));
    }

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  private buildWhereClause(filters: any) {
    const where: any = {};
    
    if (filters?.search) {
      const searchString = filters.search.trim();
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(searchString);

      if (isUuid) {
        where.id = searchString;
      } else {
        where.OR = [
          { originalFileName: { contains: searchString, mode: 'insensitive' } },
          { documentNumber: { contains: searchString, mode: 'insensitive' } },
          { fields: { some: { recognizedValue: { contains: searchString, mode: 'insensitive' } } } },
          { fields: { some: { correctedValue: { contains: searchString, mode: 'insensitive' } } } }
        ];
      }
    }

    if (filters?.status) {
      where.status = filters.status;
    } else if (!where.id) {
      where.ocrStatus = { in: ['pending', 'processing', 'error', 'completed'] };
    }
    
    if (filters?.hasAnomalies !== undefined) {
      where.hasAnomalies = filters.hasAnomalies;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.tripDate = {};
      if (filters.fromDate) where.tripDate.gte = filters.fromDate;
      if (filters.toDate) {
        const endOfDay = new Date(filters.toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.tripDate.lte = endOfDay;
      }
    }

    return where;
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
      include: {
        fields: true,
        anomalies: true,
      },
    });

    if (!document) {
      return null;
    }

    return document;
  }
  
  async saveOcrResult(id: string, ocr: any) {
    await this.findOne(id);

    const confidence = parseFloat((ocr.ocr_accuracy / 100).toFixed(4));

    const fields: { fieldKey: string; fieldLabel: string; recognizedValue: string }[] = [
      { fieldKey: 'document_number',       fieldLabel: 'ID документа',                    recognizedValue: ocr.document_id },
      { fieldKey: 'date',                  fieldLabel: 'Дата',                             recognizedValue: ocr.date },
      { fieldKey: 'organization',          fieldLabel: 'Организация',                      recognizedValue: ocr.organization },
      { fieldKey: 'division',              fieldLabel: 'Подразделение',                    recognizedValue: ocr.division },
      { fieldKey: 'driver_name',           fieldLabel: 'Водитель',                         recognizedValue: ocr.driver.name },
      { fieldKey: 'driver_number',         fieldLabel: 'Табельный номер',                  recognizedValue: ocr.driver.employee_number },
      { fieldKey: 'vehicle_model',         fieldLabel: 'Автомобиль',                       recognizedValue: ocr.vehicle.model },
      { fieldKey: 'vehicle_plate',         fieldLabel: 'Госномер',                         recognizedValue: ocr.vehicle.license_plate },
      { fieldKey: 'route',                 fieldLabel: 'Маршрут',                          recognizedValue: ocr.route },
      { fieldKey: 'odometer_start',        fieldLabel: 'Спидометр при выезде',             recognizedValue: String(ocr.mileage.odometer_start) },
      { fieldKey: 'odometer_end',          fieldLabel: 'Спидометр при возвращении',        recognizedValue: String(ocr.mileage.odometer_end) },
      { fieldKey: 'mileage',              fieldLabel: 'Расчетный пробег',                  recognizedValue: String(ocr.mileage.calculated) },
      { fieldKey: 'fuel_start',            fieldLabel: 'Остаток топлива при выезде',       recognizedValue: String(ocr.fuel.start_balance) },
      { fieldKey: 'fuel_issued',           fieldLabel: 'Выдано топлива',                   recognizedValue: String(ocr.fuel.issued) },
      { fieldKey: 'fuel_end',              fieldLabel: 'Остаток топлива при возвращении',  recognizedValue: String(ocr.fuel.end_balance) },
      { fieldKey: 'fuel_consumption',      fieldLabel: 'Расчетный расход',                 recognizedValue: String(ocr.fuel.calculated_consumption) },
      { fieldKey: 'fuel_rate',             fieldLabel: 'Норма расхода',                    recognizedValue: `${ocr.fuel.consumption_rate} л/100км` },
      { fieldKey: 'fuel_deviation',        fieldLabel: 'Отклонение',                       recognizedValue: `+${ocr.fuel.deviation_percent}%` },
      { fieldKey: 'departure_time',        fieldLabel: 'Время выезда',                     recognizedValue: ocr.working_time.departure },
      { fieldKey: 'arrival_time',          fieldLabel: 'Время возвращения',                recognizedValue: ocr.working_time.arrival },
      { fieldKey: 'total_hours',           fieldLabel: 'Общее время работы',               recognizedValue: String(ocr.working_time.total_hours) },
      { fieldKey: 'downtime_hours',        fieldLabel: 'Время простоя',                    recognizedValue: String(ocr.working_time.downtime_hours) },
      { fieldKey: 'signature_driver',      fieldLabel: 'Подпись водителя',                 recognizedValue: ocr.signatures.driver ? 'Распознана' : 'Не распознана' },
      { fieldKey: 'signature_mechanic',    fieldLabel: 'Подпись механика',                 recognizedValue: ocr.signatures.mechanic ? 'Распознана' : 'Не распознана' },
      { fieldKey: 'signature_dispatcher',  fieldLabel: 'Подпись диспетчера',               recognizedValue: ocr.signatures.dispatcher ? 'Распознана' : 'Не распознана' },
      { fieldKey: 'medical_check',         fieldLabel: 'Медосмотр пройден',                recognizedValue: ocr.medical_check ? 'Да' : 'Нет' },
    ];

    await this.prisma.$transaction([
      ...fields.map((f) =>
        this.prisma.documentField.upsert({
          where: { documentId_fieldKey: { documentId: id, fieldKey: f.fieldKey } },
          create: { documentId: id, fieldKey: f.fieldKey, fieldLabel: f.fieldLabel, recognizedValue: f.recognizedValue, confidence },
          update: { fieldLabel: f.fieldLabel, recognizedValue: f.recognizedValue, confidence },
        }),
      ),
      this.prisma.document.update({
        where: { id },
        data: {
          ocrStatus: 'completed',
          ocrConfidence: confidence,
          status: 'processed',
          tripDate: ocr.date ? new Date(ocr.date) : undefined,
        },
      }),
    ]);

    return { ...ocr, savedFields: fields.length, status: 'processed', ocrStatus: 'completed' };
  }

  async updateFields(documentId: string, fieldKey: string, newValue: string, userId: string) {
    await this.findOne(documentId);

    const updatedFields = await this.prisma.documentField.upsert({
      where: {
        documentId_fieldKey: { documentId, fieldKey },
      },
      update: {
        correctedValue: newValue,
        isEdited: true,
      },
      create: {
        documentId,
        fieldKey,
        fieldLabel: fieldKey,
        recognizedValue: '',
        correctedValue: newValue,
        isEdited: true,
        confidence: 1.0,
      },
    });

    await this.auditService.logAction({
      userId,
      entityType: 'Document',
      entityId: documentId,
      action: 'FIELD_UPDATED',
      payload: {
        fieldKey,
        oldValue: updatedFields.recognizedValue,
        newValue,
      },
    });

    return updatedFields;
  }

  async confirm(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { anomalies: true },
    });

    if (!document) {
      throw new NotFoundException(`Документ с ID ${id} не найден`);
    }

    const criticalAnomalies = document.anomalies.filter(
      (a) => (a.severity === 'high' || a.severity === 'critical') && a.status === 'open',
    );

    if (criticalAnomalies.length > 0) {
      throw new BadRequestException(
        `Невозможно подтвердить документ: найдено ${criticalAnomalies.length} критических аномалий`,
      );
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    await this.auditService.logAction({
      userId,
      entityType: 'Document',
      entityId: id,
      action: 'CONFIRMED',
    });

    return updated;
  }
}