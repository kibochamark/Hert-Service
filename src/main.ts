import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://hertventures.com',
      'https://www.hertventures.com',
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
