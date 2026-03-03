import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  WorkoutPlan,
  CreateWorkoutPlanRequest,
  UpdateSessionFeedbackRequest,
  ClonePlanRequest,
  PlanSummary,
} from '../models/workout-plan.model';

@Injectable({ providedIn: 'root' })
export class WorkoutPlansService {
  private http = inject(HttpClient);

  getByAthlete(athleteId: string): Observable<WorkoutPlan[]> {
    return this.http.get<WorkoutPlan[]>(`/api/workout-plans/athlete/${athleteId}`);
  }

  getById(id: string): Observable<WorkoutPlan> {
    return this.http.get<WorkoutPlan>(`/api/workout-plans/${id}`);
  }

  create(data: CreateWorkoutPlanRequest): Observable<WorkoutPlan> {
    return this.http.post<WorkoutPlan>('/api/workout-plans', data);
  }

  update(id: string, data: Partial<CreateWorkoutPlanRequest>): Observable<WorkoutPlan> {
    return this.http.patch<WorkoutPlan>(`/api/workout-plans/${id}`, data);
  }

  clone(id: string, data: ClonePlanRequest): Observable<WorkoutPlan> {
    return this.http.post<WorkoutPlan>(`/api/workout-plans/${id}/clone`, data);
  }

  getTemplates(): Observable<WorkoutPlan[]> {
    return this.http.get<WorkoutPlan[]>('/api/workout-plans/templates');
  }

  saveAsTemplate(id: string): Observable<WorkoutPlan> {
    return this.http.post<WorkoutPlan>(`/api/workout-plans/${id}/save-as-template`, {});
  }

  createFromTemplate(templateId: string, data: ClonePlanRequest): Observable<WorkoutPlan> {
    return this.http.post<WorkoutPlan>(
      `/api/workout-plans/${templateId}/create-from-template`,
      data,
    );
  }

  getAthleteSummary(athleteId: string): Observable<PlanSummary[]> {
    return this.http.get<PlanSummary[]>(`/api/workout-plans/athlete/${athleteId}/summary`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/workout-plans/${id}`);
  }

  updateSessionFeedback(
    planId: string,
    weekNum: number,
    sessionIdx: number,
    data: UpdateSessionFeedbackRequest
  ): Observable<WorkoutPlan> {
    return this.http.patch<WorkoutPlan>(
      `/api/workout-plans/${planId}/weeks/${weekNum}/sessions/${sessionIdx}/feedback`,
      data
    );
  }
}
