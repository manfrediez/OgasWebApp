import {
  IsString,
  IsDateString,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutType, HRZone } from '../../common/enums';

export class CreateSessionDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsDateString()
  date: string;

  @IsEnum(WorkoutType)
  type: WorkoutType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsOptional()
  @IsEnum(HRZone)
  targetHRZone?: HRZone;

  @IsOptional()
  @IsString()
  coachNotes?: string;

  @IsOptional()
  @IsEnum(WorkoutType)
  secondaryType?: WorkoutType;

  @IsOptional()
  @IsString()
  secondaryDescription?: string;

  @IsOptional()
  @IsString()
  alternativeDescription?: string;

  @IsOptional()
  @IsString()
  alternativeLabel?: string;

  @IsOptional()
  @IsString()
  competitionName?: string;

  @IsOptional()
  @IsString()
  competitionDistance?: string;

  @IsOptional()
  @IsString()
  competitionLocation?: string;
}

export class CreateWeekDto {
  @IsNumber()
  @Min(1)
  @Max(4)
  weekNumber: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionDto)
  sessions: CreateSessionDto[];
}

export class WeeklyStimulusEntryDto {
  @IsString()
  activity: string;

  @IsArray()
  @IsBoolean({ each: true })
  days: boolean[];
}

export class CreateWorkoutPlanDto {
  @IsString()
  athleteId: string;

  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWeekDto)
  weeks: CreateWeekDto[];

  @IsOptional()
  @IsNumber()
  planNumber?: number;

  @IsOptional()
  @IsString()
  sport?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyStimulusEntryDto)
  weeklyStimuli?: WeeklyStimulusEntryDto[];

  @IsOptional()
  @IsNumber()
  totalWeeklyStimuli?: number;

  @IsOptional()
  @IsString()
  activationProtocol?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  generalNotes?: string[];

  @IsOptional()
  @IsString()
  coachConclusions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengthRoutines?: string[];
}
