import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoalRace, GoalRaceSchema } from './schemas/goal-race.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { GoalRacesService } from './goal-races.service';
import { GoalRacesController } from './goal-races.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoalRace.name, schema: GoalRaceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GoalRacesController],
  providers: [GoalRacesService],
  exports: [GoalRacesService],
})
export class GoalRacesModule {}
