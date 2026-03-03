import {
  IsString,
  IsNumber,
  IsDateString,
  IsArray,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSegmentDto {
  @IsNumber()
  fromKm: number;

  @IsNumber()
  toKm: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  objective?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paceZone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  technicalFocus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  strategicKey?: string;
}

export class CreateRaceStrategyDto {
  @IsString()
  athleteId: string;

  @IsString()
  @MaxLength(200)
  raceName: string;

  @IsDateString()
  raceDate: string;

  @IsNumber()
  totalDistance: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSegmentDto)
  segments?: CreateSegmentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preRaceActivation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preRaceNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  generalTechnique?: string;
}
