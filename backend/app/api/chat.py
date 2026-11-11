from fastapi import APIRouter, HTTPException
from fastapi import status
from ..models import ChatRequest, ChatResponse
from ..config import settings
from ..services.dataset_guard import DatasetGuard
from ..services.context_optimizer import ContextOptimizer
from ..services.llm_service import ConfigurationError, OpenAIError, OpenAIProvider

router = APIRouter()

@router.get('/health')
async def health():
    return {"status": "ok"}


@router.post('/api/chat', response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty question")

    # Run dataset guard
    guard = DatasetGuard()
    guard_result = guard.check(question, req.dataContext)
    if not guard_result.get('allowed', True):
        return ChatResponse(answer="I can only answer questions related to the current Power BI dataset.", source="dataset_guard", model=settings.AZURE_OPENAI_DEPLOYMENT)

    # Optimize context
    optimizer = ContextOptimizer(max_rows=settings.MAX_CONTEXT_ROWS, max_chars=settings.MAX_CONTEXT_CHARS)
    optimized = optimizer.optimize(req.dataContext)

    # Call LLM provider
    try:
        provider = OpenAIProvider()
        response = provider.ask(question, optimized)
        return ChatResponse(answer=response.get('answer', ''), source=response.get('source', 'powerbi_dataset'), model=response.get('model', settings.AZURE_OPENAI_DEPLOYMENT))
    except ConfigurationError as exc:
        return ChatResponse(answer=str(exc), source="error", model=settings.AZURE_OPENAI_DEPLOYMENT)
    except OpenAIError as exc:
        return ChatResponse(answer=str(exc), source="error", model=settings.AZURE_OPENAI_DEPLOYMENT)
    except Exception:
        return ChatResponse(answer="The AI service is temporarily unavailable. Please try again.", source="error", model=settings.AZURE_OPENAI_DEPLOYMENT)
