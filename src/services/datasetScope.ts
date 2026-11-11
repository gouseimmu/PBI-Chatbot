export interface DatasetScopeCheck {
  allowed: boolean;
  reason?: 'unrelated' | 'not_available' | 'dataset_related';
  message: string;
}

export function createDatasetScopeCheck(question: string): DatasetScopeCheck {
  const normalized = question.trim().toLowerCase();

  const unrelatedSignals = [
    'prime minister',
    'weather',
    'gold price',
    'exchange rate',
    'joke',
    'machine learning',
    'who is',
    'what is the capital',
    'latest news'
  ];

  const isClearlyUnrelated = unrelatedSignals.some((signal) => normalized.includes(signal));

  if (isClearlyUnrelated) {
    return {
      allowed: false,
      reason: 'unrelated',
      message: 'I can only answer questions related to the data available in this Power BI report.'
    };
  }

  return {
    allowed: true,
    reason: 'dataset_related',
    message: 'Question is dataset-related and should be routed to analysis in Phase 2.'
  };
}
