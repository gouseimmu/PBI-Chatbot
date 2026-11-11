import powerbi from 'powerbi-visuals-api';
import DataView = powerbi.DataView;
import { VisualMetadata } from '../models/VisualMetadata';

export class VisualContext {
  public extract(dataView?: DataView, options?: { title?: string; formatting?: Record<string, unknown> }): VisualMetadata {
    return {
      title: options?.title ?? dataView?.metadata?.columns?.[0]?.displayName ?? 'AI Data Copilot',
      roles: {
        categories: 'categories',
        measures: 'measures'
      },
      capabilities: {
        supportsMultipleCategories: true,
        supportsMultipleMeasures: true
      },
      formatting: options?.formatting ?? {},
      availableDataRoles: ['categories', 'measures']
    };
  }
}
