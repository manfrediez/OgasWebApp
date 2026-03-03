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
import { WorkoutType } from '../common/enums';

const STRAVA_TYPE_MAP: Record<string, WorkoutType[]> = {
  Run: [
    WorkoutType.CONTINUOUS,
    WorkoutType.INTERVAL,
    WorkoutType.ELEVATION,
    WorkoutType.QUALITY,
    WorkoutType.COMPETITION,
    WorkoutType.ACTIVATION,
  ],
  Ride: [WorkoutType.BIKE],
  WeightTraining: [WorkoutType.STRENGTH],
  Workout: [WorkoutType.STRENGTH, WorkoutType.ACTIVATION],
};

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

    // Dedup on update events
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
    let hrZonesDistribution: { z1: number; z2: number; z3: number; z4: number; z5: number } | null = null;
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
      const activityDate = new Date(stravaActivity.start_date);
      activityDate.setHours(0, 0, 0, 0);

      const plans = await this.workoutPlanModel
        .find({
          athleteId: new Types.ObjectId(userId),
          startDate: { $lte: new Date(stravaActivity.start_date) },
          endDate: { $gte: activityDate },
        })
        .exec();

      const compatibleTypes = STRAVA_TYPE_MAP[stravaActivity.type] || [];

      for (const plan of plans) {
        for (const week of plan.weeks) {
          for (let i = 0; i < week.sessions.length; i++) {
            const session = week.sessions[i];
            if (session.status !== 'PLANNED') continue;

            const sessionDate = new Date(session.date);
            sessionDate.setHours(0, 0, 0, 0);

            if (sessionDate.getTime() !== activityDate.getTime()) continue;
            if (!compatibleTypes.includes(session.type)) continue;

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
            this.logger.log(
              `Auto-matched activity ${activityId} to plan ${plan._id} week ${week.weekNumber} session ${i}`,
            );
            return;
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Auto-match failed for activity ${activityId}: ${err}`);
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
