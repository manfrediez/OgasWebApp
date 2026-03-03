import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ActivityData,
  ActivityDataSchema,
} from './schemas/activity-data.schema';
import {
  WorkoutPlan,
  WorkoutPlanSchema,
} from '../workout-plans/schemas/workout-plan.schema';
import {
  AthleteMetrics,
  AthleteMetricsSchema,
} from '../athlete-metrics/schemas/athlete-metrics.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ActivityDataController } from './activity-data.controller';
import { ActivityDataService } from './activity-data.service';
import { StravaSyncService } from './strava-sync.service';
import { StravaModule } from '../strava/strava.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityData.name, schema: ActivityDataSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: AthleteMetrics.name, schema: AthleteMetricsSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => StravaModule),
    UsersModule,
  ],
  controllers: [ActivityDataController],
  providers: [ActivityDataService, StravaSyncService],
  exports: [ActivityDataService, StravaSyncService],
})
export class ActivityDataModule {}
