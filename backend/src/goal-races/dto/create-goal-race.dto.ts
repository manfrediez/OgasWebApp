import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  MaxLength,
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
  @MaxLength(20)
  time?: string;
}

export class CreateGoalRaceDto {
  @IsString()
  athleteId: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(50)
  distance: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RaceResultDto)
  result?: RaceResultDto;
}
