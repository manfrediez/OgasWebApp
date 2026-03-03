export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  timerWork?: number;
  timerRest?: number;
  timerRounds?: number;
  notes?: string;
}

export interface StrengthCircuit {
  _id: string;
  circuitNumber: number;
  name: string;
  coachId: string;
  exercises: Exercise[];
  planId?: string;
  routineNumber?: number;
  timerFormat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStrengthCircuitRequest {
  circuitNumber: number;
  name: string;
  exercises?: Exercise[];
  planId?: string;
  routineNumber?: number;
  timerFormat?: string;
}
