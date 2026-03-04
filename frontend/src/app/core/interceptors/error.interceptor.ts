import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { ToastService } from '../../shared/services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const toast = inject(ToastService);

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

      // Global error toasts
      if (error.status === 0) {
        toast.error('Sin conexión a internet');
        error._toasted = true;
      } else if (error.status === 403) {
        toast.error('No tenés permiso para esta acción');
        error._toasted = true;
      } else if (error.status >= 500) {
        toast.error('Error del servidor, intentá de nuevo');
        error._toasted = true;
      }

      return throwError(() => error);
    })
  );
};
