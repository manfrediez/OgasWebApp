import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({ timestamps: true })
export class Topic {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  coachId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ default: 0 })
  order: number;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
TopicSchema.index({ coachId: 1, order: 1 });
