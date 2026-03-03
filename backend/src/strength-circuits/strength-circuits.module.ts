import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StrengthCircuit,
  StrengthCircuitSchema,
} from './schemas/strength-circuit.schema';
import { StrengthCircuitsService } from './strength-circuits.service';
import { StrengthCircuitsController } from './strength-circuits.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StrengthCircuit.name, schema: StrengthCircuitSchema },
    ]),
  ],
  controllers: [StrengthCircuitsController],
  providers: [StrengthCircuitsService],
  exports: [StrengthCircuitsService],
})
export class StrengthCircuitsModule {}
