import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ActivityData,
  ActivityDataDocument,
} from './schemas/activity-data.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { assertAccess } from '../common/helpers/access.helper';

@Injectable()
export class ActivityDataService {
  constructor(
    @InjectModel(ActivityData.name)
    private activityModel: Model<ActivityDataDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findByAthlete(
    athleteId: string,
    requesterId: string,
    role: string,
  ): Promise<ActivityDataDocument[]> {
    if (!Types.ObjectId.isValid(athleteId)) {
      throw new BadRequestException('Invalid athlete ID');
    }
    await assertAccess(requesterId, role, athleteId, this.userModel);
    return this.activityModel
      .find({ athleteId: new Types.ObjectId(athleteId) })
      .sort({ startDate: -1 })
      .exec();
  }

  async findBySession(
    planId: string,
    weekNumber: number,
    sessionIndex: number,
    requesterId: string,
    role: string,
  ): Promise<ActivityDataDocument | null> {
    const activity = await this.activityModel.findOne({
      planId: new Types.ObjectId(planId),
      weekNumber,
      sessionIndex,
      matched: true,
    });
    if (activity) {
      await assertAccess(
        requesterId,
        role,
        activity.athleteId.toString(),
        this.userModel,
      );
    }
    return activity;
  }

  async findById(
    id: string,
    requesterId: string,
    role: string,
  ): Promise<ActivityDataDocument> {
    const activity = await this.activityModel.findById(id);
    if (!activity) throw new NotFoundException('Activity not found');
    await assertAccess(
      requesterId,
      role,
      activity.athleteId.toString(),
      this.userModel,
    );
    return activity;
  }

  async findByExternalId(
    source: string,
    externalId: string,
  ): Promise<ActivityDataDocument | null> {
    return this.activityModel.findOne({ source, externalId });
  }

  /** Internal: no access control — for system-level sync only */
  async findBySessionInternal(
    planId: string,
    weekNumber: number,
    sessionIndex: number,
  ): Promise<ActivityDataDocument | null> {
    return this.activityModel.findOne({
      planId: new Types.ObjectId(planId),
      weekNumber,
      sessionIndex,
      matched: true,
    });
  }

  /** Internal: no access control — for system-level sync only */
  async matchToSessionInternal(
    id: string,
    planId: string,
    weekNumber: number,
    sessionIndex: number,
  ): Promise<ActivityDataDocument> {
    const updated = await this.activityModel.findByIdAndUpdate(
      id,
      {
        $set: {
          planId: new Types.ObjectId(planId),
          weekNumber,
          sessionIndex,
          matched: true,
          matchedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Activity not found');
    return updated;
  }

  async findUnmatchedWithAccess(
    athleteId: string,
    requesterId: string,
    role: string,
  ): Promise<ActivityDataDocument[]> {
    if (!Types.ObjectId.isValid(athleteId)) {
      throw new BadRequestException('Invalid athlete ID');
    }
    await assertAccess(requesterId, role, athleteId, this.userModel);
    return this.activityModel
      .find({
        athleteId: new Types.ObjectId(athleteId),
        matched: false,
      })
      .sort({ startDate: -1 })
      .exec();
  }

  async findUnmatched(athleteId: string): Promise<ActivityDataDocument[]> {
    return this.activityModel
      .find({
        athleteId: new Types.ObjectId(athleteId),
        matched: false,
      })
      .sort({ startDate: -1 })
      .exec();
  }

  async matchToSession(
    id: string,
    planId: string,
    weekNumber: number,
    sessionIndex: number,
    requesterId: string,
    role: string,
  ): Promise<ActivityDataDocument> {
    const activity = await this.activityModel.findById(id);
    if (!activity) throw new NotFoundException('Activity not found');
    await assertAccess(
      requesterId,
      role,
      activity.athleteId.toString(),
      this.userModel,
    );

    const updated = await this.activityModel.findByIdAndUpdate(
      id,
      {
        $set: {
          planId: new Types.ObjectId(planId),
          weekNumber,
          sessionIndex,
          matched: true,
          matchedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Activity not found');
    return updated;
  }

  async unmatch(
    id: string,
    requesterId: string,
    role: string,
  ): Promise<ActivityDataDocument> {
    const activity = await this.activityModel.findById(id);
    if (!activity) throw new NotFoundException('Activity not found');
    await assertAccess(
      requesterId,
      role,
      activity.athleteId.toString(),
      this.userModel,
    );

    const updated = await this.activityModel.findByIdAndUpdate(
      id,
      {
        $set: {
          planId: null,
          weekNumber: null,
          sessionIndex: null,
          matched: false,
          matchedAt: null,
        },
      },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Activity not found');
    return updated;
  }

  async create(data: Partial<ActivityData>): Promise<ActivityDataDocument> {
    return this.activityModel.create(data);
  }

  async upsertByExternalId(
    source: string,
    externalId: string,
    data: Partial<ActivityData>,
  ): Promise<ActivityDataDocument> {
    return this.activityModel.findOneAndUpdate(
      { source, externalId },
      { $set: data },
      { upsert: true, new: true },
    );
  }
}
