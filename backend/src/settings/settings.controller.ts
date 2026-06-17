import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingsService, SettingsDto } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get() {
    return this.settingsService.get();
  }

  @Post()
  save(@Body() dto: SettingsDto) {
    return this.settingsService.save(dto);
  }
}
