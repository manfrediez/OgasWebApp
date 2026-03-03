import { IsString, IsNumber } from 'class-validator';

export class StravaWebhookDto {
  @IsString()
  object_type: string;

  @IsString()
  aspect_type: string;

  @IsNumber()
  object_id: number;

  @IsNumber()
  owner_id: number;
}
