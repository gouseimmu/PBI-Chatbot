export interface VisualMetadata {
  title?: string | null;
  roles?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
  formatting?: Record<string, unknown>;
  availableDataRoles?: string[];
}
