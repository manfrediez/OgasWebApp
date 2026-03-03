import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AthleteMetrics,
  AthleteMetricsDocument,
  HRZones,
} from './schemas/athlete-metrics.schema';
import { CreateAthleteMetricsDto } from './dto/create-athlete-metrics.dto';
import { UpdateAthleteMetricsDto } from './dto/update-athlete-metrics.dto';

@Injectable()
export class AthleteMetricsService {
  constructor(
    @InjectModel(AthleteMetrics.name)
    private metricsModel: Model<AthleteMetricsDocument>,
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

  async create(dto: CreateAthleteMetricsDto): Promise<AthleteMetricsDocument> {
    const data: any = {
      ...dto,
      athleteId: new Types.ObjectId(dto.athleteId),
    };
    if (dto.fcMax) {
      data.hrZones = this.calculateHRZones(dto.fcMax);
    }
    return this.metricsModel.create(data);
  }

  async findByAthlete(athleteId: string): Promise<AthleteMetricsDocument> {
    const metrics = await this.metricsModel.findOne({
      athleteId: new Types.ObjectId(athleteId),
    });
    if (!metrics) throw new NotFoundException('Athlete metrics not found');
    return metrics;
  }

  async update(
    id: string,
    dto: UpdateAthleteMetricsDto,
  ): Promise<AthleteMetricsDocument> {
    const metrics = await this.metricsModel.findById(id);
    if (!metrics) throw new NotFoundException('Athlete metrics not found');

    Object.assign(metrics, dto);
    if (dto.fcMax) {
      metrics.hrZones = this.calculateHRZones(dto.fcMax);
    }
    return metrics.save();
  }
}
