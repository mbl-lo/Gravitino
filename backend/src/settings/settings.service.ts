import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SettingsDto {
  maxFuelDeviation: number;
  maxWorkingHours: number;
  checkOdometerConsistency: boolean;
  autoDetectAnomalies: boolean;
  enabledFields: Record<string, boolean>;
  ocrMode: string;
  minConfidence: number;
  autoManualReview: boolean;
  auditLog: boolean;
  dataRetentionMonths: number;
  enable2FA: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<SettingsDto> {
    const row = await this.prisma.systemSettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
    return this.toDto(row);
  }

  async save(dto: SettingsDto): Promise<SettingsDto> {
    const data = {
      maxFuelDeviation: dto.maxFuelDeviation,
      maxWorkingHours: dto.maxWorkingHours,
      checkOdometer: dto.checkOdometerConsistency,
      autoDetectAnomalies: dto.autoDetectAnomalies,
      fields: dto.enabledFields,
      ocrMode: dto.ocrMode,
      minConfidence: dto.minConfidence,
      autoManualReview: dto.autoManualReview,
      auditLog: dto.auditLog,
      dataRetention: dto.dataRetentionMonths,
      enable2FA: dto.enable2FA,
    };
    const row = await this.prisma.systemSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    return this.toDto(row);
  }

  private toDto(row: any): SettingsDto {
    return {
      maxFuelDeviation: row.maxFuelDeviation,
      maxWorkingHours: row.maxWorkingHours,
      checkOdometerConsistency: row.checkOdometer,
      autoDetectAnomalies: row.autoDetectAnomalies,
      enabledFields: (row.fields as Record<string, boolean>) ?? {},
      ocrMode: row.ocrMode,
      minConfidence: row.minConfidence,
      autoManualReview: row.autoManualReview,
      auditLog: row.auditLog,
      dataRetentionMonths: row.dataRetention,
      enable2FA: row.enable2FA,
    };
  }
}
