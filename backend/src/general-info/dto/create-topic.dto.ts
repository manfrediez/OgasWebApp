import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
