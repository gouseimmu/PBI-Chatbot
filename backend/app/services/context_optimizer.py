from typing import Dict, Any
from copy import deepcopy


class ContextOptimizer:
    def __init__(self, max_rows: int = 500, max_chars: int = 100000):
        self.max_rows = max_rows
        self.max_chars = max_chars

    def optimize(self, data_context: Any) -> Dict[str, Any]:
        if hasattr(data_context, 'model_dump'):
            ctx = deepcopy(data_context.model_dump())
        else:
            ctx = deepcopy(data_context)

        dataset = ctx.get('dataset', {})
        rows = ctx.get('data', []) or []
        total_rows = len(rows)

        provided_rows = rows[: self.max_rows]
        truncated = total_rows > len(provided_rows)

        # Trim heavy metadata from fields
        schema = {
            'fields': [{k: f.get(k) for k in ('name', 'displayName', 'type', 'role', 'isMeasure')} for f in dataset.get('fields', [])],
            'measures': [{k: f.get(k) for k in ('name', 'displayName', 'type', 'role', 'isMeasure')} for f in dataset.get('measures', [])]
        }

        optimized = {
            'schema': schema,
            'data': provided_rows,
            'filters': ctx.get('filters', []),
            'visual': ctx.get('visual', {}),
            'metadata': {
                'rowCount': total_rows,
                'rowsProvided': len(provided_rows),
                'truncated': truncated,
                'truncationReason': dataset.get('truncationReason') if truncated else None
            }
        }

        # Safety: if char length too big, truncate rows further and flag
        approx_chars = len(str(optimized))
        if approx_chars > self.max_chars:
            # reduce rows
            keep = max(0, int(len(provided_rows) * (self.max_chars / approx_chars)))
            optimized['data'] = provided_rows[:keep]
            optimized['metadata']['rowsProvided'] = keep
            optimized['metadata']['truncated'] = True
            optimized['metadata']['truncationReason'] = 'Context size exceeded maximum characters; data preview truncated.'

        return optimized
