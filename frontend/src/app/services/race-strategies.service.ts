import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RaceStrategy, CreateRaceStrategyRequest } from '../models/race-strategy.model';

@Injectable({ providedIn: 'root' })
export class RaceStrategiesService {
  private http = inject(HttpClient);

  getByAthlete(athleteId: string): Observable<RaceStrategy[]> {
    return this.http.get<RaceStrategy[]>(`/api/race-strategies/athlete/${athleteId}`);
  }

  getById(id: string): Observable<RaceStrategy> {
    return this.http.get<RaceStrategy>(`/api/race-strategies/${id}`);
  }

  create(data: CreateRaceStrategyRequest): Observable<RaceStrategy> {
    return this.http.post<RaceStrategy>('/api/race-strategies', data);
  }

  update(id: string, data: Partial<CreateRaceStrategyRequest>): Observable<RaceStrategy> {
    return this.http.patch<RaceStrategy>(`/api/race-strategies/${id}`, data);
  }

  publish(id: string): Observable<RaceStrategy> {
    return this.http.patch<RaceStrategy>(`/api/race-strategies/${id}/publish`, {});
  }
}
