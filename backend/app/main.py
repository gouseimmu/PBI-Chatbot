from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import chat as chat_api
from .config import settings

app = FastAPI(title='AI Data Copilot Backend')

# CORS - development-friendly but not permissive for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(chat_api.router)

@app.get('/health')
async def health():
    return {"status": "ok"}
