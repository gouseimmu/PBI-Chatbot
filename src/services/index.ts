export interface AIRequest {
  question: string;
  powerBIContext?: unknown;
  conversation?: unknown[];
  scope?: {
    allowedSource: 'powerbi_dataset_only';
    validationMode: 'strict';
  };
}

export interface AIResponse {
  answer: string;
  source?: 'dataset' | 'scope_rejection' | 'not_available';
  metadata?: Record<string, unknown>;
}

export interface DatasetScopeCheck {
  allowed: boolean;
  reason?: 'unrelated' | 'not_available' | 'dataset_related';
  message: string;
}

export interface AIServicePort {
  ask(request: AIRequest): Promise<AIResponse>;
  validateDatasetScope(request: AIRequest): Promise<DatasetScopeCheck>;
}
