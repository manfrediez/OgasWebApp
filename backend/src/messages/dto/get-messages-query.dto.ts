import { IsOptional, IsNumberString } from 'class-validator';

export class GetMessagesQueryDto {
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  skip?: string;
}
