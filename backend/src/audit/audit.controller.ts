import { Controller, Get, Query, ParseUUIDPipe } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId', new ParseUUIDPipe({ version: '4', optional: true }))
    entityId?: string,
    @Query('userId', new ParseUUIDPipe({ version: '4', optional: true }))
    userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getLogs({
      entityType,
      entityId,
      userId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('document-history')
  async getDocumentHistory(
    @Query('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ) {
    return this.auditService.getDocumentHistory(documentId);
  }
}
