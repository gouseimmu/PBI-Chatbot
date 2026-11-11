import powerbi from 'powerbi-visuals-api';
import DataView = powerbi.DataView;
import { FilterMetadata } from '../models/FilterMetadata';

export class FilterContext {
  public extract(dataView?: DataView): FilterMetadata[] {
    if (!dataView) {
      return [];
    }

    const filters: FilterMetadata[] = [];
    const hasFilterContext = Boolean(dataView.metadata?.columns?.length);

    if (hasFilterContext) {
      filters.push({
        name: 'Power BI filtering context',
        availability: 'partial',
        isActive: false,
        description: 'The visual API exposes metadata, but detailed filter values are not always available to a custom visual.'
      });
    }

    return filters;
  }
}
