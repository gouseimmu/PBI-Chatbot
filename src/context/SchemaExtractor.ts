import powerbi from 'powerbi-visuals-api';
import DataView = powerbi.DataView;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import { DataFieldMetadata } from '../models/DataContext';

export class SchemaExtractor {
  public extractSchema(dataView?: DataView): DataFieldMetadata[] {
    if (!dataView) {
      return [];
    }

    const metadataColumns = dataView.metadata?.columns ?? [];
    const fields: DataFieldMetadata[] = [];

    metadataColumns.forEach((column: DataViewMetadataColumn) => {
      fields.push(this.extractField(column));
    });

    if (fields.length === 0) {
      const categorical = dataView.categorical;
      const categories = categorical?.categories ?? [];

      categories.forEach((category, index) => {
        const source = category.source;
        fields.push({
          name: source?.displayName ?? `category_${index}`,
          displayName: source?.displayName ?? null,
          queryName: source?.queryName ?? null,
          type: this.mapValueTypeToInternalType(source?.type),
          role: this.extractRole(source?.roles),
          category: 'categorical',
          isMeasure: false,
          format: source?.format ?? null,
          aggregation: this.extractAggregation(source?.aggregates),
          source: 'categorical'
        });
      });

      const valueColumns = Array.isArray(categorical?.values) ? categorical.values : [];
      valueColumns.forEach((valueColumn, index) => {
        const source = valueColumn.source;
        fields.push({
          name: source?.displayName ?? `measure_${index}`,
          displayName: source?.displayName ?? null,
          queryName: source?.queryName ?? null,
          type: this.mapValueTypeToInternalType(source?.type),
          role: this.extractRole(source?.roles),
          category: 'measure',
          isMeasure: true,
          format: source?.format ?? null,
          aggregation: this.extractAggregation(source?.aggregates),
          source: 'categorical-values'
        });
      });
    }

    if (fields.length === 0 && dataView.table?.columns) {
      dataView.table.columns.forEach((column, index) => {
        fields.push({
          name: column.displayName ?? `column_${index}`,
          displayName: column.displayName ?? null,
          queryName: column.queryName ?? null,
          type: this.mapValueTypeToInternalType(column.type),
          role: this.extractRole(column.roles),
          category: 'table',
          isMeasure: Boolean(column.isMeasure),
          format: column.format ?? null,
          aggregation: this.extractAggregation(column.aggregates),
          source: 'table'
        });
      });
    }

    return fields;
  }

  public extractField(column: DataViewMetadataColumn): DataFieldMetadata {
    return {
      name: column.displayName ?? column.queryName ?? 'field',
      displayName: column.displayName ?? null,
      queryName: column.queryName ?? null,
      type: this.mapValueTypeToInternalType(column.type),
      role: this.extractRole(column.roles),
      category: this.toStringValue(column.groupName),
      isMeasure: Boolean(column.isMeasure),
      format: column.format ?? null,
      aggregation: this.extractAggregation(column.aggregates),
      source: column.queryName ? 'metadata' : null
    };
  }

  private mapValueTypeToInternalType(type?: powerbi.ValueTypeDescriptor | null): string | null {
    if (!type) {
      return null;
    }

    if (type.text) {
      return 'text';
    }

    if (type.integer) {
      return 'integer';
    }

    if (type.numeric) {
      return 'numeric';
    }

    if (type.bool) {
      return 'boolean';
    }

    if (type.dateTime) {
      return 'datetime';
    }

    if (type.temporal) {
      return 'date';
    }

    return 'unknown';
  }

  private extractRole(roles?: { [name: string]: boolean } | null): string | null {
    if (!roles) {
      return null;
    }

    return Object.keys(roles)[0] ?? null;
  }

  private extractAggregation(aggregates?: powerbi.DataViewColumnAggregates | null): string | null {
    if (!aggregates) {
      return null;
    }

    return Object.keys(aggregates)[0] ?? null;
  }

  private toStringValue(value?: powerbi.PrimitiveValue | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    return String(value);
  }
}
