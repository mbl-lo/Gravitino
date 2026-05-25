import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [AuthModule, DocumentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
