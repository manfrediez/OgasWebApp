import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.enableCors({
    origin: frontendUrl || 'http://localhost:4200',
    credentials: true,
  });

  const port = process.env.PORT || configService.get<number>('APP_PORT', 3000);
  await app.listen(port);
}
bootstrap();
