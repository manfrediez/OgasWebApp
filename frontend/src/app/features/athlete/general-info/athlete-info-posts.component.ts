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
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/athlete/info" class="text-primary-400 hover:text-primary-700">
          <span class="text-xl">←</span>
        </a>
        <h1 class="text-xl md:text-2xl font-bold text-primary-700">{{ topicName() }}</h1>
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
            <div class="card-glass rounded-xl p-5">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-semibold text-primary-700 text-lg">{{ post.title }}</h3>
                <span class="text-xs text-primary-400 shrink-0 ml-3">{{ post.createdAt | dateEs:'d MMM yyyy' }}</span>
              </div>
              <p class="text-sm text-primary-500 whitespace-pre-line mb-3">{{ post.content }}</p>

              @if (post.attachments.length > 0) {
                <div class="space-y-2">
                  @for (att of post.attachments; track att.storedName) {
                    @if (isImage(att.mimeType)) {
                      <a [href]="infoService.getFileUrl(att.storedName)" target="_blank" class="block">
                        <img
                          [src]="infoService.getFileUrl(att.storedName)"
                          [alt]="att.originalName"
                          class="rounded-lg max-h-60 object-contain border border-primary-100" />
                      </a>
                    } @else {
                      <a
                        [href]="infoService.getFileUrl(att.storedName)"
                        target="_blank"
                        class="inline-flex items-center gap-2 rounded-lg bg-accent-500/10 px-4 py-2 text-sm text-accent-600 hover:bg-accent-500/20">
                        📄 {{ att.originalName }}
                        <span class="text-xs text-primary-400">({{ formatSize(att.size) }})</span>
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
