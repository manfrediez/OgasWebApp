import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkoutPlan, WorkoutPlanSchema } from './schemas/workout-plan.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { WorkoutPlansService } from './workout-plans.service';
import { WorkoutPlansController } from './workout-plans.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [WorkoutPlansController],
  providers: [WorkoutPlansService],
  exports: [WorkoutPlansService],
})
export class WorkoutPlansModule {}
