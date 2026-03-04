import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { InviteAthleteDto } from './dto/invite-athlete.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ login: { ttl: 60000, limit: 3 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  invite(
    @Body() dto: InviteAthleteDto,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.authService.invite(dto, coachId);
  }

  @Post('accept-invite')
  @UseGuards(ThrottlerGuard)
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }
}
