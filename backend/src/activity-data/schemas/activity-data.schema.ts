import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type ActivityDataDocument = HydratedDocument<ActivityData>;

@Schema({ _id: false })
export class Split {
  @Prop() distance: number;
  @Prop() movingTime: number;
  @Prop() averageHeartRate: number;
  @Prop() averagePace: number;
  @Prop() elevationDifference: number;
}

const SplitSchema = SchemaFactory.createForClass(Split);

@Schema({ _id: false })
export class ActivityMap {
  @Prop() summaryPolyline: string;
}

const ActivityMapSchema = SchemaFactory.createForClass(ActivityMap);

@Schema({ _id: false })
export class HRZonesDistribution {
  @Prop({ default: 0 }) z1: number;
  @Prop({ default: 0 }) z2: number;
  @Prop({ default: 0 }) z3: number;
  @Prop({ default: 0 }) z4: number;
  @Prop({ default: 0 }) z5: number;
}

const HRZonesDistributionSchema =
  SchemaFactory.createForClass(HRZonesDistribution);

@Schema({ timestamps: true })
export class ActivityData {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  athleteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WorkoutPlan', default: null })
  planId: Types.ObjectId | null;

  @Prop({ type: Number, default: null })
  weekNumber: number | null;

  @Prop({ type: Number, default: null })
  sessionIndex: number | null;

  @Prop({ required: true, enum: ['strava'] })
  source: string;

  @Prop({ required: true, index: true })
  externalId: string;

  @Prop() type: string;
  @Prop() name: string;
  @Prop() startDate: Date;
  @Prop() distance: number;
  @Prop() movingTime: number;
  @Prop() elapsedTime: number;
  @Prop() totalElevationGain: number;

  @Prop() averageHeartRate: number;
  @Prop() maxHeartRate: number;
  @Prop() averagePace: number;
  @Prop() averageCadence: number;

  @Prop({ type: [SplitSchema], default: [] })
  splits: Split[];

  @Prop({ type: ActivityMapSchema, default: null })
  map: ActivityMap | null;

  @Prop({ type: HRZonesDistributionSchema, default: null })
  hrZonesDistribution: HRZonesDistribution | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  stravaData: any;

  @Prop({ default: false })
  matched: boolean;

  @Prop({ type: Date, default: null })
  matchedAt: Date | null;
}

export const ActivityDataSchema = SchemaFactory.createForClass(ActivityData);

ActivityDataSchema.index({ source: 1, externalId: 1 }, { unique: true });
