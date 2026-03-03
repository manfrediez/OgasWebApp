import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { SessionStatus } from '../../common/enums';

export class UpdateSessionFeedbackDto {
  @IsOptional()
  @IsString()
  athleteFeedback?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  athletePerception?: number;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
