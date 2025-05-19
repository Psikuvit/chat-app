import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface StoredMessage {
  id: string
  content: string
  sender: string
  timestamp: number
  fileUrl?: string
}

class MessageStore {
  private messagesPath = path.join(__dirname, '..', 'data', 'messages.json')

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await fs.mkdir(path.dirname(this.messagesPath), { recursive: true });
      try {
        await fs.access(this.messagesPath);
      } catch {
        await fs.writeFile(this.messagesPath, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error initializing message storage:', error);
    }
  }

  async getAllMessages(): Promise<StoredMessage[]> {
    try {
      const data = await fs.readFile(this.messagesPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading messages:', error);
      return [];
    }
  }

  async saveMessage(message: StoredMessage): Promise<void> {
    try {
      const messages = await this.getAllMessages();
      messages.push(message);
      await fs.writeFile(this.messagesPath, JSON.stringify(messages, null, 2));
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  async resetMessages(): Promise<void> {
    try {
      await fs.writeFile(this.messagesPath, JSON.stringify([]));
    } catch (error) {
      console.error('Error resetting messages:', error);
    }
  }
}

export const messageStore = new MessageStore();