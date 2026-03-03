import { ForbiddenException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Role } from '../enums';

export async function assertAccess(
  requesterId: string,
  requesterRole: string,
  athleteId: string,
  userModel: Model<any>,
): Promise<void> {
  if (requesterRole === Role.ATHLETE) {
    if (requesterId !== athleteId) {
      throw new ForbiddenException('No tenés acceso a estos datos');
    }
    return;
  }

  if (requesterRole === Role.COACH) {
    if (requesterId === athleteId) return;
    const athlete = await userModel
      .findById(athleteId)
      .select('coachId')
      .lean();
    if (!athlete || athlete.coachId?.toString() !== requesterId) {
      throw new ForbiddenException('No tenés acceso a estos datos');
    }
    return;
  }

  throw new ForbiddenException('Rol no reconocido');
}

export async function assertOwnerOrCoach(
  requesterId: string,
  requesterRole: string,
  resourceCoachId: string,
  resourceAthleteId: string,
): Promise<void> {
  if (requesterRole === Role.COACH && requesterId === resourceCoachId) return;
  if (requesterRole === Role.ATHLETE && requesterId === resourceAthleteId)
    return;
  throw new ForbiddenException('No tenés acceso a estos datos');
}
