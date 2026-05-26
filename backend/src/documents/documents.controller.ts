import { Controller, Get } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('list')
  async getDocumentsList() {
    return this.documentsService.getDocumentsList();
  }
}