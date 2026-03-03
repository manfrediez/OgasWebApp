import { IsString } from 'class-validator';

export class ClonePlanDto {
  @IsString()
  targetAthleteId: string;
}
