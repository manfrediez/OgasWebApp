import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAthleteMetricsDto } from './create-athlete-metrics.dto';

export class UpdateAthleteMetricsDto extends PartialType(
  OmitType(CreateAthleteMetricsDto, ['athleteId'] as const),
) {}
