import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StrengthCircuit,
  StrengthCircuitSchema,
} from './schemas/strength-circuit.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  WorkoutPlan,
  WorkoutPlanSchema,
} from '../workout-plans/schemas/workout-plan.schema';
import { StrengthCircuitsService } from './strength-circuits.service';
import { StrengthCircuitsController } from './strength-circuits.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StrengthCircuit.name, schema: StrengthCircuitSchema },
      { name: User.name, schema: UserSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
    ]),
  ],
  controllers: [StrengthCircuitsController],
  providers: [StrengthCircuitsService],
  exports: [StrengthCircuitsService],
})
export class StrengthCircuitsModule {}
