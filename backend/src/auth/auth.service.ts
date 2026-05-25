/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  async register(dto: RegisterDto) {
    return { message: 'Пользователь зарегистрирован', user: dto };
  }
  async login(dto: LoginDto) {
    return { message: 'Пользователь аутентифицирован', user: dto };
  }
}
