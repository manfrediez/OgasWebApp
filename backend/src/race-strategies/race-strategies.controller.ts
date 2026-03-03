import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RaceStrategiesService } from './race-strategies.service';
import { CreateRaceStrategyDto } from './dto/create-race-strategy.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('race-strategies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RaceStrategiesController {
  constructor(private readonly strategiesService: RaceStrategiesService) {}

  @Post()
  @Roles(Role.COACH)
  create(
    @Body() dto: CreateRaceStrategyDto,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.strategiesService.create(dto, coachId);
  }

  @Get('athlete/:athleteId')
  findByAthlete(
    @Param('athleteId') athleteId: string,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.strategiesService.findByAthlete(athleteId, requesterId, role);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.strategiesService.findByIdWithAccess(id, requesterId, role);
  }

  @Patch(':id')
  @Roles(Role.COACH)
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRaceStrategyDto>,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.strategiesService.update(id, dto, coachId);
  }

  @Patch(':id/publish')
  @Roles(Role.COACH)
  publish(@Param('id') id: string, @CurrentUser('sub') coachId: string) {
    return this.strategiesService.publish(id, coachId);
  }
}
