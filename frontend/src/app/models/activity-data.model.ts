export interface Split {
  distance: number;
  movingTime: number;
  averageHeartRate: number;
  averagePace: number;
  elevationDifference: number;
}

export interface HRZonesDistribution {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

export interface ActivityData {
  _id: string;
  athleteId: string;
  planId?: string;
  weekNumber?: number;
  sessionIndex?: number;
  source: 'strava';
  externalId: string;
  type: string;
  name: string;
  startDate: string;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averagePace?: number;
  averageCadence?: number;
  splits: Split[];
  map?: { summaryPolyline: string };
  hrZonesDistribution?: HRZonesDistribution;
  matched: boolean;
  matchedAt?: string;
  createdAt?: string;
}
