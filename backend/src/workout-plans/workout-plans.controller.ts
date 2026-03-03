import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkoutPlansService } from './workout-plans.service';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { UpdateSessionFeedbackDto } from './dto/update-session-feedback.dto';
import { ClonePlanDto } from './dto/clone-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('workout-plans')
@UseGuards(JwtAuthGuard)
export class WorkoutPlansController {
  constructor(private readonly workoutPlansService: WorkoutPlansService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  create(
    @Body() dto: CreateWorkoutPlanDto,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.workoutPlansService.create(dto, coachId);
  }

  @Get('templates')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  findTemplates(@CurrentUser('sub') coachId: string) {
    return this.workoutPlansService.findTemplates(coachId);
  }

  @Post(':id/save-as-template')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  saveAsTemplate(
    @Param('id') id: string,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.workoutPlansService.saveAsTemplate(id, coachId);
  }

  @Post(':id/create-from-template')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  createFromTemplate(
    @Param('id') id: string,
    @Body() dto: ClonePlanDto,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.workoutPlansService.createFromTemplate(
      id,
      dto.targetAthleteId,
      coachId,
    );
  }

  @Get('athlete/:athleteId')
  findByAthlete(
    @Param('athleteId') athleteId: string,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.workoutPlansService.findByAthlete(
      athleteId,
      requesterId,
      role,
      pagination,
    );
  }

  @Get('athlete/:athleteId/summary')
  getAthleteSummary(
    @Param('athleteId') athleteId: string,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.workoutPlansService.getAthleteSummary(
      athleteId,
      requesterId,
      role,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.workoutPlansService.findByIdWithAccess(id, requesterId, role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateWorkoutPlanDto>,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.workoutPlansService.update(id, dto, coachId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.workoutPlansService.remove(id, coachId);
  }

  @Post(':id/clone')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  clone(
    @Param('id') id: string,
    @Body() dto: ClonePlanDto,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.workoutPlansService.clone(id, dto, coachId);
  }

  @Patch(':planId/weeks/:weekNum/sessions/:sessionIdx/feedback')
  @UseGuards(RolesGuard)
  @Roles(Role.ATHLETE)
  updateFeedback(
    @Param('planId') planId: string,
    @Param('weekNum') weekNum: string,
    @Param('sessionIdx') sessionIdx: string,
    @Body() dto: UpdateSessionFeedbackDto,
    @CurrentUser('sub') athleteId: string,
  ) {
    return this.workoutPlansService.updateSessionFeedback(
      planId,
      +weekNum,
      +sessionIdx,
      dto,
      athleteId,
    );
  }
}
