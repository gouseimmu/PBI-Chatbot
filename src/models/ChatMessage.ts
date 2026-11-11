export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessageMetadata {
  source?: string;
  confidence?: number;
  powerBICalculation?: string;
  citations?: string[];
  dataReferences?: string[];
  visualReferences?: string[];
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  status: 'idle' | 'pending' | 'complete' | 'error';
  metadata?: ChatMessageMetadata;
}
