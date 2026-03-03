import { WorkoutType, SessionStatus, HRZone } from '../core/models/enums';

export interface Session {
  dayOfWeek: number;
  date: string;
  type: WorkoutType;
  description?: string;
  duration?: number;
  distance?: number;
  targetHRZone?: HRZone;
  coachNotes?: string;
  athleteFeedback?: string;
  athletePerception?: number;
  status: SessionStatus;
  secondaryType?: WorkoutType;
  secondaryDescription?: string;
  alternativeDescription?: string;
  alternativeLabel?: string;
  competitionName?: string;
  competitionDistance?: string;
  competitionLocation?: string;
}

export interface Week {
  weekNumber: number;
  sessions: Session[];
}

export interface WeeklyStimulusEntry {
  activity: string;
  days: boolean[];
}

export interface WorkoutPlan {
  _id: string;
  athleteId: string;
  coachId: string;
  name: string;
  startDate: string;
  endDate: string;
  weeks: Week[];
  planNumber?: number;
  sport?: string;
  weeklyStimuli?: WeeklyStimulusEntry[];
  totalWeeklyStimuli?: number;
  activationProtocol?: string;
  generalNotes?: string[];
  coachConclusions?: string;
  strengthRoutines?: string[];
  isTemplate?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkoutPlanRequest {
  athleteId: string;
  name: string;
  startDate: string;
  endDate: string;
  weeks: Week[];
  planNumber?: number;
  sport?: string;
  weeklyStimuli?: WeeklyStimulusEntry[];
  totalWeeklyStimuli?: number;
  activationProtocol?: string;
  generalNotes?: string[];
  coachConclusions?: string;
  strengthRoutines?: string[];
}

export interface UpdateSessionFeedbackRequest {
  athleteFeedback?: string;
  athletePerception?: number;
  status?: SessionStatus;
}

export interface ClonePlanRequest {
  targetAthleteId: string;
}

export interface WeekStats {
  weekNumber: number;
  planned: number;
  completed: number;
  skipped: number;
  completionPct: number;
  avgRpe: number | null;
  totalDuration: number;
  totalDistance: number;
}

export interface PlanSummary {
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  planNumber?: number;
  overallCompletionPct: number;
  weekStats: WeekStats[];
}
