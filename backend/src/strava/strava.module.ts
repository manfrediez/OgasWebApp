import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from '../users/users.module';
import { ActivityDataModule } from '../activity-data/activity-data.module';
import { StravaService } from './strava.service';
import { StravaController } from './strava.controller';

@Module({
  imports: [HttpModule, UsersModule, forwardRef(() => ActivityDataModule)],
  controllers: [StravaController],
  providers: [StravaService],
  exports: [StravaService],
})
export class StravaModule {}
