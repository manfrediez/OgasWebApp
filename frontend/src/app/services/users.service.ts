import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../core/models/user.model';

export interface InactiveAthlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  lastActivityDate: string | null;
  daysSinceLastActivity: number | null;
  lastSessionType: string | null;
  lastSessionDescription: string | null;
  currentPlanName: string | null;
}

export interface AthleteSummary extends User {
  currentPlan: { name: string; startDate: string; endDate: string } | null;
  nextRace: { name: string; date: string; distance: string } | null;
  completionPct: number;
  unreadMessages: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  getAthletes(): Observable<User[]> {
    return this.http.get<User[]>('/api/users/athletes');
  }

  getAthletesSummary(): Observable<AthleteSummary[]> {
    return this.http.get<AthleteSummary[]>('/api/users/athletes/summary');
  }

  getInactiveAthletes(): Observable<InactiveAthlete[]> {
    return this.http.get<InactiveAthlete[]>('/api/users/athletes/inactive');
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }

  update(id: string, data: { firstName?: string; lastName?: string; birthDate?: string; phone?: string; address?: string }): Observable<User> {
    return this.http.patch<User>(`/api/users/${id}`, data);
  }
}
