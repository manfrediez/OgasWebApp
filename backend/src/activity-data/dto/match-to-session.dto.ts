import { IsInt, IsMongoId, Min } from 'class-validator';

export class MatchToSessionDto {
  @IsMongoId()
  planId: string;

  @IsInt()
  @Min(1)
  weekNumber: number;

  @IsInt()
  @Min(0)
  sessionIndex: number;
}
