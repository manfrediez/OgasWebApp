import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImportResult {
  plans: number;
  goalRaces: number;
  strategies: number;
  circuits: number;
  metricsUpdated: boolean;
}

@Injectable({ providedIn: 'root' })
export class ImportService {
  private http = inject(HttpClient);

  importExcel(athleteId: string, file: File): Observable<ImportResult> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ImportResult>(
      `/api/import/athlete/${athleteId}/excel`,
      fd,
    );
  }
}
