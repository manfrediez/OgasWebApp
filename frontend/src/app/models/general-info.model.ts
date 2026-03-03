export interface Attachment {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
}

export interface Topic {
  _id: string;
  coachId: string;
  name: string;
  order: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InfoPost {
  _id: string;
  topicId: string;
  coachId: string;
  title: string;
  content: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}
