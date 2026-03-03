import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AthleteMetrics,
  AthleteMetricsSchema,
} from './schemas/athlete-metrics.schema';
import { AthleteMetricsService } from './athlete-metrics.service';
import { AthleteMetricsController } from './athlete-metrics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AthleteMetrics.name, schema: AthleteMetricsSchema },
    ]),
  ],
  controllers: [AthleteMetricsController],
  providers: [AthleteMetricsService],
  exports: [AthleteMetricsService],
})
export class AthleteMetricsModule {}
