import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GeneralInfoService } from '../../../services/general-info.service';
import { InfoPost } from '../../../models/general-info.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-athlete-info-posts',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/athlete/info" class="p-2 rounded-xl text-primary-400 hover:text-primary-700 hover:bg-primary-500/10 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
          </svg>
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl md:text-2xl font-bold text-primary-700 truncate">{{ topicName() }}</h1>
          <span class="inline-flex items-center gap-1 mt-1 rounded-full bg-accent-500/10 px-2.5 py-0.5 text-xs font-medium text-accent-600">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
            </svg>
            {{ posts().length }} {{ posts().length === 1 ? 'publicación' : 'publicaciones' }}
          </span>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (posts().length === 0) {
        <app-empty-state
          icon="📝"
          message="No hay publicaciones en este tema"
          submessage="Tu coach aún no publicó contenido aquí" />
      } @else {
        <div class="space-y-4">
          @for (post of posts(); track post._id) {
            <div class="card-glass rounded-2xl p-5 border-l-4 border-accent-500 hover:shadow-lg transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-semibold text-primary-700 text-lg">{{ post.title }}</h3>
                <span class="inline-flex items-center gap-1.5 text-xs text-primary-400 shrink-0 ml-3 bg-primary-50 rounded-full px-2.5 py-0.5">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
                  </svg>
                  {{ post.createdAt | dateEs:'d MMM yyyy' }}
                </span>
              </div>
              <p class="text-sm text-primary-500 whitespace-pre-line mb-3 leading-relaxed">{{ post.content }}</p>

              @if (post.attachments.length > 0) {
                <div class="space-y-3 pt-3 border-t border-primary-50">
                  @for (att of post.attachments; track att.storedName) {
                    @if (isImage(att.mimeType)) {
                      <a [href]="infoService.getFileUrl(att.storedName)" target="_blank" class="block">
                        <img
                          [src]="infoService.getFileUrl(att.storedName)"
                          [alt]="att.originalName"
                          class="rounded-xl max-h-64 object-contain shadow-sm border border-primary-100 hover:shadow-md transition-shadow" />
                      </a>
                    } @else {
                      <a
                        [href]="infoService.getFileUrl(att.storedName)"
                        target="_blank"
                        class="inline-flex items-center gap-2 rounded-xl bg-accent-500/10 px-4 py-2 text-sm font-medium text-accent-600 hover:bg-accent-500/20 transition-colors">
                        @if (att.mimeType === 'application/pdf') {
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                          </svg>
                        } @else {
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"/>
                          </svg>
                        }
                        {{ att.originalName }}
                        <span class="text-xs text-accent-500/70">({{ formatSize(att.size) }})</span>
                      </a>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AthleteInfoPostsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  infoService = inject(GeneralInfoService);

  topicId = '';
  topicName = signal('');
  posts = signal<InfoPost[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.topicId = this.route.snapshot.params['topicId'];
    this.infoService.getPostsByTopic(this.topicId).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.infoService.getTopics().subscribe((topics) => {
      const topic = topics.find((t) => t._id === this.topicId);
      if (topic) this.topicName.set(topic.name);
    });
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
