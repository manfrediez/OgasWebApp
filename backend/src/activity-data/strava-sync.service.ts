import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { StravaService } from '../strava/strava.service';
import { ActivityDataService } from './activity-data.service';
import {
  WorkoutPlan,
  WorkoutPlanDocument,
} from '../workout-plans/schemas/workout-plan.schema';
import {
  AthleteMetrics,
  AthleteMetricsDocument,
} from '../athlete-metrics/schemas/athlete-metrics.schema';
import { WorkoutType, SessionStatus } from '../common/enums';

const STRAVA_TYPE_MAP: Record<string, WorkoutType[]> = {
  Run: [
    WorkoutType.CONTINUOUS,
    WorkoutType.INTERVAL,
    WorkoutType.ELEVATION,
    WorkoutType.QUALITY,
    WorkoutType.COMPETITION,
    WorkoutType.ACTIVATION,
  ],
  TrailRun: [
    WorkoutType.CONTINUOUS,
    WorkoutType.INTERVAL,
    WorkoutType.ELEVATION,
    WorkoutType.QUALITY,
    WorkoutType.COMPETITION,
    WorkoutType.ACTIVATION,
  ],
  VirtualRun: [
    WorkoutType.CONTINUOUS,
    WorkoutType.INTERVAL,
    WorkoutType.QUALITY,
    WorkoutType.ACTIVATION,
  ],
  Walk: [WorkoutType.CONTINUOUS, WorkoutType.ACTIVATION],
  Hike: [WorkoutType.ELEVATION, WorkoutType.CONTINUOUS],
  Ride: [WorkoutType.BIKE],
  VirtualRide: [WorkoutType.BIKE],
  WeightTraining: [WorkoutType.STRENGTH],
  Workout: [WorkoutType.STRENGTH, WorkoutType.ACTIVATION],
};

