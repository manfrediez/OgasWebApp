import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);

  return next(req).pipe(
    catchError(error => {
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login')
      ) {
        return authService.refreshToken().pipe(
          switchMap(tokens => {
            const cloned = req.clone({
              setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            return next(cloned);
          }),
          catchError(() => {
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
