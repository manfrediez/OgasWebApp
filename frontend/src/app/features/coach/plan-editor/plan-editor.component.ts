import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutPlansService } from '../../../services/workout-plans.service';
import { WorkoutPlan, Week, WeeklyStimulusEntry, CreateWorkoutPlanRequest } from '../../../models/workout-plan.model';
import { SessionStatus } from '../../../core/models/enums';
import { WeekEditorComponent } from './week-editor/week-editor.component';
import { StimulusMatrixComponent } from './stimulus-matrix/stimulus-matrix.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-plan-editor',
  standalone: true,
  imports: [FormsModule, WeekEditorComponent, StimulusMatrixComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div>
        <div class="flex items-center gap-4 mb-6">
          <button (click)="goBack()" class="text-primary-400 hover:text-primary-700">← Volver</button>
          <h1 class="text-2xl font-bold text-primary-700">
            {{ isEdit ? 'Editar Plan' : 'Nuevo Plan' }}
          </h1>
        </div>

        <!-- Template selector (only for new plans) -->
        @if (!isEdit && templates().length > 0) {
          <div class="card-glass rounded-xl p-4 border border-accent-400/30 mb-6">
            <label class="block text-sm font-medium text-primary-600 mb-2">Crear desde plantilla (opcional)</label>
            <div class="flex gap-3">
              <select (change)="onTemplateSelect($event)" class="flex-1">
                <option value="">Plan en blanco</option>
                @for (t of templates(); track t._id) {
                  <option [value]="t._id">{{ t.name }}</option>
                }
              </select>
            </div>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Header -->
          <div class="card-glass rounded-xl p-6 space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="col-span-2">
                <label class="block text-sm font-medium text-primary-600 mb-1">Nombre del plan</label>
                <input [(ngModel)]="form.name" #nameInput="ngModel" name="name" required maxlength="100" class="w-full"
                       [class.border-danger-500]="nameInput.invalid && nameInput.touched"
                       placeholder="Ej: Mesociclo 5 - Competitivo" />
                @if (nameInput.invalid && nameInput.touched) {
                  <p class="text-xs text-danger-500 mt-1">El nombre es obligatorio</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-primary-600 mb-1">Nro. Mesociclo</label>
                <input [(ngModel)]="form.planNumber" name="planNumber" type="number" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-primary-600 mb-1">Deporte</label>
                <input [(ngModel)]="form.sport" name="sport" class="w-full" placeholder="RUNNING" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-primary-600 mb-1">Fecha inicio</label>
                <input [(ngModel)]="form.startDate" #startInput="ngModel" name="startDate" type="date" required class="w-full"
                       [class.border-danger-500]="startInput.invalid && startInput.touched" />
                @if (startInput.invalid && startInput.touched) {
                  <p class="text-xs text-danger-500 mt-1">La fecha de inicio es obligatoria</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-primary-600 mb-1">Fecha fin</label>
                <input [(ngModel)]="form.endDate" #endInput="ngModel" name="endDate" type="date" required class="w-full"
                       [class.border-danger-500]="(endInput.invalid && endInput.touched) || (form.endDate && form.startDate && form.endDate < form.startDate)" />
                @if (endInput.invalid && endInput.touched) {
                  <p class="text-xs text-danger-500 mt-1">La fecha de fin es obligatoria</p>
                } @else if (form.endDate && form.startDate && form.endDate < form.startDate) {
                  <p class="text-xs text-danger-500 mt-1">La fecha fin debe ser posterior a la de inicio</p>
                }
              </div>
            </div>
          </div>

          <!-- Stimulus matrix -->
          <app-stimulus-matrix
            [stimuli]="weeklyStimuli"
            (stimuliChange)="weeklyStimuli = $event" />

          <!-- Weeks -->
          <div class="space-y-4">
            @for (week of weeks; track week.weekNumber) {
              <app-week-editor
                [week]="week"
                [startDate]="form.startDate"
                (weekChange)="onWeekChange($index, $event)" />
            }
          </div>

          <!-- Notes -->
          <div class="card-glass rounded-xl p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-primary-600 mb-1">Protocolo de activación</label>
              <textarea [(ngModel)]="form.activationProtocol" name="activationProtocol" class="w-full" rows="2"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-primary-600 mb-1">Notas generales (una por línea)</label>
              <textarea [(ngModel)]="generalNotesText" name="generalNotes" class="w-full" rows="3"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-primary-600 mb-1">Conclusiones del coach</label>
              <textarea [(ngModel)]="form.coachConclusions" name="coachConclusions" class="w-full" rows="2"></textarea>
            </div>
          </div>

          @if (error()) {
            <p class="text-sm text-danger-500 bg-red-50 rounded-lg p-3">{{ error() }}</p>
          }

          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="saving()"
              class="rounded-lg bg-primary-500 px-6 py-2.5 text-white font-medium hover:bg-primary-700 disabled:opacity-50">
              @if (saving()) {
                Guardando...
              } @else {
                Guardar Plan
              }
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class PlanEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private plansService = inject(WorkoutPlansService);
  private toast = inject(ToastService);

  isEdit = false;
  athleteId = '';
  planId = '';
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  templates = signal<WorkoutPlan[]>([]);

  form = { name: '', startDate: '', endDate: '', planNumber: null as number | null, sport: '', activationProtocol: '', coachConclusions: '' };
  weeks: Week[] = [
    { weekNumber: 1, sessions: [] },
    { weekNumber: 2, sessions: [] },
    { weekNumber: 3, sessions: [] },
    { weekNumber: 4, sessions: [] },
  ];
  weeklyStimuli: WeeklyStimulusEntry[] = [];
  generalNotesText = '';

  ngOnInit() {
    this.athleteId = this.route.snapshot.paramMap.get('athleteId')!;
    this.planId = this.route.snapshot.paramMap.get('planId') || '';

    if (this.planId) {
      this.isEdit = true;
      this.plansService.getById(this.planId).subscribe({
        next: plan => {
          this.form = {
            name: plan.name,
            startDate: plan.startDate.slice(0, 10),
            endDate: plan.endDate.slice(0, 10),
            planNumber: plan.planNumber ?? null,
            sport: plan.sport || '',
            activationProtocol: plan.activationProtocol || '',
            coachConclusions: plan.coachConclusions || '',
          };
          this.weeks = plan.weeks;
          this.weeklyStimuli = plan.weeklyStimuli || [];
          this.generalNotesText = (plan.generalNotes || []).join('\n');
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.plansService.getTemplates().subscribe({
        next: templates => this.templates.set(templates),
      });
      this.loading.set(false);
    }
  }

  onTemplateSelect(event: Event) {
    const templateId = (event.target as HTMLSelectElement).value;
    if (!templateId) return;
    const template = this.templates().find(t => t._id === templateId);
    if (!template) return;

    this.form = {
      name: template.name.replace('[Plantilla] ', ''),
      startDate: '',
      endDate: '',
      planNumber: template.planNumber ?? null,
      sport: template.sport || '',
      activationProtocol: template.activationProtocol || '',
      coachConclusions: '',
    };
    this.weeks = template.weeks.map(w => ({
      ...w,
      sessions: w.sessions.map(s => ({
        ...s,
        date: '',
        athleteFeedback: '',
        athletePerception: undefined as any,
        status: SessionStatus.PLANNED,
      })),
    }));
    this.weeklyStimuli = template.weeklyStimuli || [];
    this.generalNotesText = (template.generalNotes || []).join('\n');
  }

  onWeekChange(idx: number, week: Week) {
    this.weeks = this.weeks.map((w, i) => i === idx ? week : w);
  }

  goBack() {
    this.router.navigate(['/coach/athlete', this.athleteId]);
  }

  onSubmit() {
    this.saving.set(true);
    this.error.set('');

    const generalNotes = this.generalNotesText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    const payload: CreateWorkoutPlanRequest = {
      athleteId: this.athleteId,
      name: this.form.name,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      weeks: this.weeks,
      planNumber: this.form.planNumber ?? undefined,
      sport: this.form.sport || undefined,
      weeklyStimuli: this.weeklyStimuli.length > 0 ? this.weeklyStimuli : undefined,
      totalWeeklyStimuli: this.weeklyStimuli.length > 0
        ? this.weeklyStimuli.reduce((sum, e) => sum + e.days.filter(d => d).length, 0)
        : undefined,
      activationProtocol: this.form.activationProtocol || undefined,
      generalNotes: generalNotes.length > 0 ? generalNotes : undefined,
      coachConclusions: this.form.coachConclusions || undefined,
    };

    const request$ = this.isEdit
      ? this.plansService.update(this.planId, payload)
      : this.plansService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Plan guardado');
        this.goBack();
      },
      error: () => {
        this.toast.error('Error al guardar el plan');
        this.error.set('Error al guardar el plan');
        this.saving.set(false);
      },
    });
  }
}
