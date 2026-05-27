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
        data: { ocrStatus: 'completed', ocrConfidence: confidence, status: 'processed' },
      }),
    ]);

    return { ...ocr, savedFields: fields.length, status: 'processed', ocrStatus: 'completed' };
  }
}