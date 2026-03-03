import { IsString, IsOptional, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  receiverId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;
}
