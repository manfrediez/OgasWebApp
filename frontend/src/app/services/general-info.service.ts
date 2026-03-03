import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Topic, InfoPost } from '../models/general-info.model';

@Injectable({ providedIn: 'root' })
export class GeneralInfoService {
  private http = inject(HttpClient);

  // ── topics ──

  getTopics(): Observable<Topic[]> {
    return this.http.get<Topic[]>('/api/general-info/topics');
  }

  createTopic(name: string, order?: number): Observable<Topic> {
    return this.http.post<Topic>('/api/general-info/topics', { name, order });
  }

  updateTopic(id: string, data: { name?: string; order?: number }): Observable<Topic> {
    return this.http.patch<Topic>(`/api/general-info/topics/${id}`, data);
  }

  deleteTopic(id: string): Observable<void> {
    return this.http.delete<void>(`/api/general-info/topics/${id}`);
  }

  // ── posts ──

  getPostsByTopic(topicId: string): Observable<InfoPost[]> {
    return this.http.get<any>(`/api/general-info/posts/topic/${topicId}`).pipe(
      map(res => res.data ?? res),
    );
  }

  getPost(id: string): Observable<InfoPost> {
    return this.http.get<InfoPost>(`/api/general-info/posts/${id}`);
  }

  createPost(data: FormData): Observable<InfoPost> {
    return this.http.post<InfoPost>('/api/general-info/posts', data);
  }

  updatePost(id: string, data: FormData): Observable<InfoPost> {
    return this.http.patch<InfoPost>(`/api/general-info/posts/${id}`, data);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`/api/general-info/posts/${id}`);
  }

  // ── files ──

  getFileUrl(storedName: string): string {
    return `/api/general-info/files/${storedName}`;
  }
}
