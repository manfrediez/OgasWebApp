import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AthleteMetricsDocument = HydratedDocument<AthleteMetrics>;

@Schema({ _id: false })
export class HRZoneRange {
  @Prop({ required: true })
  min: number;

  @Prop({ required: true })
  max: number;
}

const HRZoneRangeSchema = SchemaFactory.createForClass(HRZoneRange);

@Schema({ _id: false })
export class HRZones {
  @Prop({ type: HRZoneRangeSchema })
  z1: HRZoneRange;

  @Prop({ type: HRZoneRangeSchema })
  z2: HRZoneRange;

  @Prop({ type: HRZoneRangeSchema })
  z3: HRZoneRange;

  @Prop({ type: HRZoneRangeSchema })
  z4: HRZoneRange;

  @Prop({ type: HRZoneRangeSchema })
  z5: HRZoneRange;
}

const HRZonesSchema = SchemaFactory.createForClass(HRZones);

@Schema({ _id: false })
export class Equipment {
  @Prop({ default: '' })
  watch: string;

  @Prop({ default: '' })
  heartRateBand: string;

  @Prop({ default: '' })
  bike: string;
}

const EquipmentSchema = SchemaFactory.createForClass(Equipment);

@Schema({ _id: false })
export class TestRecord {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  value: number;

  @Prop()
  fcMax: number;

  @Prop()
  pace: string;

  @Prop()
  distance: number;

  @Prop({ min: 1, max: 10 })
  rpe: number;
}

const TestRecordSchema = SchemaFactory.createForClass(TestRecord);

@Schema({ _id: false })
export class HRZoneDetailed {
  @Prop({ required: true })
  zone: string;

  @Prop({ required: true })
  percentRange: string;

  @Prop({ type: HRZoneRangeSchema })
  fcRange: HRZoneRange;

  @Prop()
  sensation: string;

  @Prop()
  rpe: number;
}

const HRZoneDetailedSchema = SchemaFactory.createForClass(HRZoneDetailed);

@Schema({ timestamps: true })
export class AthleteMetrics {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  athleteId: Types.ObjectId;

  @Prop()
  age: number;

  @Prop({ default: '' })
  objectivesShortTerm: string;

  @Prop({ default: '' })
  objectivesMediumTerm: string;

  @Prop({ type: EquipmentSchema, default: () => ({}) })
  equipment: Equipment;

  @Prop()
  vam: number;

  @Prop()
  vt2: number;

  @Prop()
  fcMax: number;

  @Prop({ type: HRZonesSchema })
  hrZones: HRZones;

  @Prop()
  lastTestDate: Date;

  // Extended personal data
  @Prop()
  residence: string;

  @Prop()
  weeklyAvailableHours: number;

  @Prop({ type: [String], default: [] })
  preferredDays: string[];

  @Prop()
  hasTrackAccess: boolean;

  @Prop()
  trackLocation: string;

  @Prop()
  limitations: string;

  // Test history (VT2, VAM, 10K, etc.)
  @Prop({ type: [TestRecordSchema], default: [] })
  testHistory: TestRecord[];

  // Detailed HR zones with sensation and RPE per zone
  @Prop({ type: [HRZoneDetailedSchema], default: [] })
  hrZonesDetailed: HRZoneDetailed[];
}

export const AthleteMetricsSchema =
  SchemaFactory.createForClass(AthleteMetrics);
