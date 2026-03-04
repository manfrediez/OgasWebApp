import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, StravaConnection } from './schemas/user.schema';
import {
  WorkoutPlan,
  WorkoutPlanDocument,
} from '../workout-plans/schemas/workout-plan.schema';
import {
  GoalRace,
  GoalRaceDocument,
} from '../goal-races/schemas/goal-race.schema';
import {
  Message,
  MessageDocument,
} from '../messages/schemas/message.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(WorkoutPlan.name)
    private workoutPlanModel: Model<WorkoutPlanDocument>,
    @InjectModel(GoalRace.name)
    private goalRaceModel: Model<GoalRaceDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByInviteToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      inviteToken: token,
      inviteExpires: { $gt: new Date() },
    });
  }

  async findAthletesByCoach(coachId: string): Promise<UserDocument[]> {
    return this.userModel
      .find({ coachId: new Types.ObjectId(coachId) })
      .select('-password')
      .exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async updateStravaTokens(
    userId: string,
    stravaData: StravaConnection,
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { strava: stravaData } },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async clearStravaConnection(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $unset: { strava: 1 } },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByStravaAthleteId(
    stravaAthleteId: number,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ 'strava.athleteId': stravaAthleteId });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getInactiveAthletes(coachId: string) {
    const athletes = await this.userModel
      .find({ coachId: new Types.ObjectId(coachId) })
      .select('-password')
      .lean();

    if (athletes.length === 0) return [];

    const athleteIds = athletes.map((a) => a._id);

    // Last completed session per athlete
    const lastActivity = await this.workoutPlanModel.aggregate([
      { $match: { athleteId: { $in: athleteIds } } },
      { $unwind: '$weeks' },
      { $unwind: '$weeks.sessions' },
      { $match: { 'weeks.sessions.status': 'COMPLETED' } },
      {
        $group: {
          _id: '$athleteId',
          lastActivityDate: { $max: '$weeks.sessions.date' },
          lastPlanName: { $last: '$name' },
        },
      },
      {
        $sort: { lastActivityDate: -1 },
      },
    ]);

    // Also get last session details (type + description) per athlete
    const lastSessionDetails = await this.workoutPlanModel.aggregate([
      { $match: { athleteId: { $in: athleteIds } } },
      { $unwind: '$weeks' },
      { $unwind: '$weeks.sessions' },
      { $match: { 'weeks.sessions.status': 'COMPLETED' } },
      { $sort: { 'weeks.sessions.date': -1 } },
      {
        $group: {
          _id: '$athleteId',
          lastSessionType: { $first: '$weeks.sessions.type' },
          lastSessionDescription: { $first: '$weeks.sessions.description' },
        },
      },
    ]);

    // Current plan per athlete (latest by startDate)
    const currentPlans = await this.workoutPlanModel.aggregate([
      { $match: { athleteId: { $in: athleteIds } } },
      { $sort: { startDate: -1 } },
      {
        $group: {
          _id: '$athleteId',
          currentPlanName: { $first: '$name' },
        },
      },
    ]);

    const activityMap = new Map(
      lastActivity.map((a) => [a._id.toString(), a]),
    );
    const detailsMap = new Map(
      lastSessionDetails.map((d) => [d._id.toString(), d]),
    );
    const planMap = new Map(
      currentPlans.map((p) => [p._id.toString(), p.currentPlanName]),
    );

    const now = new Date();

    const result = athletes.map((athlete) => {
      const aid = athlete._id.toString();
      const activity = activityMap.get(aid);
      const details = detailsMap.get(aid);

      let daysSinceLastActivity: number | null = null;
      if (activity?.lastActivityDate) {
        const diffMs =
          now.getTime() - new Date(activity.lastActivityDate).getTime();
        daysSinceLastActivity = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        _id: athlete._id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        email: athlete.email,
        isActive: athlete.isActive,
        lastActivityDate: activity?.lastActivityDate || null,
        daysSinceLastActivity,
        lastSessionType: details?.lastSessionType || null,
        lastSessionDescription: details?.lastSessionDescription || null,
        currentPlanName: planMap.get(aid) || null,
      };
    });

    // Sort: null (never active) first, then by most days of inactivity
    result.sort((a, b) => {
      if (a.daysSinceLastActivity === null && b.daysSinceLastActivity === null)
        return 0;
      if (a.daysSinceLastActivity === null) return -1;
      if (b.daysSinceLastActivity === null) return 1;
      return b.daysSinceLastActivity - a.daysSinceLastActivity;
    });

    return result;
  }

  async getAthletesGrid(
    coachId: string,
    pagination: PaginationQueryDto,
    search?: string,
  ): Promise<PaginatedResult<any>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: any = { coachId: new Types.ObjectId(coachId) };
    if (search) {
      const words = search
        .slice(0, 100)
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (words.length > 0) {
        filter.$and = words.map((word) => {
          const regex = new RegExp(word, 'i');
          return {
            $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
          };
        });
      }
    }

    const [athletes, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort({ lastName: 1, firstName: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    if (athletes.length === 0) return { data: [], total, page, limit };

    const athleteIds = athletes.map((a) => a._id);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Last completed session per athlete (for inactivity days)
    const lastActivity = await this.workoutPlanModel.aggregate([
      { $match: { athleteId: { $in: athleteIds } } },
      { $unwind: '$weeks' },
      { $unwind: '$weeks.sessions' },
      { $match: { 'weeks.sessions.status': 'COMPLETED' } },
      {
        $group: {
          _id: '$athleteId',
          lastActivityDate: { $max: '$weeks.sessions.date' },
        },
      },
    ]);

    // Distinct active days in last 30 days per athlete
    const activeDays = await this.workoutPlanModel.aggregate([
      { $match: { athleteId: { $in: athleteIds } } },
      { $unwind: '$weeks' },
      { $unwind: '$weeks.sessions' },
      {
        $match: {
          'weeks.sessions.status': 'COMPLETED',
          'weeks.sessions.date': { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$athleteId',
          dates: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$weeks.sessions.date' } } },
        },
      },
      {
        $project: {
          _id: 1,
          activeDaysCount: { $size: '$dates' },
        },
      },
    ]);

    // Next race per athlete (closest future race)
    const nextRaces = await this.goalRaceModel.aggregate([
      { $match: { athleteId: { $in: athleteIds }, date: { $gte: now } } },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: '$athleteId',
          raceName: { $first: '$name' },
          raceDate: { $first: '$date' },
          raceDistance: { $first: '$distance' },
        },
      },
    ]);

    const activityMap = new Map(
      lastActivity.map((a) => [a._id.toString(), a.lastActivityDate]),
    );
    const activeDaysMap = new Map(
      activeDays.map((a) => [a._id.toString(), a.activeDaysCount]),
    );
    const raceMap = new Map(
      nextRaces.map((r) => [r._id.toString(), r]),
    );

    const data = athletes.map((athlete) => {
      const aid = athlete._id.toString();
      const lastDate = activityMap.get(aid);
      let daysSinceLastActivity: number | null = null;
      if (lastDate) {
        const diffMs = now.getTime() - new Date(lastDate).getTime();
        daysSinceLastActivity = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
      const race = raceMap.get(aid);
      return {
        _id: athlete._id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        email: athlete.email,
        isActive: athlete.isActive,
        daysSinceLastActivity,
        activeDaysLast30: activeDaysMap.get(aid) || 0,
        nextRace: race
          ? { name: race.raceName, date: race.raceDate, distance: race.raceDistance }
          : null,
      };
    });

    return { data, total, page, limit };
  }

  async getAthletesSummary(coachId: string) {
    const athletes = await this.userModel
      .find({ coachId: new Types.ObjectId(coachId) })
      .select('-password')
      .lean();

    if (athletes.length === 0) return [];

    const athleteIds = athletes.map((a) => a._id);
    const coachOid = new Types.ObjectId(coachId);
    const now = new Date();

    // Get latest plan per athlete
    const latestPlans = await this.workoutPlanModel.aggregate([
      { $match: { athleteId: { $in: athleteIds } } },
      { $sort: { startDate: -1 } },
      {
        $group: {
          _id: '$athleteId',
          planName: { $first: '$name' },
          startDate: { $first: '$startDate' },
          endDate: { $first: '$endDate' },
          weeks: { $first: '$weeks' },
        },
      },
    ]);

    // Get next race per athlete (closest future race)
    const nextRaces = await this.goalRaceModel.aggregate([
      { $match: { athleteId: { $in: athleteIds }, date: { $gte: now } } },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: '$athleteId',
          raceName: { $first: '$name' },
          raceDate: { $first: '$date' },
          raceDistance: { $first: '$distance' },
        },
      },
    ]);

    // Get unread message count per athlete
    const unreadCounts = await this.messageModel.aggregate([
      {
        $match: {
          receiverId: coachOid,
          senderId: { $in: athleteIds },
          read: false,
        },
      },
      { $group: { _id: '$senderId', count: { $sum: 1 } } },
    ]);

    const planMap = new Map(
      latestPlans.map((p) => [p._id.toString(), p]),
    );
    const raceMap = new Map(
      nextRaces.map((r) => [r._id.toString(), r]),
    );
    const unreadMap = new Map(
      unreadCounts.map((u) => [u._id.toString(), u.count]),
    );

    return athletes.map((athlete) => {
      const aid = athlete._id.toString();
      const plan = planMap.get(aid);
      const race = raceMap.get(aid);

      // Compute session completion % from latest plan
      let completionPct = 0;
      if (plan?.weeks) {
        let total = 0;
        let completed = 0;
        for (const week of plan.weeks) {
          if (!week.sessions) continue;
          for (const session of week.sessions) {
            if (session.type !== 'REST') {
              total++;
              if (session.status === 'COMPLETED') completed++;
            }
          }
        }
        completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
      }

      return {
        ...athlete,
        currentPlan: plan
          ? {
              name: plan.planName,
              startDate: plan.startDate,
              endDate: plan.endDate,
            }
          : null,
        nextRace: race
          ? {
              name: race.raceName,
              date: race.raceDate,
              distance: race.raceDistance,
            }
          : null,
        completionPct,
        unreadMessages: unreadMap.get(aid) || 0,
      };
    });
  }
}
