import { Controller, Get, Post, Patch, Delete, Body, Param, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/current-user.decorator'
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async getAll() {
    return this.usersService.getAll();
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivate(@Param('id') id: string, @CurrentUser() admin: any) {

    return this.usersService.deactivate(id, admin.id );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() admin: any) {

    return this.usersService.remove(id, admin.id );
  }
}