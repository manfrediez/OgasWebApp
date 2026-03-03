import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { WorkoutType, SessionStatus, HRZone } from '../../common/enums';

export type WorkoutPlanDocument = HydratedDocument<WorkoutPlan>;

@Schema({ _id: false })
export class Session {
  @Prop({ required: true })
  dayOfWeek: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: String, enum: WorkoutType, required: true })
  type: WorkoutType;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 0 })
  duration: number;

  @Prop()
  distance: number;

  @Prop({ type: String, enum: HRZone })
  targetHRZone: HRZone;

  @Prop({ default: '' })
  coachNotes: string;

  @Prop({ default: '' })
  athleteFeedback: string;

  @Prop({ min: 1, max: 10 })
  athletePerception: number;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.PLANNED })
  status: SessionStatus;

  // Secondary session (e.g. STRENGTH as complement to main running session)
  @Prop({ type: String, enum: WorkoutType })
  secondaryType: WorkoutType;

  @Prop()
  secondaryDescription: string;

  // Alternative workout (e.g. flat option when elevation is not available)
  @Prop()
  alternativeDescription: string;

  @Prop()
  alternativeLabel: string;

  // Competition data
  @Prop()
  competitionName: string;

  @Prop()
  competitionDistance: string;

  @Prop()
  competitionLocation: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

@Schema({ _id: false })
export class Week {
  @Prop({ required: true, min: 1, max: 4 })
  weekNumber: number;

  @Prop({ type: [SessionSchema], default: [] })
  sessions: Session[];
}

export const WeekSchema = SchemaFactory.createForClass(Week);

@Schema({ _id: false })
export class WeeklyStimulusEntry {
  @Prop({ required: true })
  activity: string;

  @Prop({ type: [Boolean], default: [] })
  days: boolean[];
}

export const WeeklyStimulusEntrySchema =
  SchemaFactory.createForClass(WeeklyStimulusEntry);

@Schema({ timestamps: true })
export class WorkoutPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  athleteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  coachId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: [WeekSchema], default: [] })
  weeks: Week[];

  // Mesocycle sequence number (3, 4, 5... 10)
  @Prop()
  planNumber: number;

  // Sport type (e.g. "RUNNING")
  @Prop()
  sport: string;

  // Weekly stimuli distribution matrix (activity x days)
  @Prop({ type: [WeeklyStimulusEntrySchema], default: [] })
  weeklyStimuli: WeeklyStimulusEntry[];

  // Total weekly stimuli count
  @Prop()
  totalWeeklyStimuli: number;

  // Global activation protocol (timer, mobility exercises)
  @Prop()
  activationProtocol: string;

  // General notes from coach (nutrition, hydration, etc.)
  @Prop({ type: [String], default: [] })
  generalNotes: string[];

  // Coach conclusions post-plan
  @Prop()
  coachConclusions: string;

  // Linked strength circuit IDs for this plan
  @Prop({ type: [Types.ObjectId], ref: 'StrengthCircuit', default: [] })
  strengthRoutines: Types.ObjectId[];

  // Template flag — templates have no athleteId and can be used to create new plans
  @Prop({ default: false })
  isTemplate: boolean;
}

export const WorkoutPlanSchema = SchemaFactory.createForClass(WorkoutPlan);
WorkoutPlanSchema.index({ athleteId: 1, startDate: -1 });
WorkoutPlanSchema.index({ coachId: 1 });
WorkoutPlanSchema.index({ isTemplate: 1, coachId: 1 });
