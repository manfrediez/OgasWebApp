export interface MessageAttachment {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments: MessageAttachment[];
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
  lastMessageAttachmentCount: number;
  unreadCount: number;
}

export interface SendMessageRequest {
  receiverId: string;
  content: string;
}
