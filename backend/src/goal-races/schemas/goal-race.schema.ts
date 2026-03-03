import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GoalRaceDocument = HydratedDocument<GoalRace>;

@Schema({ _id: false })
export class RaceResult {
  @Prop()
  generalPosition: number;

  @Prop()
  categoryPosition: number;

  @Prop()
  time: string;
}

const RaceResultSchema = SchemaFactory.createForClass(RaceResult);

@Schema({ timestamps: true })
export class GoalRace {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  athleteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  coachId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  distance: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  location: string;

  @Prop({ type: RaceResultSchema })
  result: RaceResult;
}

export const GoalRaceSchema = SchemaFactory.createForClass(GoalRace);
GoalRaceSchema.index({ athleteId: 1, date: 1 });
GoalRaceSchema.index({ coachId: 1 });
