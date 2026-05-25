import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async health() {
    const [organizations, documents, users] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.document.count(),
      this.prisma.user.count(),
    ]);

    return {
      status: 'ok',
      database: 'connected',
      counts: { organizations, documents, users },
    };
  }
}
