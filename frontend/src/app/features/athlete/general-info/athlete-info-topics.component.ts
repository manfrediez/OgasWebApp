import { Component, inject, signal, OnInit } from '@angular/core';
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
      <h1 class="text-xl md:text-2xl font-bold text-primary-700 mb-6">Info General</h1>

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
              class="bg-surface rounded-xl p-5 shadow-sm border border-primary-50 hover:shadow-md transition-shadow">
              <h3 class="font-semibold text-primary-700 text-lg">{{ topic.name }}</h3>
              <p class="text-sm text-primary-400 mt-1">
                {{ topic.postCount }} {{ topic.postCount === 1 ? 'publicación' : 'publicaciones' }}
              </p>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class AthleteInfoTopicsComponent implements OnInit {
  private infoService = inject(GeneralInfoService);

  topics = signal<Topic[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.infoService.getTopics().subscribe({
      next: (topics) => {
        this.topics.set(topics);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
