import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class Attachment {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  storedName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

export type InfoPostDocument = HydratedDocument<InfoPost>;

@Schema({ timestamps: true })
export class InfoPost {
  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  coachId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 10000 })
  content: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Attachment[];
}

export const InfoPostSchema = SchemaFactory.createForClass(InfoPost);
InfoPostSchema.index({ topicId: 1, createdAt: -1 });
