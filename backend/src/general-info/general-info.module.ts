import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { InfoPost, InfoPostSchema } from './schemas/info-post.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { GeneralInfoController } from './general-info.controller';
import { GeneralInfoService } from './general-info.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: InfoPost.name, schema: InfoPostSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GeneralInfoController],
  providers: [GeneralInfoService],
})
export class GeneralInfoModule {}
