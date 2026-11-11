# AI Data Copilot Backend

This backend hosts a dataset-only AI assistant for the Power BI custom visual. It validates questions against the supplied Power BI `DataContext`, optimizes the context, and forwards the request to an LLM provider using the OpenAI Responses API.

Prerequisites:
- Python 3.10+
- Create a `.env` file from `.env.example` and set `OPENAI_API_KEY` and `OPENAI_MODEL`.

Local development URL (default): `http://127.0.0.1:8000`

Do NOT commit your real `.env` or API keys.
