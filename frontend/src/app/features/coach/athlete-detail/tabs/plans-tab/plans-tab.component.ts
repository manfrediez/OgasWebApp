import { Component, inject, input, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { WorkoutPlansService } from '../../../../../services/workout-plans.service';
import { WorkoutPlan } from '../../../../../models/workout-plan.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../../../shared/pipes/date-es.pipe';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ClonePlanDialogComponent,
  ClonePlanDialogData,
} from './clone-plan-dialog.component';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
  selector: 'app-plans-tab',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    <div>
      <div class="flex justify-end mb-4">
        <a
          [routerLink]="['/coach/athlete', athleteId(), 'plan', 'new']"
          class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          + Nuevo Plan
        </a>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (plans().length === 0) {
        <app-empty-state icon="📋" message="No hay planes" submessage="Creá un nuevo plan de entrenamiento" />
      } @else {
        <div class="space-y-3">
          @for (plan of plans(); track plan._id) {
            <div class="bg-surface rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-primary-50">
              <div class="flex items-center justify-between">
                <a
                  [routerLink]="['/coach/athlete', athleteId(), 'plan', plan._id]"
                  class="flex-1 min-w-0">
                  <h3 class="font-semibold text-primary-700">{{ plan.name }}</h3>
                  <p class="text-sm text-primary-400">
                    {{ plan.startDate | dateEs }} - {{ plan.endDate | dateEs }}
                  </p>
                </a>
                <div class="flex items-center gap-2 ml-3 shrink-0">
                  @if (plan.planNumber) {
                    <span class="text-sm text-accent-500 font-medium">Meso #{{ plan.planNumber }}</span>
                  }
                  <button
                    (click)="onSaveAsTemplate(plan, $event)"
                    title="Guardar como plantilla"
                    class="p-1.5 rounded-lg text-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button
                    (click)="onClone(plan, $event)"
                    title="Clonar plan"
                    class="p-1.5 rounded-lg text-primary-400 hover:text-accent-500 hover:bg-accent-400/10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    (click)="onDelete(plan, $event)"
                    title="Eliminar plan"
                    class="p-1.5 rounded-lg text-primary-400 hover:text-danger-500 hover:bg-red-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              @if (plan.sport) {
                <span class="text-xs text-primary-400 mt-1 inline-block">{{ plan.sport }}</span>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PlansTabComponent implements OnInit {
  private plansService = inject(WorkoutPlansService);
  private dialog = inject(Dialog);
  private toast = inject(ToastService);

  athleteId = input.required<string>();
  plans = signal<WorkoutPlan[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadPlans();
  }

  private loadPlans() {
    this.plansService.getByAthlete(this.athleteId()).subscribe({
      next: (res: any) => {
        this.plans.set(res.data ?? res);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar planes');
        this.loading.set(false);
      },
    });
  }

  onSaveAsTemplate(plan: WorkoutPlan, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Guardar como plantilla',
        message: `¿Guardar "${plan.name}" como plantilla reutilizable?`,
        confirmText: 'Guardar',
      } as ConfirmDialogData,
    });

    ref.closed.subscribe(confirmed => {
      if (confirmed) {
        this.plansService.saveAsTemplate(plan._id).subscribe({
          next: () => this.toast.success('Plantilla guardada'),
          error: () => this.toast.error('Error al guardar plantilla'),
        });
      }
    });
  }

  onClone(plan: WorkoutPlan, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open<string | null>(ClonePlanDialogComponent, {
      data: {
        planName: plan.name,
        currentAthleteId: this.athleteId(),
      } as ClonePlanDialogData,
    });

    ref.closed.subscribe(targetAthleteId => {
      if (targetAthleteId) {
        this.plansService
          .clone(plan._id, { targetAthleteId })
          .subscribe({
            next: () => { this.toast.success('Plan clonado'); this.loadPlans(); },
            error: () => this.toast.error('Error al clonar plan'),
          });
      }
    });
  }

  onDelete(plan: WorkoutPlan, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar plan',
        message: `¿Estás seguro de eliminar "${plan.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
      } as ConfirmDialogData,
    });

    ref.closed.subscribe(confirmed => {
      if (confirmed) {
        this.plansService.delete(plan._id).subscribe({
          next: () => {
            this.plans.update(plans => plans.filter(p => p._id !== plan._id));
            this.toast.success('Plan eliminado');
          },
          error: () => this.toast.error('Error al eliminar plan'),
        });
      }
    });
  }
}
