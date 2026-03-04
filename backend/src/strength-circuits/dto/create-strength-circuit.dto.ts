import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExerciseDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsNumber()
  sets?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  reps?: string;

  @IsOptional()
  @IsNumber()
  timerWork?: number;

  @IsOptional()
  @IsNumber()
  timerRest?: number;

  @IsOptional()
  @IsNumber()
  timerRounds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;
}

export class CreateStrengthCircuitDto {
  @IsNumber()
  circuitNumber: number;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseDto)
  exercises?: CreateExerciseDto[];

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsNumber()
  routineNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timerFormat?: string;
}
