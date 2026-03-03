import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Message,
  ConversationSummary,
  SendMessageRequest,
} from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private http = inject(HttpClient);
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  readonly unreadCount = signal(0);

  getConversations(): Observable<ConversationSummary[]> {
    return this.http.get<ConversationSummary[]>('/api/messages/conversations');
  }

  getConversation(
    userId: string,
    limit = 30,
    skip = 0,
  ): Observable<Message[]> {
    return this.http.get<Message[]>(
      `/api/messages/conversation/${userId}?limit=${limit}&skip=${skip}`,
    );
  }

  sendMessage(data: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>('/api/messages', data);
  }

  markAsRead(userId: string): Observable<void> {
    return this.http.patch<void>(`/api/messages/read/${userId}`, {});
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>('/api/messages/unread-count');
  }

  startUnreadPolling(): void {
    this.fetchUnread();
    this.pollingInterval = setInterval(() => this.fetchUnread(), 10000);
  }

  stopUnreadPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private fetchUnread(): void {
    this.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.count),
    });
  }
}
