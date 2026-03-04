import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RevokedTokenDocument = RevokedToken & Document;

@Schema({ timestamps: true })
export class RevokedToken {
  @Prop({ required: true, index: true })
  jti: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, index: true, expires: 0 })
  expiresAt: Date;
}

export const RevokedTokenSchema = SchemaFactory.createForClass(RevokedToken);
