import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WorkoutPlan,
  WorkoutPlanDocument,
} from './schemas/workout-plan.schema';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { UpdateSessionFeedbackDto } from './dto/update-session-feedback.dto';
import { ClonePlanDto } from './dto/clone-plan.dto';

@Injectable()
export class WorkoutPlansService {
  constructor(
    @InjectModel(WorkoutPlan.name)
    private workoutPlanModel: Model<WorkoutPlanDocument>,
  ) {}

  async create(
    dto: CreateWorkoutPlanDto,
    coachId: string,
  ): Promise<WorkoutPlanDocument> {
    return this.workoutPlanModel.create({
      ...dto,
      athleteId: new Types.ObjectId(dto.athleteId),
      coachId: new Types.ObjectId(coachId),
    });
  }

  async findByAthlete(athleteId: string): Promise<WorkoutPlanDocument[]> {
    return this.workoutPlanModel
      .find({ athleteId: new Types.ObjectId(athleteId) })
      .sort({ startDate: -1 })
      .exec();
  }

  async findById(id: string): Promise<WorkoutPlanDocument> {
    const plan = await this.workoutPlanModel.findById(id);
    if (!plan) throw new NotFoundException('Workout plan not found');
    return plan;
  }

  async update(
    id: string,
    dto: Partial<CreateWorkoutPlanDto>,
    coachId: string,
  ): Promise<WorkoutPlanDocument> {
    const plan = await this.findById(id);
    if (plan.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your plan');
    }
    Object.assign(plan, dto);
    return plan.save();
  }

  async clone(
    id: string,
    dto: ClonePlanDto,
    coachId: string,
  ): Promise<WorkoutPlanDocument> {
    const original = await this.findById(id);
    if (original.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your plan');
    }

    const cloned = original.toObject();
    delete (cloned as any)._id;
    delete (cloned as any).createdAt;
    delete (cloned as any).updatedAt;

    // Reset athlete feedback on all sessions
    cloned.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        session.athleteFeedback = '';
        session.athletePerception = undefined as any;
        session.status = 'PLANNED' as any;
      });
    });

    return this.workoutPlanModel.create({
      ...cloned,
      athleteId: new Types.ObjectId(dto.targetAthleteId),
      coachId: new Types.ObjectId(coachId),
      name: `${original.name} (copy)`,
    });
  }

  async findTemplates(coachId: string): Promise<WorkoutPlanDocument[]> {
    return this.workoutPlanModel
      .find({ coachId: new Types.ObjectId(coachId), isTemplate: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async saveAsTemplate(
    id: string,
    coachId: string,
  ): Promise<WorkoutPlanDocument> {
    const original = await this.findById(id);
    if (original.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your plan');
    }

    const cloned = original.toObject();
    delete (cloned as any)._id;
    delete (cloned as any).createdAt;
    delete (cloned as any).updatedAt;

    // Reset athlete data on all sessions
    cloned.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        session.athleteFeedback = '';
        session.athletePerception = undefined as any;
        session.status = 'PLANNED' as any;
      });
    });

    return this.workoutPlanModel.create({
      ...cloned,
      athleteId: undefined,
      coachId: new Types.ObjectId(coachId),
      name: `[Plantilla] ${original.name}`,
      isTemplate: true,
    });
  }

  async createFromTemplate(
    templateId: string,
    targetAthleteId: string,
    coachId: string,
  ): Promise<WorkoutPlanDocument> {
    const template = await this.findById(templateId);
    if (template.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your template');
    }

    const cloned = template.toObject();
    delete (cloned as any)._id;
    delete (cloned as any).createdAt;
    delete (cloned as any).updatedAt;

    return this.workoutPlanModel.create({
      ...cloned,
      athleteId: new Types.ObjectId(targetAthleteId),
      coachId: new Types.ObjectId(coachId),
      name: template.name.replace('[Plantilla] ', ''),
      isTemplate: false,
    });
  }

  async getAthleteSummary(athleteId: string) {
    const plans = await this.workoutPlanModel
      .find({ athleteId: new Types.ObjectId(athleteId) })
      .sort({ startDate: -1 })
      .lean()
      .exec();

    return plans.map((plan) => {
      const weekStats = plan.weeks.map((week) => {
        const nonRest = week.sessions.filter((s) => s.type !== 'REST');
        const completed = nonRest.filter(
          (s) => s.status === 'COMPLETED',
        ).length;
        const skipped = nonRest.filter((s) => s.status === 'SKIPPED').length;
        const planned = nonRest.length;

        const rpeValues = nonRest
          .filter((s) => s.athletePerception)
          .map((s) => s.athletePerception);
        const avgRpe =
          rpeValues.length > 0
            ? Math.round(
                (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10,
              ) / 10
            : null;

        const totalDuration = week.sessions.reduce(
          (sum, s) => sum + (s.duration || 0),
          0,
        );
        const totalDistance = week.sessions.reduce(
          (sum, s) => sum + (s.distance || 0),
          0,
        );

        return {
          weekNumber: week.weekNumber,
          planned,
          completed,
          skipped,
          completionPct: planned > 0 ? Math.round((completed / planned) * 100) : 0,
          avgRpe,
          totalDuration,
          totalDistance: Math.round(totalDistance * 10) / 10,
        };
      });

      // Plan totals
      const totalPlanned = weekStats.reduce((s, w) => s + w.planned, 0);
      const totalCompleted = weekStats.reduce((s, w) => s + w.completed, 0);

      return {
        planId: plan._id,
        planName: plan.name,
        startDate: plan.startDate,
        endDate: plan.endDate,
        planNumber: plan.planNumber,
        overallCompletionPct:
          totalPlanned > 0
            ? Math.round((totalCompleted / totalPlanned) * 100)
            : 0,
        weekStats,
      };
    });
  }

  async remove(id: string, coachId: string): Promise<void> {
    const plan = await this.findById(id);
    if (plan.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your plan');
    }
    await this.workoutPlanModel.findByIdAndDelete(id);
  }

  async updateSessionFeedback(
    planId: string,
    weekNum: number,
    sessionIdx: number,
    dto: UpdateSessionFeedbackDto,
    athleteId: string,
  ): Promise<WorkoutPlanDocument> {
    const plan = await this.findById(planId);
    if (plan.athleteId.toString() !== athleteId) {
      throw new ForbiddenException('Not your plan');
    }

    const week = plan.weeks.find((w) => w.weekNumber === weekNum);
    if (!week) throw new NotFoundException('Week not found');

    const session = week.sessions[sessionIdx];
    if (!session) throw new NotFoundException('Session not found');

    if (dto.athleteFeedback !== undefined)
      session.athleteFeedback = dto.athleteFeedback;
    if (dto.athletePerception !== undefined)
      session.athletePerception = dto.athletePerception;
    if (dto.status !== undefined) session.status = dto.status;

    return plan.save();
  }
}
