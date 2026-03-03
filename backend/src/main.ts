import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Validate critical secrets are not default/weak values
  const jwtSecret = configService.get<string>('JWT_SECRET', '');
  if (!jwtSecret || jwtSecret.startsWith('dev-') || jwtSecret.length < 32) {
    logger.warn(
      'JWT_SECRET is weak or using default value. Use a strong random secret in production.',
    );
  }
  const encryptionKey = configService.get<string>('ENCRYPTION_KEY', '');
  if (!encryptionKey || encryptionKey.length !== 64) {
    logger.warn(
      'ENCRYPTION_KEY is missing or invalid. Must be 64 hex characters (32 bytes).',
    );
  }

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
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
