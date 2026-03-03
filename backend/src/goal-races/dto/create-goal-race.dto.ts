import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RaceResultDto {
  @IsOptional()
  @IsNumber()
  generalPosition?: number;

  @IsOptional()
  @IsNumber()
  categoryPosition?: number;

  @IsOptional()
  @IsString()
  time?: string;
}

export class CreateGoalRaceDto {
  @IsString()
  athleteId: string;

  @IsString()
  name: string;

  @IsString()
  distance: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RaceResultDto)
  result?: RaceResultDto;
}
