from typing import Any, Dict, List, Optional
from pydantic import BaseModel, RootModel


class DataFieldMetadata(BaseModel):
    name: str
    displayName: Optional[str] = None
    queryName: Optional[str] = None
    type: Optional[str] = None
    role: Optional[str] = None
    category: Optional[str] = None
    isMeasure: Optional[bool] = None
    format: Optional[str] = None
    aggregation: Optional[str] = None
    source: Optional[str] = None


class DatasetSummary(BaseModel):
    fields: List[DataFieldMetadata]
    measures: List[DataFieldMetadata]
    rowCount: int
    availableRows: Optional[int]
    isTruncated: bool
    truncationReason: Optional[str] = None


class DataRow(RootModel[Dict[str, Any]]):
    pass


class DataContext(BaseModel):
    dataset: DatasetSummary
    data: List[Dict[str, Any]]
    filters: List[Any]
    visual: Dict[str, Any]
    generatedAt: str
    notes: Optional[List[str]] = None


class ChatRequest(BaseModel):
    question: str
    dataContext: DataContext


class ChatResponse(BaseModel):
    answer: str
    source: str
    model: Optional[str] = None


class GuardResponse(BaseModel):
    allowed: bool
    reason: str
