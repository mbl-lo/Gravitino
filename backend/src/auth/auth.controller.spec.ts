import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates POST /auth/login and returns the token payload', async () => {
    const response = {
      accessToken: 'signed.jwt.token',
      user: { id: 'user-id', email: 'andrey@example.com' },
    };
    authService.login.mockResolvedValue(response);

    await expect(
      controller.login({
        email: 'andrey@example.com',
        password: 'password123',
      }),
    ).resolves.toBe(response);
  });

  it('delegates GET /auth/me and returns the authenticated user', () => {
    const user = {
      id: 'user-id',
      email: 'andrey@example.com',
      fullName: 'Andrey Lakh',
      role: 'admin',
      organizationId: 'organization-id',
      departmentId: null,
    };
    authService.getProfile.mockReturnValue(user);

    expect(controller.me(user)).toBe(user);
  });
});
