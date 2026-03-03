import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GoalRace, CreateGoalRaceRequest, UpdateGoalRaceRequest } from '../models/goal-race.model';

@Injectable({ providedIn: 'root' })
export class GoalRacesService {
  private http = inject(HttpClient);

  getByAthlete(athleteId: string): Observable<GoalRace[]> {
    return this.http.get<GoalRace[]>(`/api/goal-races/athlete/${athleteId}`);
  }

  getById(id: string): Observable<GoalRace> {
    return this.http.get<GoalRace>(`/api/goal-races/${id}`);
  }

  create(data: CreateGoalRaceRequest): Observable<GoalRace> {
    return this.http.post<GoalRace>('/api/goal-races', data);
  }

  update(id: string, data: UpdateGoalRaceRequest): Observable<GoalRace> {
    return this.http.patch<GoalRace>(`/api/goal-races/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/goal-races/${id}`);
  }
}
