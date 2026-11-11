export type FilterAvailability = 'available' | 'partial' | 'unavailable';

export interface FilterMetadata {
  id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  availability: FilterAvailability;
  selectedValues?: unknown[];
  details?: Record<string, unknown>;
}
