import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { OcrService } from './ocr.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnomaliesModule } from '../anomalies/anomalies.module';

@Module({
  imports: [AnomaliesModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, OcrService, PrismaService],
})
export class DocumentsModule {}