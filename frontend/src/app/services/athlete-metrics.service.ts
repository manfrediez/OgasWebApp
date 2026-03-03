import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AthleteMetrics,
  CreateAthleteMetricsRequest,
  UpdateAthleteMetricsRequest,
} from '../models/athlete-metrics.model';

@Injectable({ providedIn: 'root' })
export class AthleteMetricsService {
  private http = inject(HttpClient);

  getByAthlete(athleteId: string): Observable<AthleteMetrics> {
    return this.http.get<AthleteMetrics>(`/api/athlete-metrics/athlete/${athleteId}`);
  }

  create(data: CreateAthleteMetricsRequest): Observable<AthleteMetrics> {
    return this.http.post<AthleteMetrics>('/api/athlete-metrics', data);
  }

  update(id: string, data: UpdateAthleteMetricsRequest): Observable<AthleteMetrics> {
    return this.http.patch<AthleteMetrics>(`/api/athlete-metrics/${id}`, data);
  }
}
