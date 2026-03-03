import { Role } from './enums';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  coachId?: string;
  isActive: boolean;
  birthDate?: string;
  phone?: string;
  address?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  exp: number;
  iat: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface InviteAthleteRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface InviteAthleteResponse {
  inviteLink: string;
  athleteId: string;
}

export interface AcceptInviteRequest {
  inviteToken: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
