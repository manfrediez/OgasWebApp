import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { GeneralInfoService } from '../../../services/general-info.service';
import { Topic } from '../../../models/general-info.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-athlete-info-topics',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div>
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-primary-800 tracking-tight">Info General</h1>
        <p class="text-primary-400 text-sm mt-1">Recursos e información de tu coach</p>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (topics().length === 0) {
        <app-empty-state
          icon="📚"
          message="Tu coach aún no publicó información"
          submessage="Cuando tu coach comparta temas, los vas a ver acá" />
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (topic of topics(); track topic._id) {
            <a
              [routerLink]="['/athlete/info', topic._id]"
              class="card-glass rounded-2xl p-5 border-l-4 border-accent-500 hover:shadow-lg transition-all duration-200 group">
              <div class="flex items-start gap-3">
                <div class="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-primary-700 text-lg group-hover:text-accent-600 transition-colors truncate">{{ topic.name }}</h3>
                  <span class="inline-flex items-center gap-1 mt-1.5 rounded-full bg-accent-500/10 px-2.5 py-0.5 text-xs font-medium text-accent-600">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                    </svg>
                    {{ topic.postCount }} {{ topic.postCount === 1 ? 'publicación' : 'publicaciones' }}
                  </span>
                </div>
                <svg class="w-5 h-5 text-primary-300 group-hover:text-accent-500 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class AthleteInfoTopicsComponent implements OnInit {
  private infoService = inject(GeneralInfoService);
  private destroyRef = inject(DestroyRef);

  topics = signal<Topic[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.infoService.getTopics().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (topics) => {
        this.topics.set(topics);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
