import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AthleteMetrics,
  AthleteMetricsDocument,
  HRZones,
} from './schemas/athlete-metrics.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateAthleteMetricsDto } from './dto/create-athlete-metrics.dto';
import { UpdateAthleteMetricsDto } from './dto/update-athlete-metrics.dto';
import { assertAccess } from '../common/helpers/access.helper';

@Injectable()
export class AthleteMetricsService {
  constructor(
    @InjectModel(AthleteMetrics.name)
    private metricsModel: Model<AthleteMetricsDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  calculateHRZones(fcMax: number): HRZones {
    return {
      z1: { min: Math.round(fcMax * 0.5), max: Math.round(fcMax * 0.6) },
      z2: { min: Math.round(fcMax * 0.6), max: Math.round(fcMax * 0.7) },
      z3: { min: Math.round(fcMax * 0.7), max: Math.round(fcMax * 0.8) },
      z4: { min: Math.round(fcMax * 0.8), max: Math.round(fcMax * 0.9) },
      z5: { min: Math.round(fcMax * 0.9), max: fcMax },
    };
  }

  async create(
    dto: CreateAthleteMetricsDto,
    requesterId: string,
    role: string,
  ): Promise<AthleteMetricsDocument> {
    await assertAccess(requesterId, role, dto.athleteId, this.userModel);
    const data: any = {
      ...dto,
      athleteId: new Types.ObjectId(dto.athleteId),
    };
    if (dto.fcMax) {
      data.hrZones = this.calculateHRZones(dto.fcMax);
    }
    return this.metricsModel.create(data);
  }

  async findByAthlete(
    athleteId: string,
    requesterId: string,
    role: string,
  ) {
    await assertAccess(requesterId, role, athleteId, this.userModel);
    const metrics = await this.metricsModel
      .findOne({ athleteId: new Types.ObjectId(athleteId) })
      .lean();
    if (!metrics) throw new NotFoundException('Athlete metrics not found');
    return metrics;
  }

  async update(
    id: string,
    dto: UpdateAthleteMetricsDto,
    requesterId: string,
    role: string,
  ): Promise<AthleteMetricsDocument> {
    const metrics = await this.metricsModel.findById(id);
    if (!metrics) throw new NotFoundException('Athlete metrics not found');
    await assertAccess(
      requesterId,
      role,
      metrics.athleteId.toString(),
      this.userModel,
    );

    Object.assign(metrics, dto);
    if (dto.fcMax) {
      metrics.hrZones = this.calculateHRZones(dto.fcMax);
    }
    return metrics.save();
  }
}
