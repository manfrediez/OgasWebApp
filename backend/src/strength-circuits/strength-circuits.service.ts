import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StrengthCircuit,
  StrengthCircuitDocument,
} from './schemas/strength-circuit.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  WorkoutPlan,
  WorkoutPlanDocument,
} from '../workout-plans/schemas/workout-plan.schema';
import { CreateStrengthCircuitDto } from './dto/create-strength-circuit.dto';
import { assertOwnerOrCoach } from '../common/helpers/access.helper';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination-query.dto';

@Injectable()
export class StrengthCircuitsService {
  constructor(
    @InjectModel(StrengthCircuit.name)
    private circuitModel: Model<StrengthCircuitDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(WorkoutPlan.name)
    private workoutPlanModel: Model<WorkoutPlanDocument>,
  ) {}

  async create(
    dto: CreateStrengthCircuitDto,
    coachId: string,
  ): Promise<StrengthCircuitDocument> {
    const data: any = {
      ...dto,
      coachId: new Types.ObjectId(coachId),
    };
    if (dto.planId) {
      data.planId = new Types.ObjectId(dto.planId);
    }
    return this.circuitModel.create(data);
  }

  async findByPlan(
    planId: string,
    requesterId: string,
    role: string,
  ) {
    const plan = await this.workoutPlanModel
      .findById(planId)
      .select('coachId athleteId')
      .lean();
    if (!plan) throw new NotFoundException('Plan not found');
    await assertOwnerOrCoach(
      requesterId,
      role,
      plan.coachId.toString(),
      plan.athleteId?.toString() || '',
    );
    return this.circuitModel
      .find({ planId: new Types.ObjectId(planId) })
      .sort({ routineNumber: 1, circuitNumber: 1 })
      .lean()
      .exec();
  }

  async findAllByCoach(
    coachId: string,
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<any>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter = { coachId: new Types.ObjectId(coachId) };

    const [data, total] = await Promise.all([
      this.circuitModel
        .find(filter)
        .sort({ circuitNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.circuitModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string): Promise<StrengthCircuitDocument> {
    const circuit = await this.circuitModel.findById(id);
    if (!circuit) throw new NotFoundException('Strength circuit not found');
    return circuit;
  }

  async findByIdWithAccess(id: string, requesterId: string, role: string) {
    const circuit = await this.circuitModel.findById(id).lean();
    if (!circuit) throw new NotFoundException('Strength circuit not found');
    if (circuit.coachId.toString() !== requesterId) {
      throw new ForbiddenException('No tenés acceso a este circuito');
    }
    return circuit;
  }

  async update(
    id: string,
    dto: Partial<CreateStrengthCircuitDto>,
    coachId: string,
  ): Promise<StrengthCircuitDocument> {
    const circuit = await this.findById(id);
    if (circuit.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your circuit');
    }
    Object.assign(circuit, dto);
    return circuit.save();
  }

  async delete(id: string, coachId: string): Promise<void> {
    const circuit = await this.findById(id);
    if (circuit.coachId.toString() !== coachId) {
      throw new ForbiddenException('Not your circuit');
    }
    await this.circuitModel.findByIdAndDelete(id);
  }
}
