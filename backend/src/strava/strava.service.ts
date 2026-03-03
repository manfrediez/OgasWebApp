import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createHmac } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../users/users.service';
import { encrypt, decrypt } from '../common/utils/encryption.util';

@Injectable()
export class StravaService {
  private readonly logger = new Logger(StravaService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly jwtSecret: string;
  private readonly encryptionKey: string;
  private readonly webhookVerifyToken: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private usersService: UsersService,
  ) {
    this.clientId = this.configService.get<string>('STRAVA_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>(
      'STRAVA_CLIENT_SECRET',
      '',
    );
    this.redirectUri = this.configService.get<string>(
      'STRAVA_REDIRECT_URI',
      '',
    );
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', '');
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY', '');
    this.webhookVerifyToken = this.configService.get<string>(
      'STRAVA_WEBHOOK_VERIFY_TOKEN',
      '',
    );

    const missing = [
      !this.clientId && 'STRAVA_CLIENT_ID',
      !this.clientSecret && 'STRAVA_CLIENT_SECRET',
      !this.redirectUri && 'STRAVA_REDIRECT_URI',
      !this.encryptionKey && 'ENCRYPTION_KEY',
    ].filter(Boolean);
    if (missing.length) {
      this.logger.warn(`Missing env vars for Strava: ${missing.join(', ')}`);
    }
  }

  getAuthUrl(userId: string): string {
    const state = this.signState(userId);
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'activity:read_all',
      state,
    });
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string) {
    const userId = this.verifyState(state);

    const { data } = await firstValueFrom(
      this.httpService.post('https://www.strava.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    );

    await this.usersService.updateStravaTokens(userId, {
      athleteId: data.athlete.id,
      accessToken: encrypt(data.access_token, this.encryptionKey),
      refreshToken: encrypt(data.refresh_token, this.encryptionKey),
      expiresAt: data.expires_at,
      connectedAt: new Date(),
    });

    return userId;
  }

  async disconnect(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user.strava) return;

    try {
      const accessToken = await this.getValidAccessToken(userId);
      await firstValueFrom(
        this.httpService.post(
          'https://www.strava.com/oauth/deauthorize',
          null,
          { params: { access_token: accessToken } },
        ),
      );
    } catch (err) {
      this.logger.warn(`Strava deauthorize failed for user ${userId}: ${err}`);
    }

    await this.usersService.clearStravaConnection(userId);
  }

  async getConnectionStatus(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user.strava) {
      return { connected: false };
    }
    return {
      connected: true,
      athleteId: user.strava.athleteId,
      connectedAt: user.strava.connectedAt,
    };
  }

  async getValidAccessToken(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    if (!user.strava) {
      throw new UnauthorizedException('Strava not connected');
    }

    const now = Math.floor(Date.now() / 1000);
    if (user.strava.expiresAt > now + 300) {
      return decrypt(user.strava.accessToken, this.encryptionKey);
    }

    // Refresh token
    const currentRefreshToken = decrypt(
      user.strava.refreshToken,
      this.encryptionKey,
    );
    const { data } = await firstValueFrom(
      this.httpService.post('https://www.strava.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: currentRefreshToken,
      }),
    );

    await this.usersService.updateStravaTokens(userId, {
      athleteId: user.strava.athleteId,
      accessToken: encrypt(data.access_token, this.encryptionKey),
      refreshToken: encrypt(data.refresh_token, this.encryptionKey),
      expiresAt: data.expires_at,
      connectedAt: user.strava.connectedAt,
    });

    return data.access_token;
  }

  async fetchActivity(userId: string, activityId: number) {
    const accessToken = await this.getValidAccessToken(userId);
    const { data } = await firstValueFrom(
      this.httpService.get(
        `https://www.strava.com/api/v3/activities/${activityId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    );
    return data;
  }

  async fetchActivityStreams(userId: string, activityId: number) {
    const accessToken = await this.getValidAccessToken(userId);
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `https://www.strava.com/api/v3/activities/${activityId}/streams`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              keys: 'heartrate,time,distance,altitude,cadence,latlng',
              key_type: 'stream',
            },
          },
        ),
      );
      return data;
    } catch {
      return [];
    }
  }

  validateWebhook(
    mode: string,
    verifyToken: string,
    challenge: string,
  ): { 'hub.challenge': string } | null {
    if (
      mode === 'subscribe' &&
      verifyToken === this.webhookVerifyToken
    ) {
      return { 'hub.challenge': challenge };
    }
    return null;
  }

  private signState(userId: string): string {
    const ts = Math.floor(Date.now() / 1000);
    const data = `${userId}.${ts}`;
    const hmac = createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest('hex');
    return `${data}.${hmac}`;
  }

  private verifyState(state: string): string {
    const parts = state.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid state parameter');
    }
    const [userId, tsStr, hmac] = parts;
    const data = `${userId}.${tsStr}`;
    const expected = createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest('hex');
    if (hmac !== expected) {
      throw new UnauthorizedException('Invalid state parameter');
    }
    const ts = parseInt(tsStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - ts > 600) {
      throw new UnauthorizedException('State expired');
    }
    return userId;
  }
}
