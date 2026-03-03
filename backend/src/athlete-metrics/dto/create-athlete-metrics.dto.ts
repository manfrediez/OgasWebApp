import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EquipmentDto {
  @IsOptional()
  @IsString()
  watch?: string;

  @IsOptional()
  @IsString()
  heartRateBand?: string;

  @IsOptional()
  @IsString()
  bike?: string;
}

export class HRZoneRangeDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}

export class TestRecordDto {
  @IsString()
  type: string;

  @IsDateString()
  date: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  fcMax?: number;

  @IsOptional()
  @IsString()
  pace?: string;

  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;
}

export class HRZoneDetailedDto {
  @IsString()
  zone: string;

  @IsString()
  percentRange: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => HRZoneRangeDto)
  fcRange?: HRZoneRangeDto;

  @IsOptional()
  @IsString()
  sensation?: string;

  @IsOptional()
  @IsNumber()
  rpe?: number;
}

export class CreateAthleteMetricsDto {
  @IsString()
  athleteId: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  objectivesShortTerm?: string;

  @IsOptional()
  @IsString()
  objectivesMediumTerm?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EquipmentDto)
  equipment?: EquipmentDto;

  @IsOptional()
  @IsNumber()
  vam?: number;

  @IsOptional()
  @IsNumber()
  vt2?: number;

  @IsOptional()
  @IsNumber()
  fcMax?: number;

  @IsOptional()
  @IsDateString()
  lastTestDate?: string;

  @IsOptional()
  @IsString()
  residence?: string;

  @IsOptional()
  @IsNumber()
  weeklyAvailableHours?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredDays?: string[];

  @IsOptional()
  @IsBoolean()
  hasTrackAccess?: boolean;

  @IsOptional()
  @IsString()
  trackLocation?: string;

  @IsOptional()
  @IsString()
  limitations?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestRecordDto)
  testHistory?: TestRecordDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HRZoneDetailedDto)
  hrZonesDetailed?: HRZoneDetailedDto[];
}
