/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Имя минимум 2 символа' })
  @MaxLength(50)
  name!: string;

  @IsEmail({}, { message: 'Введите корректный email' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password!: string;
}
