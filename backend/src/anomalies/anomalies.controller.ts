import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';

@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get('document/:documentId')
  async getDocumentAnomalies(@Param('documentId') documentId: string) {
    return this.anomaliesService.getDocumentAnomalies(documentId);
  }

  @Post('document/:documentId/validate')
  async validateDocument(@Param('documentId') documentId: string) {
    return this.anomaliesService.validateDocument(documentId);
  }

  @Patch(':id/reject')
  async rejectAnomaly(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.anomaliesService.rejectAnomaly(id, userId);
  }
}