import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExerciseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  sets?: number;

  @IsOptional()
  @IsString()
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
  notes?: string;
}

export class CreateStrengthCircuitDto {
  @IsNumber()
  circuitNumber: number;

  @IsString()
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
  timerFormat?: string;
}
