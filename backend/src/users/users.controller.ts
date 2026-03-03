import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('athletes')
  @Roles(Role.COACH)
  findAthletes(@CurrentUser('sub') coachId: string) {
    return this.usersService.findAthletesByCoach(coachId);
  }

  @Get('athletes/summary')
  @Roles(Role.COACH)
  getAthletesSummary(@CurrentUser('sub') coachId: string) {
    return this.usersService.getAthletesSummary(coachId);
  }

  @Get('athletes/inactive')
  @Roles(Role.COACH)
  getInactiveAthletes(@CurrentUser('sub') coachId: string) {
    return this.usersService.getInactiveAthletes(coachId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    const { password, ...result } = user.toObject();
    return result;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
