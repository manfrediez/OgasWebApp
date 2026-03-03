import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoalRace, GoalRaceDocument } from './schemas/goal-race.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateGoalRaceDto } from './dto/create-goal-race.dto';
import { UpdateGoalRaceDto } from './dto/update-goal-race.dto';
import { assertAccess, assertOwnerOrCoach } from '../common/helpers/access.helper';

@Injectable()
export class GoalRacesService {
  constructor(
    @InjectModel(GoalRace.name)
    private goalRaceModel: Model<GoalRaceDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(
    dto: CreateGoalRaceDto,
    coachId: string,
  ): Promise<GoalRaceDocument> {
    return this.goalRaceModel.create({
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
    return this.goalRaceModel
      .find({ athleteId: new Types.ObjectId(athleteId) })
      .sort({ date: 1 })
      .lean()
      .exec();
  }

  async findById(id: string): Promise<GoalRaceDocument> {
    const race = await this.goalRaceModel.findById(id);
    if (!race) throw new NotFoundException('Goal race not found');
    return race;
  }

  async findByIdWithAccess(id: string, requesterId: string, role: string) {
    const race = await this.goalRaceModel.findById(id).lean();
    if (!race) throw new NotFoundException('Goal race not found');
    await assertOwnerOrCoach(
      requesterId,
      role,
      race.coachId.toString(),
      race.athleteId.toString(),
    );
    return race;
  }

  async update(
    id: string,
    dto: UpdateGoalRaceDto,
    coachId: string,
  ): Promise<GoalRaceDocument> {
    const race = await this.findById(id);
    if (race.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your goal race');
    }
    Object.assign(race, dto);
    return race.save();
  }

  async remove(id: string, coachId: string): Promise<void> {
    const race = await this.findById(id);
    if (race.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your goal race');
    }
    await this.goalRaceModel.findByIdAndDelete(id);
  }
}
