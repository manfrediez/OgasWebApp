import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import {
  WorkoutPlan,
  WorkoutPlanSchema,
} from '../workout-plans/schemas/workout-plan.schema';
import {
  GoalRace,
  GoalRaceSchema,
} from '../goal-races/schemas/goal-race.schema';
import {
  Message,
  MessageSchema,
} from '../messages/schemas/message.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: GoalRace.name, schema: GoalRaceSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
