import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RaceStrategyDocument = HydratedDocument<RaceStrategy>;

@Schema({ _id: false })
export class Segment {
  @Prop({ required: true })
  fromKm: number;

  @Prop({ required: true })
  toKm: number;

  @Prop({ default: '' })
  objective: string;

  @Prop({ default: '' })
  paceZone: string;

  @Prop({ default: '' })
  technicalFocus: string;

  @Prop({ default: '' })
  strategicKey: string;
}

export const SegmentSchema = SchemaFactory.createForClass(Segment);

@Schema({ timestamps: true })
export class RaceStrategy {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  athleteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  coachId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  raceName: string;

  @Prop({ required: true })
  raceDate: Date;

  @Prop({ required: true })
  totalDistance: number;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ type: [SegmentSchema], default: [] })
  segments: Segment[];

  // Pre-race preparation
  @Prop()
  preRaceActivation: string;

  @Prop()
  preRaceNotes: string;

  @Prop()
  generalTechnique: string;
}

export const RaceStrategySchema = SchemaFactory.createForClass(RaceStrategy);
RaceStrategySchema.index({ athleteId: 1, raceDate: -1 });
RaceStrategySchema.index({ coachId: 1 });
