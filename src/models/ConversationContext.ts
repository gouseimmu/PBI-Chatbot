export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  lastDatasetRelatedTurn?: string;
}
