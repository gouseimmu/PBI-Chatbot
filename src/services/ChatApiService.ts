import { DataContext } from '../models/DataContext';

const DEFAULT_BACKEND = 'https://ai-data-copilot-api-gdc6c9b5bffncfee.uaenorth-01.azurewebsites.net';
const CHAT_ENDPOINT = (base: string) => `${base.replace(/\/$/, '')}/api/chat`;

export interface ChatResponse {
  answer: string;
  source: string;
  model?: string;
}

export class ChatApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? DEFAULT_BACKEND;
  }

  public async postChat(question: string, dataContext: DataContext, timeoutMs = 20000): Promise<ChatResponse> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(CHAT_ENDPOINT(this.baseUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, dataContext }),
        signal: controller.signal
      });

      clearTimeout(id);

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(text || `HTTP ${resp.status}`);
      }

      const json = await resp.json();
      return {
        answer: json.answer ?? 'No answer received',
        source: json.source ?? 'unknown',
        model: json.model
      };
    } catch (err) {
      clearTimeout(id);
      if ((err as any).name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw err;
    }
  }
}
