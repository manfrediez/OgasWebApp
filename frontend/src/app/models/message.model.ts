export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  athleteId: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSenderId: string | null;
  unreadCount: number;
}

export interface SendMessageRequest {
  receiverId: string;
  content: string;
}
