import {
  IsString,
  IsNumber,
  IsDateString,
  IsArray,
  IsOptional,
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
  objective?: string;

  @IsOptional()
  @IsString()
  paceZone?: string;

  @IsOptional()
  @IsString()
  technicalFocus?: string;

  @IsOptional()
  @IsString()
  strategicKey?: string;
}

export class CreateRaceStrategyDto {
  @IsString()
  athleteId: string;

  @IsString()
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
  preRaceActivation?: string;

  @IsOptional()
  @IsString()
  preRaceNotes?: string;

  @IsOptional()
  @IsString()
  generalTechnique?: string;
}
