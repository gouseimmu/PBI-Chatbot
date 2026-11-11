import powerbi from 'powerbi-visuals-api';
import DataView = powerbi.DataView;
import { DataContext, DataRow, DataFieldMetadata } from '../models/DataContext';
import { SchemaExtractor } from './SchemaExtractor';
import { FilterContext } from './FilterContext';
import { VisualContext } from './VisualContext';

export class DataContextBuilder {
  private schemaExtractor = new SchemaExtractor();
  private filterContext = new FilterContext();
  private visualContext = new VisualContext();
  private static readonly PREVIEW_ROW_LIMIT = 1000;

  public build(dataView: DataView | undefined, options?: { title?: string; formatting?: Record<string, unknown> }): DataContext {
    const fields = this.schemaExtractor.extractSchema(dataView);
    const { rows, rowCount } = this.extractRows(dataView, fields);
    const measures = fields.filter((field) => field.isMeasure);

    const dataset = {
      fields,
      measures,
      rowCount,
      availableRows: Math.min(rowCount, DataContextBuilder.PREVIEW_ROW_LIMIT),
      isTruncated: rowCount > DataContextBuilder.PREVIEW_ROW_LIMIT,
      truncationReason: rowCount > DataContextBuilder.PREVIEW_ROW_LIMIT ? 'Row count exceeds safe preview size.' : null
    };

    return {
      dataset,
      data: rows,
      filters: this.filterContext.extract(dataView),
      visual: this.visualContext.extract(dataView, options),
      generatedAt: new Date().toISOString(),
      notes: [
        'Context built from the available DataView structure.',
        'No AI backend or external data source is connected in Phase 1.'
      ]
    };
  }

  private extractRows(dataView: DataView | undefined, fields: DataFieldMetadata[]): { rows: DataRow[]; rowCount: number } {
    if (!dataView) {
      return { rows: [], rowCount: 0 };
    }

    if (dataView.table?.rows) {
      const rows = dataView.table.rows as unknown[][];
      const rowCount = rows.length;
      const previewRows = rows.slice(0, DataContextBuilder.PREVIEW_ROW_LIMIT).map((row) => {
        const obj: DataRow = {};
        row.forEach((value, columnIndex) => {
          const fieldName = fields[columnIndex]?.name ?? `column_${columnIndex}`;
          obj[fieldName] = value;
        });
        return obj;
      });

      return { rows: previewRows, rowCount };
    }

    const categorical = dataView.categorical;
    if (categorical) {
      const categories = categorical.categories ?? [];
      const valueColumns = Array.isArray(categorical.values) ? categorical.values : [];

      const categoryLengths = categories.map((category) => category.values?.length ?? 0);
      const valueLengths = valueColumns.map((valueColumn) => Array.isArray(valueColumn.values) ? valueColumn.values.length : 0);
      const lengths = [...categoryLengths, ...valueLengths].filter((length) => length > 0);
      const rowCount = lengths.length > 0 ? Math.min(...lengths) : 0;
      const previewCount = Math.min(rowCount, DataContextBuilder.PREVIEW_ROW_LIMIT);

      const categoryFields = fields.filter((field) => !field.isMeasure);
      const measureFields = fields.filter((field) => field.isMeasure);

      const rows: DataRow[] = [];
      for (let index = 0; index < previewCount; index += 1) {
        const row: DataRow = {};

        categories.forEach((category, categoryIndex) => {
          const fieldName = categoryFields[categoryIndex]?.name ?? category.source?.displayName ?? `category_${categoryIndex}`;
          row[fieldName] = category.values?.[index] ?? null;
        });

        valueColumns.forEach((valueColumn, valueIndex) => {
          const fieldName = measureFields[valueIndex]?.name ?? valueColumn.source?.displayName ?? `measure_${valueIndex}`;
          row[fieldName] = Array.isArray(valueColumn.values) ? valueColumn.values[index] : null;
        });

        rows.push(row);
      }

      return { rows, rowCount };
    }

    return { rows: [], rowCount: 0 };
  }
}
