import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    private users: any[] = [];

    async createUser(createUserDTO: any) {
        const {email, password, name, role} = createUserDTO;

        const candidate = this.users.find(u => u.email === email);
        if (candidate) {
            throw new BadRequestException('Пользователь с таким email уже существует');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: String(this.users.length + 1),
            email,
            password: hashedPassword,
            name,
            role: role || 'user',
            createdAt: new Date(),
        };

        this.users.push(newUser);

        const { password: _, ...result} = newUser;
        return result;
    } 

    async findAll() {
        return this.users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
    }

    async findByEmail(email: string) {
        return this.users.find(u => u.email === email);
    }
}
