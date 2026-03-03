import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('athletes')
  @Roles(Role.COACH)
  findAthletes(@CurrentUser('sub') coachId: string) {
    return this.usersService.findAthletesByCoach(coachId);
  }

  @Get('athletes/summary')
  @Roles(Role.COACH)
  getAthletesSummary(@CurrentUser('sub') coachId: string) {
    return this.usersService.getAthletesSummary(coachId);
  }

  @Get('athletes/grid')
  @Roles(Role.COACH)
  getAthletesGrid(
    @CurrentUser('sub') coachId: string,
    @Query() pagination: PaginationQueryDto,
    @Query('search') search?: string,
  ) {
    return this.usersService.getAthletesGrid(coachId, pagination, search);
  }

  @Get('athletes/inactive')
  @Roles(Role.COACH)
  getInactiveAthletes(@CurrentUser('sub') coachId: string) {
    return this.usersService.getInactiveAthletes(coachId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
  ) {
    const user = await this.usersService.findById(id);
    if (role === Role.ATHLETE && requesterId !== id) {
      throw new ForbiddenException('No tenés acceso a estos datos');
    }
    if (role === Role.COACH && requesterId !== id) {
      if (user.coachId?.toString() !== requesterId) {
        throw new ForbiddenException('No tenés acceso a estos datos');
      }
    }
    const { password, ...result } = user.toObject();
    // Strip sensitive Strava tokens, only expose public fields
    if (result.strava) {
      (result as any).strava = {
        athleteId: result.strava.athleteId,
        connectedAt: result.strava.connectedAt,
      };
    }
    return result;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') requesterId: string,
  ) {
    if (requesterId !== id) {
      throw new ForbiddenException('Solo podés editar tu propio perfil');
    }
    return this.usersService.update(id, dto);
  }
}
