export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  fileUrl?: string;
  type?: 'text' | 'image';
}