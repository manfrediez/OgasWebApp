import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { EmailService } from '../common/services/email.service';
import { LoginDto } from './dto/login.dto';
import { InviteAthleteDto } from './dto/invite-athlete.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account not active');

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email, user.role);
  }

  async invite(dto: InviteAthleteDto, coachId: string) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const inviteToken = uuidv4();
    const inviteExpires = new Date();
    inviteExpires.setDate(inviteExpires.getDate() + 7);

    const user = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: await bcrypt.hash(uuidv4(), 10), // placeholder
      role: Role.ATHLETE,
      coachId: coachId as any,
      isActive: false,
      inviteToken,
      inviteExpires,
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const inviteLink = `${frontendUrl}/accept-invite?token=${inviteToken}`;

    const emailSent = await this.emailService.sendInviteEmail(
      dto.email,
      dto.firstName,
      inviteLink,
    );

    return { inviteLink, athleteId: user.id, emailSent };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const user = await this.usersService.findByInviteToken(dto.inviteToken);
    if (!user) throw new BadRequestException('Invalid or expired invite token');

    user.password = await bcrypt.hash(dto.password, 10);
    user.isActive = true;
    user.inviteToken = undefined as any;
    user.inviteExpires = undefined as any;
    await user.save();

    return this.generateTokens(user.id, user.email, user.role);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    const passwordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!passwordValid) throw new UnauthorizedException('Contraseña actual incorrecta');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
    return { message: 'Contraseña actualizada' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    const { password, inviteToken, inviteExpires, ...result } = user.toObject();
    if (result.strava) {
      const { accessToken, refreshToken, expiresAt, ...safeStrava } =
        result.strava;
      result.strava = safeStrava as any;
    }
    return result;
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    };
  }
}
