import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns accessToken and current user on valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'andrey@example.com',
      passwordHash,
      fullName: 'Andrey Lakh',
      role: 'admin',
      isActive: true,
      organizationId: 'organization-id',
      departmentId: 'department-id',
    });
    prisma.user.update.mockResolvedValue({});
    jwtService.signAsync.mockResolvedValue('signed.jwt.token');

    const result = await service.login({
      email: '  ANDREY@example.com ',
      password: 'password123',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'andrey@example.com' },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'andrey@example.com',
      role: 'admin',
      organizationId: 'organization-id',
    });
    expect(result).toEqual({
      accessToken: 'signed.jwt.token',
      user: {
        id: 'user-id',
        email: 'andrey@example.com',
        fullName: 'Andrey Lakh',
        role: 'admin',
        organizationId: 'organization-id',
        departmentId: 'department-id',
      },
    });
  });

  it('returns the JWT-authenticated profile for /auth/me', () => {
    expect(
      service.getProfile({
        id: 'user-id',
        email: 'andrey@example.com',
        fullName: 'Andrey Lakh',
        role: 'admin',
        organizationId: 'organization-id',
        departmentId: null,
      }),
    ).toEqual({
      id: 'user-id',
      email: 'andrey@example.com',
      fullName: 'Andrey Lakh',
      role: 'admin',
      organizationId: 'organization-id',
      departmentId: null,
    });
  });
});
