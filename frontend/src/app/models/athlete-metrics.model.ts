export interface Equipment {
  watch?: string;
  heartRateBand?: string;
  bike?: string;
}

export interface HRZoneRange {
  min: number;
  max: number;
}

export interface HRZones {
  z1: HRZoneRange;
  z2: HRZoneRange;
  z3: HRZoneRange;
  z4: HRZoneRange;
  z5: HRZoneRange;
}

export interface TestRecord {
  type: string;
  date: string;
  value: number;
  fcMax?: number;
  pace?: string;
  distance?: number;
  rpe?: number;
}

export interface HRZoneDetailed {
  zone: string;
  percentRange: string;
  fcRange?: HRZoneRange;
  sensation?: string;
  rpe?: number;
}

export interface AthleteMetrics {
  _id: string;
  athleteId: string;
  age?: number;
  objectivesShortTerm?: string;
  objectivesMediumTerm?: string;
  equipment?: Equipment;
  vam?: number;
  vt2?: number;
  fcMax?: number;
  hrZones?: HRZones;
  lastTestDate?: string;
  residence?: string;
  weeklyAvailableHours?: number;
  preferredDays?: string[];
  hasTrackAccess?: boolean;
  trackLocation?: string;
  limitations?: string;
  testHistory?: TestRecord[];
  hrZonesDetailed?: HRZoneDetailed[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAthleteMetricsRequest {
  athleteId: string;
  age?: number;
  objectivesShortTerm?: string;
  objectivesMediumTerm?: string;
  equipment?: Equipment;
  vam?: number;
  vt2?: number;
  fcMax?: number;
  lastTestDate?: string;
  residence?: string;
  weeklyAvailableHours?: number;
  preferredDays?: string[];
  hasTrackAccess?: boolean;
  trackLocation?: string;
  limitations?: string;
  testHistory?: TestRecord[];
  hrZonesDetailed?: HRZoneDetailed[];
}

export type UpdateAthleteMetricsRequest = Partial<Omit<CreateAthleteMetricsRequest, 'athleteId'>>;
