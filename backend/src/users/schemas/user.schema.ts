import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../../common/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class StravaConnection {
  @Prop() athleteId: number;
  @Prop() accessToken: string;
  @Prop() refreshToken: string;
  @Prop() expiresAt: number;
  @Prop() connectedAt: Date;
}

const StravaConnectionSchema = SchemaFactory.createForClass(StravaConnection);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ type: String, enum: Role, default: Role.ATHLETE })
  role: Role;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  coachId: Types.ObjectId;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: null })
  inviteToken: string;

  @Prop({ default: null })
  inviteExpires: Date;

  @Prop({ default: null })
  birthDate: Date;

  @Prop({ default: null, trim: true })
  phone: string;

  @Prop({ default: null, trim: true })
  address: string;

  @Prop({ type: StravaConnectionSchema, default: null })
  strava: StravaConnection | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ coachId: 1 });
