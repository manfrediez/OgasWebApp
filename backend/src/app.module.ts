import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkoutPlansModule } from './workout-plans/workout-plans.module';
import { AthleteMetricsModule } from './athlete-metrics/athlete-metrics.module';
import { RaceStrategiesModule } from './race-strategies/race-strategies.module';
import { StrengthCircuitsModule } from './strength-circuits/strength-circuits.module';
import { GoalRacesModule } from './goal-races/goal-races.module';
import { MessagesModule } from './messages/messages.module';
import { GeneralInfoModule } from './general-info/general-info.module';
import { StravaModule } from './strava/strava.module';
import { ActivityDataModule } from './activity-data/activity-data.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'frontend', 'dist', 'frontend', 'browser'),
      exclude: ['/api/(.*)'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    AuthModule,
    UsersModule,
    WorkoutPlansModule,
    AthleteMetricsModule,
    RaceStrategiesModule,
    StrengthCircuitsModule,
    GoalRacesModule,
    MessagesModule,
    GeneralInfoModule,
    StravaModule,
    ActivityDataModule,
    ImportModule,
  ],
})
export class AppModule {}
