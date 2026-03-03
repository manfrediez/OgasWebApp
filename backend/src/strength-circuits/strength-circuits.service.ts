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
import { CreateStrengthCircuitDto } from './dto/create-strength-circuit.dto';

@Injectable()
export class StrengthCircuitsService {
  constructor(
    @InjectModel(StrengthCircuit.name)
    private circuitModel: Model<StrengthCircuitDocument>,
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

  async findByPlan(planId: string): Promise<StrengthCircuitDocument[]> {
    return this.circuitModel
      .find({ planId: new Types.ObjectId(planId) })
      .sort({ routineNumber: 1, circuitNumber: 1 })
      .exec();
  }

  async findAll(): Promise<StrengthCircuitDocument[]> {
    return this.circuitModel.find().sort({ circuitNumber: 1 }).exec();
  }

  async findById(id: string): Promise<StrengthCircuitDocument> {
    const circuit = await this.circuitModel.findById(id);
    if (!circuit) throw new NotFoundException('Strength circuit not found');
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
}
