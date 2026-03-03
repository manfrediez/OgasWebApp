import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { StrengthCircuitsService } from './strength-circuits.service';
import { CreateStrengthCircuitDto } from './dto/create-strength-circuit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('strength-circuits')
@UseGuards(JwtAuthGuard)
export class StrengthCircuitsController {
  constructor(private readonly circuitsService: StrengthCircuitsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  create(
    @Body() dto: CreateStrengthCircuitDto,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.circuitsService.create(dto, coachId);
  }

  @Get()
  findAll() {
    return this.circuitsService.findAll();
  }

  @Get('plan/:planId')
  findByPlan(@Param('planId') planId: string) {
    return this.circuitsService.findByPlan(planId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.circuitsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.COACH)
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateStrengthCircuitDto>,
    @CurrentUser('sub') coachId: string,
  ) {
    return this.circuitsService.update(id, dto, coachId);
  }
}
