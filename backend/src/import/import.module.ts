import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WorkoutPlan,
  WorkoutPlanSchema,
} from '../workout-plans/schemas/workout-plan.schema';
import { GoalRace, GoalRaceSchema } from '../goal-races/schemas/goal-race.schema';
import {
  RaceStrategy,
  RaceStrategySchema,
} from '../race-strategies/schemas/race-strategy.schema';
import {
  StrengthCircuit,
  StrengthCircuitSchema,
} from '../strength-circuits/schemas/strength-circuit.schema';
import {
  AthleteMetrics,
  AthleteMetricsSchema,
} from '../athlete-metrics/schemas/athlete-metrics.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: GoalRace.name, schema: GoalRaceSchema },
      { name: RaceStrategy.name, schema: RaceStrategySchema },
      { name: StrengthCircuit.name, schema: StrengthCircuitSchema },
      { name: AthleteMetrics.name, schema: AthleteMetricsSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
