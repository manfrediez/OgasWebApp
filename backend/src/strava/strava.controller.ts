import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { StravaService } from './strava.service';
import { StravaSyncService } from '../activity-data/strava-sync.service';
import { StravaWebhookDto } from './dto/strava-webhook.dto';

@Controller('strava')
export class StravaController {
  private readonly logger = new Logger(StravaController.name);

  constructor(
    private stravaService: StravaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => StravaSyncService))
    private stravaSyncService: StravaSyncService,
  ) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATHLETE)
  getAuthUrl(@CurrentUser('sub') userId: string) {
    return { url: this.stravaService.getAuthUrl(userId) };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    await this.stravaService.handleCallback(code, state);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return res.redirect(`${frontendUrl}/profile?strava=connected`);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATHLETE)
  @HttpCode(200)
  async disconnect(@CurrentUser('sub') userId: string) {
    await this.stravaService.disconnect(userId);
    return { disconnected: true };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATHLETE)
  getStatus(@CurrentUser('sub') userId: string) {
    return this.stravaService.getConnectionStatus(userId);
  }

  @Get('webhook')
  webhookValidation(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const result = this.stravaService.validateWebhook(
      mode,
      verifyToken,
      challenge,
    );
    if (!result) {
      throw new BadRequestException('Invalid verification');
    }
    return result;
  }

  @Post('webhook')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async webhookEvent(@Body() dto: StravaWebhookDto) {
    this.logger.log(
      `Strava webhook: ${dto.object_type}/${dto.aspect_type} id=${dto.object_id}`,
    );

    // Respond immediately, process async
    if (dto.object_type === 'activity') {
      this.stravaSyncService
        .processWebhookEvent(dto)
        .catch((err) =>
          this.logger.error(`Webhook processing error: ${err.message}`),
        );
    }

    return { received: true };
  }
}
