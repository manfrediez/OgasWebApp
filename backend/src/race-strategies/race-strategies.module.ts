import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RaceStrategy,
  RaceStrategySchema,
} from './schemas/race-strategy.schema';
import { RaceStrategiesService } from './race-strategies.service';
import { RaceStrategiesController } from './race-strategies.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RaceStrategy.name, schema: RaceStrategySchema },
    ]),
  ],
  controllers: [RaceStrategiesController],
  providers: [RaceStrategiesService],
  exports: [RaceStrategiesService],
})
export class RaceStrategiesModule {}
