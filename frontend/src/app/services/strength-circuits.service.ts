import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StrengthCircuit, CreateStrengthCircuitRequest } from '../models/strength-circuit.model';

@Injectable({ providedIn: 'root' })
export class StrengthCircuitsService {
  private http = inject(HttpClient);

  getAll(): Observable<StrengthCircuit[]> {
    return this.http.get<StrengthCircuit[]>('/api/strength-circuits');
  }

  getByPlan(planId: string): Observable<StrengthCircuit[]> {
    return this.http.get<StrengthCircuit[]>(`/api/strength-circuits/plan/${planId}`);
  }

  getById(id: string): Observable<StrengthCircuit> {
    return this.http.get<StrengthCircuit>(`/api/strength-circuits/${id}`);
  }

  create(data: CreateStrengthCircuitRequest): Observable<StrengthCircuit> {
    return this.http.post<StrengthCircuit>('/api/strength-circuits', data);
  }

  update(id: string, data: Partial<CreateStrengthCircuitRequest>): Observable<StrengthCircuit> {
    return this.http.patch<StrengthCircuit>(`/api/strength-circuits/${id}`, data);
  }
}
