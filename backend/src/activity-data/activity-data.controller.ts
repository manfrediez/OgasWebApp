import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActivityDataService } from './activity-data.service';
import { MatchToSessionDto } from './dto/match-to-session.dto';

@Controller('activity-data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityDataController {
  constructor(private activityDataService: ActivityDataService) {}

  @Get('athlete/:athleteId')
  getByAthlete(
    @Param('athleteId') athleteId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.activityDataService.findByAthlete(athleteId, userId, role);
  }

  @Get('session/:planId/:weekNum/:sessionIdx')
  getBySession(
    @Param('planId') planId: string,
    @Param('weekNum') weekNum: string,
    @Param('sessionIdx') sessionIdx: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.activityDataService.findBySession(
      planId,
      +weekNum,
      +sessionIdx,
      userId,
      role,
    );
  }

  @Get('unmatched/:athleteId')
  getUnmatched(
    @Param('athleteId') athleteId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.activityDataService.findUnmatchedWithAccess(
      athleteId,
      userId,
      role,
    );
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.activityDataService.findById(id, userId, role);
  }

  @Post(':id/match')
  @HttpCode(200)
  matchToSession(
    @Param('id') id: string,
    @Body() dto: MatchToSessionDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.activityDataService.matchToSession(
      id,
      dto.planId,
      dto.weekNumber,
      dto.sessionIndex,
      userId,
      role,
    );
  }

  @Delete(':id/match')
  unmatch(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.activityDataService.unmatch(id, userId, role);
  }
}
