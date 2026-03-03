import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload, AuthTokens } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  saveTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  decodeToken(): JwtPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const payload = this.decodeToken();
    if (!payload) return true;
    return payload.exp * 1000 < Date.now();
  }
}
