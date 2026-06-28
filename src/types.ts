export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface Memory {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
}
