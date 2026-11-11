export interface DataFieldMetadata {
  name: string;
  displayName?: string | null;
  queryName?: string | null;
  type?: string | null;
  role?: string | null;
  category?: string | null;
  isMeasure?: boolean | null;
  format?: string | null;
  aggregation?: string | null;
  source?: string | null;
}

export interface DatasetSummary {
  fields: DataFieldMetadata[];
  measures: DataFieldMetadata[];
  rowCount: number;
  availableRows: number;
  isTruncated: boolean;
  truncationReason?: string | null;
}

export interface DataRow {
  [key: string]: unknown;
}

export interface DataContext {
  dataset: DatasetSummary;
  data: DataRow[];
  filters: unknown[];
  visual: {
    title?: string | null;
    roles?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    capabilities?: Record<string, unknown>;
  };
  generatedAt: string;
  notes?: string[];
}