/** Convert a Date to 'YYYY-MM-DD' in Argentina timezone (UTC-3, no DST) */
function toArgentinaDateString(date: Date): string {
  const ms = date.getTime() - 3 * 60 * 60 * 1000; // UTC-3
  const ar = new Date(ms);
  const y = ar.getUTCFullYear();
  const m = String(ar.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ar.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class StravaSyncService {
  private readonly logger = new Logger(StravaSyncService.name);

  constructor(
    private usersService: UsersService,
    private stravaService: StravaService,
    private activityDataService: ActivityDataService,
    @InjectModel(WorkoutPlan.name)
    private workoutPlanModel: Model<WorkoutPlanDocument>,
    @InjectModel(AthleteMetrics.name)
    private athleteMetricsModel: Model<AthleteMetricsDocument>,
  ) {}

  async processWebhookEvent(event: {
    object_type: string;
    aspect_type: string;
    object_id: number;
    owner_id: number;
  }): Promise<void> {
    if (event.object_type !== 'activity') return;
    if (event.aspect_type !== 'create' && event.aspect_type !== 'update')
      return;

    const user = await this.usersService.findByStravaAthleteId(
      event.owner_id,
    );
    if (!user) {
      this.logger.warn(
        `No user found for Strava athlete ${event.owner_id}`,
      );
      return;
    }

    const userId = user._id.toString();
    const externalId = event.object_id.toString();

    // Dedup on create events
    if (event.aspect_type === 'create') {
      const existing = await this.activityDataService.findByExternalId(
        'strava',
        externalId,
      );
      if (existing) {
        this.logger.log(`Activity ${externalId} already exists, skipping`);
        return;
      }
    }

    const stravaActivity = await this.stravaService.fetchActivity(
      userId,
      event.object_id,
    );

    await this.processActivity(userId, stravaActivity);
  }

  /** Sync recent activities from Strava for a user */
  async syncRecentActivities(userId: string, days = 3): Promise<number> {
    const after = Math.floor(Date.now() / 1000) - days * 86400;
    const activities = await this.stravaService.fetchRecentActivities(
      userId,
      after,
      30,
    );

    this.logger.log(
      `Sync: fetched ${activities.length} recent activities for user=${userId} (last ${days} days)`,
    );

    let processed = 0;
    for (const summary of activities) {
      const externalId = summary.id.toString();
      const existing =
        await this.activityDataService.findByExternalId('strava', externalId);
      if (existing) continue;

      const full = await this.stravaService.fetchActivity(
        userId,
        summary.id,
      );
      await this.processActivity(userId, full);
      processed++;
    }

    this.logger.log(`Sync: processed ${processed} new activities for user=${userId}`);
    return processed;
  }

  /** Shared logic: save a Strava activity and attempt auto-match */
  private async processActivity(
    userId: string,
    stravaActivity: any,
  ): Promise<void> {
    const externalId = stravaActivity.id.toString();

    // Calculate derived metrics
    const distanceKm =
      stravaActivity.distance > 0 ? stravaActivity.distance / 1000 : 0;
    const averagePace =
      distanceKm > 0 ? stravaActivity.moving_time / distanceKm : 0;

    // Process splits
    const splits = (stravaActivity.splits_metric || []).map((s: any) => ({
      distance: s.distance,
      movingTime: s.moving_time,
      averageHeartRate: s.average_heartrate || 0,
      averagePace:
        s.distance > 0 ? s.moving_time / (s.distance / 1000) : 0,
      elevationDifference: s.elevation_difference || 0,
    }));

    // Calculate HR zones distribution
    let hrZonesDistribution: {
      z1: number;
      z2: number;
      z3: number;
      z4: number;
      z5: number;
    } | null = null;
    if (stravaActivity.has_heartrate) {
      hrZonesDistribution = await this.calculateHRZones(
        userId,
        stravaActivity,
      );
    }

    const activityData = {
      athleteId: new Types.ObjectId(userId),
      source: 'strava',
      externalId,
      type: stravaActivity.type,
      name: stravaActivity.name,
      startDate: new Date(stravaActivity.start_date),
      distance: stravaActivity.distance,
      movingTime: stravaActivity.moving_time,
      elapsedTime: stravaActivity.elapsed_time,
      totalElevationGain: stravaActivity.total_elevation_gain,
      averageHeartRate: stravaActivity.average_heartrate || undefined,
      maxHeartRate: stravaActivity.max_heartrate || undefined,
      averagePace: averagePace || undefined,
      averageCadence: stravaActivity.average_cadence || undefined,
      splits,
      map: stravaActivity.map?.summary_polyline
        ? { summaryPolyline: stravaActivity.map.summary_polyline }
        : null,
      hrZonesDistribution,
      stravaData: stravaActivity,
    };

    const saved = await this.activityDataService.upsertByExternalId(
      'strava',
      externalId,
      activityData,
    );

    // Auto-match if not already matched
    if (!saved.matched) {
      await this.autoMatch(saved._id.toString(), userId, stravaActivity);
    }
  }

  private async autoMatch(
    activityId: string,
    userId: string,
    stravaActivity: any,
  ) {
    try {
      const activityDateStr = toArgentinaDateString(
        new Date(stravaActivity.start_date),
      );
      const compatibleTypes = STRAVA_TYPE_MAP[stravaActivity.type] || [];

      this.logger.log(
        `AutoMatch START: activity=${activityId} stravaType=${stravaActivity.type} date=${activityDateStr} compatibleTypes=[${compatibleTypes.join(',')}]`,
      );

      if (compatibleTypes.length === 0) {
        this.logger.log(
          `AutoMatch SKIP: no compatible workout types for Strava type "${stravaActivity.type}"`,
        );
        return;
      }

      // Query plans that cover this date — use a day range in Argentina tz
      const dayStartUTC = new Date(`${activityDateStr}T03:00:00.000Z`); // 00:00 ARG = 03:00 UTC
      const dayEndUTC = new Date(`${activityDateStr}T26:59:59.999Z`.replace(/26/, '02')); // next day 02:59:59 UTC
      // Correct: next day 02:59:59.999 UTC = 23:59:59.999 ARG
      const nextDay = new Date(dayStartUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

      const plans = await this.workoutPlanModel
        .find({
          athleteId: new Types.ObjectId(userId),
          startDate: { $lte: nextDay },
          endDate: { $gte: dayStartUTC },
        })
        .exec();

      if (plans.length === 0) {
        this.logger.log(
          `AutoMatch SKIP: no plans found for user=${userId} covering date=${activityDateStr}`,
        );
        return;
      }

      this.logger.log(
        `AutoMatch: found ${plans.length} plan(s) covering date=${activityDateStr}`,
      );

      for (const plan of plans) {
        for (const week of plan.weeks) {
          for (let i = 0; i < week.sessions.length; i++) {
            const session = week.sessions[i];
            if (session.status !== 'PLANNED') continue;

            const sessionDateStr = toArgentinaDateString(
              new Date(session.date),
            );
            if (sessionDateStr !== activityDateStr) continue;

            const typeMatches =
              compatibleTypes.includes(session.type) ||
              (session.secondaryType &&
                compatibleTypes.includes(session.secondaryType));
            if (!typeMatches) continue;

            // Check no other activity is already matched to this session
            const existingMatch =
              await this.activityDataService.findBySessionInternal(
                plan._id.toString(),
                week.weekNumber,
                i,
              );
            if (existingMatch) continue;

            await this.activityDataService.matchToSessionInternal(
              activityId,
              plan._id.toString(),
              week.weekNumber,
              i,
            );

            // Mark session as completed
            session.status = SessionStatus.COMPLETED;
            await plan.save();

            this.logger.log(
              `AutoMatch SUCCESS: activity=${activityId} → plan=${plan._id} week=${week.weekNumber} session=${i} (type=${session.type}, secondary=${session.secondaryType || 'none'})`,
            );
            return;
          }
        }
      }

      this.logger.log(
        `AutoMatch FAIL: no matching session found for activity=${activityId} stravaType=${stravaActivity.type} date=${activityDateStr}`,
      );
    } catch (err) {
      this.logger.warn(
        `Auto-match error for activity ${activityId}: ${err.message}`,
        err.stack,
      );
    }
  }

  private async calculateHRZones(
    userId: string,
    stravaActivity: any,
  ): Promise<{ z1: number; z2: number; z3: number; z4: number; z5: number } | null> {
    const metrics = await this.athleteMetricsModel.findOne({
      athleteId: new Types.ObjectId(userId),
    });

    if (!metrics?.hrZones) return null;

    const zones = metrics.hrZones;
    const distribution = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

    // Use average HR and moving time for a rough estimate
    // (full stream-based calculation would need the streams endpoint)
    const avgHr = stravaActivity.average_heartrate;
    if (!avgHr) return null;

    const time = stravaActivity.moving_time;

    if (avgHr <= zones.z1.max) distribution.z1 = time;
    else if (avgHr <= zones.z2.max) distribution.z2 = time;
    else if (avgHr <= zones.z3.max) distribution.z3 = time;
    else if (avgHr <= zones.z4.max) distribution.z4 = time;
    else distribution.z5 = time;

    return distribution;
  }
}
