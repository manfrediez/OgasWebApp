import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StrengthCircuitDocument = HydratedDocument<StrengthCircuit>;

@Schema({ _id: false })
export class Exercise {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  sets: number;

  @Prop({ default: '' })
  reps: string;

  @Prop({ default: 0 })
  timerWork: number;

  @Prop({ default: 0 })
  timerRest: number;

  @Prop({ default: 0 })
  timerRounds: number;

  @Prop({ default: '' })
  notes: string;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);

@Schema({ timestamps: true })
export class StrengthCircuit {
  @Prop({ required: true })
  circuitNumber: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  coachId: Types.ObjectId;

  @Prop({ type: [ExerciseSchema], default: [] })
  exercises: Exercise[];

  // Optional link to a specific workout plan (null = global template)
  @Prop({ type: Types.ObjectId, ref: 'WorkoutPlan', default: null })
  planId: Types.ObjectId;

  // Routine number within a plan (1, 2, 3 for rotational routines)
  @Prop()
  routineNumber: number;

  // Timer format string (e.g. "40''X15''X16")
  @Prop()
  timerFormat: string;
}

export const StrengthCircuitSchema =
  SchemaFactory.createForClass(StrengthCircuit);
