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
import { Role } from '../common/enums';

@Controller('athlete-metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AthleteMetricsController {
  constructor(private readonly metricsService: AthleteMetricsService) {}

  @Post()
  @Roles(Role.COACH)
  create(@Body() dto: CreateAthleteMetricsDto) {
    return this.metricsService.create(dto);
  }

  @Get('athlete/:athleteId')
  findByAthlete(@Param('athleteId') athleteId: string) {
    return this.metricsService.findByAthlete(athleteId);
  }

  @Patch(':id')
  @Roles(Role.COACH)
  update(@Param('id') id: string, @Body() dto: UpdateAthleteMetricsDto) {
    return this.metricsService.update(id, dto);
  }
}
