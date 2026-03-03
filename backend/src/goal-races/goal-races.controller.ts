import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GoalRacesService } from './goal-races.service';
import { CreateGoalRaceDto } from './dto/create-goal-race.dto';
import { UpdateGoalRaceDto } from './dto/update-goal-race.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('goal-races')
@UseGuards(JwtAuthGuard)
export class GoalRacesController {
  constructor(private readonly goalRacesService: GoalRacesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  create(
    @Body() dto: CreateGoalRaceDto,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.goalRacesService.create(dto, coachId);
  }

  @Get('athlete/:athleteId')
  findByAthlete(@Param('athleteId') athleteId: string) {
    return this.goalRacesService.findByAthlete(athleteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.goalRacesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalRaceDto,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.goalRacesService.update(id, dto, coachId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('sub') coachId: string) {
    return this.goalRacesService.remove(id, coachId);
  }
}
