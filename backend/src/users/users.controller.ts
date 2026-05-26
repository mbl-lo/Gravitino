import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async createUser(@Body() createUserDto: any) {
        return this.usersService.createUser(createUserDto);
    }

    @Get()
    async findAll() {
        return this.usersService.findAll();
    }
}