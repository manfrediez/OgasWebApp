export interface Segment {
  fromKm: number;
  toKm: number;
  objective?: string;
  paceZone?: string;
  technicalFocus?: string;
  strategicKey?: string;
}

export interface RaceStrategy {
  _id: string;
  athleteId: string;
  coachId: string;
  raceName: string;
  raceDate: string;
  totalDistance: number;
  isPublished: boolean;
  segments: Segment[];
  preRaceActivation?: string;
  preRaceNotes?: string;
  generalTechnique?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRaceStrategyRequest {
  athleteId: string;
  raceName: string;
  raceDate: string;
  totalDistance: number;
  segments?: Segment[];
  preRaceActivation?: string;
  preRaceNotes?: string;
  generalTechnique?: string;
}
