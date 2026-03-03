import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RaceStrategy,
  RaceStrategyDocument,
} from './schemas/race-strategy.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateRaceStrategyDto } from './dto/create-race-strategy.dto';
import { assertAccess, assertOwnerOrCoach } from '../common/helpers/access.helper';

@Injectable()
export class RaceStrategiesService {
  constructor(
    @InjectModel(RaceStrategy.name)
    private strategyModel: Model<RaceStrategyDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(
    dto: CreateRaceStrategyDto,
    coachId: string,
  ): Promise<RaceStrategyDocument> {
    return this.strategyModel.create({
      ...dto,
      athleteId: new Types.ObjectId(dto.athleteId),
      coachId: new Types.ObjectId(coachId),
    });
  }

  async findByAthlete(
    athleteId: string,
    requesterId: string,
    role: string,
  ) {
    await assertAccess(requesterId, role, athleteId, this.userModel);
    return this.strategyModel
      .find({ athleteId: new Types.ObjectId(athleteId) })
      .sort({ raceDate: -1 })
      .lean()
      .exec();
  }

  async findById(id: string): Promise<RaceStrategyDocument> {
    const strategy = await this.strategyModel.findById(id);
    if (!strategy) throw new NotFoundException('Race strategy not found');
    return strategy;
  }

  async findByIdWithAccess(id: string, requesterId: string, role: string) {
    const strategy = await this.strategyModel.findById(id).lean();
    if (!strategy) throw new NotFoundException('Race strategy not found');
    await assertOwnerOrCoach(
      requesterId,
      role,
      strategy.coachId.toString(),
      strategy.athleteId.toString(),
    );
    return strategy;
  }

  async update(
    id: string,
    dto: Partial<CreateRaceStrategyDto>,
    coachId: string,
  ): Promise<RaceStrategyDocument> {
    const strategy = await this.findById(id);
    if (strategy.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your strategy');
    }
    Object.assign(strategy, dto);
    return strategy.save();
  }

  async publish(id: string, coachId: string): Promise<RaceStrategyDocument> {
    const strategy = await this.findById(id);
    if (strategy.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your strategy');
    }
    strategy.isPublished = true;
    return strategy.save();
  }
}
