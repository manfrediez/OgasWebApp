import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RaceStrategy,
  RaceStrategySchema,
} from './schemas/race-strategy.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { RaceStrategiesService } from './race-strategies.service';
import { RaceStrategiesController } from './race-strategies.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RaceStrategy.name, schema: RaceStrategySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RaceStrategiesController],
  providers: [RaceStrategiesService],
  exports: [RaceStrategiesService],
})
export class RaceStrategiesModule {}
