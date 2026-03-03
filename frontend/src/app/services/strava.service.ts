import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StravaStatus {
  connected: boolean;
  athleteId?: number;
  connectedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class StravaService {
  private http = inject(HttpClient);

  getAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>('/api/strava/auth-url');
  }

  getStatus(): Observable<StravaStatus> {
    return this.http.get<StravaStatus>('/api/strava/status');
  }

  disconnect(): Observable<{ disconnected: boolean }> {
    return this.http.post<{ disconnected: boolean }>('/api/strava/disconnect', {});
  }
}
