import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityData } from '../models/activity-data.model';

@Injectable({ providedIn: 'root' })
export class ActivityDataService {
  private http = inject(HttpClient);

  getByAthlete(athleteId: string): Observable<ActivityData[]> {
    return this.http.get<ActivityData[]>(`/api/activity-data/athlete/${athleteId}`);
  }

  getBySession(planId: string, weekNum: number, sessionIdx: number): Observable<ActivityData | null> {
    return this.http.get<ActivityData | null>(`/api/activity-data/session/${planId}/${weekNum}/${sessionIdx}`);
  }

  getById(id: string): Observable<ActivityData> {
    return this.http.get<ActivityData>(`/api/activity-data/${id}`);
  }

  matchToSession(id: string, planId: string, weekNumber: number, sessionIndex: number): Observable<ActivityData> {
    return this.http.post<ActivityData>(`/api/activity-data/${id}/match`, { planId, weekNumber, sessionIndex });
  }

  unmatch(id: string): Observable<ActivityData> {
    return this.http.delete<ActivityData>(`/api/activity-data/${id}/match`);
  }
}
