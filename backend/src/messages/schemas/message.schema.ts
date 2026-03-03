import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ default: false })
  read: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, read: 1 });
