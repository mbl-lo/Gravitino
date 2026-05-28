import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Разрешить все источники (для разработки)
  app.enableCors({
    origin: true,
    credentials: true,
  })

  await app.listen(3000)
  console.log('API: http://localhost:3000')
}

bootstrap()