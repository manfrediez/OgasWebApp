import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateGoalRaceDto } from './create-goal-race.dto';

export class UpdateGoalRaceDto extends PartialType(
  OmitType(CreateGoalRaceDto, ['athleteId'] as const),
) {}
