import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
