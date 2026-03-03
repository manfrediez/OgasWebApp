import { IsString, IsMongoId, MaxLength } from 'class-validator';

export class CreateInfoPostDto {
  @IsMongoId()
  topicId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(10000)
  content: string;
}
