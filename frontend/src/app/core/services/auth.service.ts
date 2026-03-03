import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { TokenService } from './token.service';
import {
  User,
  AuthTokens,
  LoginRequest,
  AcceptInviteRequest,
  RefreshTokenRequest,
  InviteAthleteRequest,
  InviteAthleteResponse,
} from '../models/user.model';
import { Role } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isCoach = computed(() => this._currentUser()?.role === Role.COACH);
  readonly isAthlete = computed(() => this._currentUser()?.role === Role.ATHLETE);

  login(credentials: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>('/api/auth/login', credentials).pipe(
      tap(tokens => {
        this.tokenService.saveTokens(tokens);
      })
    );
  }

  acceptInvite(data: AcceptInviteRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>('/api/auth/accept-invite', data).pipe(
      tap(tokens => {
        this.tokenService.saveTokens(tokens);
      })
    );
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token');
    }
    const body: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthTokens>('/api/auth/refresh', body).pipe(
      tap(tokens => {
        this.tokenService.saveTokens(tokens);
      })
    );
  }

  fetchCurrentUser(): Observable<User | null> {
    return this.http.get<User>('/api/auth/me').pipe(
      tap(user => this._currentUser.set(user)),
      catchError(() => {
        this._currentUser.set(null);
        return of(null);
      })
    );
  }

  inviteAthlete(data: InviteAthleteRequest): Observable<InviteAthleteResponse> {
    return this.http.post<InviteAthleteResponse>('/api/auth/invite', data);
  }

  logout(): void {
    this.tokenService.clearTokens();
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  initAuth(): Observable<User | null> {
    const token = this.tokenService.getAccessToken();
    if (!token) return of(null);
    return this.fetchCurrentUser();
  }

  getRedirectUrl(): string {
    const user = this._currentUser();
    if (!user) return '/login';
    return user.role === Role.COACH ? '/coach/dashboard' : '/athlete/dashboard';
  }
}
