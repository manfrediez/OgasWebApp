import { IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  receiverId: string;

  @IsString()
  @MaxLength(2000)
  content: string;
}
