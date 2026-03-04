import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const isProduction = process.env.NODE_ENV === 'production';

  // Validate critical secrets
  const jwtSecret = configService.get<string>('JWT_SECRET', '');
  if (!jwtSecret || jwtSecret.startsWith('dev-') || jwtSecret.length < 32) {
    const msg = 'JWT_SECRET is weak or using default value. Use a strong random secret in production.';
    if (isProduction) throw new Error(msg);
    logger.warn(msg);
  }
  const encryptionKey = configService.get<string>('ENCRYPTION_KEY', '');
  if (!encryptionKey || encryptionKey.length !== 64) {
    const msg = 'ENCRYPTION_KEY is missing or invalid. Must be 64 hex characters (32 bytes).';
    if (isProduction) throw new Error(msg);
    logger.warn(msg);
  }
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (!frontendUrl && isProduction) {
    throw new Error('FRONTEND_URL must be set in production.');
  }

  const frontendOrigin = frontendUrl || 'http://localhost:4200';
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", frontendOrigin],
        },
      },
    }),
  );
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  const port = process.env.PORT || configService.get<number>('APP_PORT', 3000);
  await app.listen(port);
}
bootstrap();
