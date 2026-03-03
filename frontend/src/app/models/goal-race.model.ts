export interface RaceResult {
  generalPosition?: number;
  categoryPosition?: number;
  time?: string;
}

export interface GoalRace {
  _id: string;
  athleteId: string;
  coachId: string;
  name: string;
  distance: string;
  date: string;
  location?: string;
  result?: RaceResult;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGoalRaceRequest {
  athleteId: string;
  name: string;
  distance: string;
  date: string;
  location?: string;
  result?: RaceResult;
}

export type UpdateGoalRaceRequest = Partial<Omit<CreateGoalRaceRequest, 'athleteId'>>;
