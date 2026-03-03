import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AthleteMetricsService } from './athlete-metrics.service';
import { CreateAthleteMetricsDto } from './dto/create-athlete-metrics.dto';
import { UpdateAthleteMetricsDto } from './dto/update-athlete-metrics.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('athlete-metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AthleteMetricsController {
  constructor(private readonly metricsService: AthleteMetricsService) {}

  @Post()
  @Roles(Role.COACH)
  create(
    @Body() dto: CreateAthleteMetricsDto,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.metricsService.create(dto, requesterId, role);
  }

  @Get('athlete/:athleteId')
  findByAthlete(
    @Param('athleteId') athleteId: string,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.metricsService.findByAthlete(athleteId, requesterId, role);
  }

  @Patch(':id')
  @Roles(Role.COACH)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAthleteMetricsDto,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.metricsService.update(id, dto, requesterId, role);
  }
}
