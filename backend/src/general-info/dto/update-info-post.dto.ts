import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class UpdateInfoPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeAttachments?: string[];
}
