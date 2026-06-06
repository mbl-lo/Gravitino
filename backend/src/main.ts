import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Разрешить все источники (для разработки)
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });

  await app.listen(3000);
  console.log('API: http://localhost:3000');
}

bootstrap();
