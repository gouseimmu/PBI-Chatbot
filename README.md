# AI Data Copilot

## Project
AI Data Copilot is a Power BI custom visual foundation designed to eventually provide a dataset-only AI data copilot experience inside Power BI reports.

## Purpose
This Phase 1 implementation focuses on the visual foundation only:
- Power BI custom visual shell
- React-based chat interface
- DataView extraction and schema awareness
- Semantic DataContext preparation
- Formatting, error handling, and dataset-aware architecture hooks

## Dataset-only architecture
Power BI
→ Custom Visual
→ DataView
→ Semantic Data Context
→ Dataset Scope Validator
→ Data Analysis / LLM
→ Validated Dataset Answer

## Dataset-only scope
The future assistant must only answer questions that can be answered from the Power BI data currently bound to the visual. It must not use general knowledge, current events, web search, or external information.

## Phase 2 behavior (documented, not implemented)
- Unrelated questions are rejected with: "I can only answer questions related to the data available in this Power BI report."
- Dataset-related but unavailable questions are answered as unavailable from the current dataset.
- The intent router should only use dataset-bound intents such as summary, aggregation, comparison, trend, ranking, percentage, growth, difference, visualization explanation, and metadata.

## Installation prerequisites
The following development tools are typically required for later development:
- Node.js and npm
- Power BI visuals tooling
- TypeScript
- Visual Studio Code

## Development
The following commands are defined for later use, but were not executed during Phase 1 implementation:
- npm install
- npm start
- npm run package

## Power BI integration
1. Build or package the custom visual.
2. Obtain the .pbiviz file.
3. Import the visual into Power BI Desktop.
4. Add AI Data Copilot to the report.
5. Bind dimensions and measures to the visual.
6. Power BI supplies the DataView.
7. The DataContext is generated for future dataset-only AI processing.

## Limitations
- No LLM backend in Phase 1
- No web search in Phase 1
- No external information in Phase 1
- No dataset-scope validator implementation yet
- No production AI responses yet
- Build, package, npm, Python, and automated test execution were intentionally skipped as requested

## Phase 2 Backend (added files)

This repository now includes a `backend/` folder containing a FastAPI backend scaffold that performs dataset-only validation, context optimization, and forwards requests to the OpenAI Responses API.

Key notes:
- Configure backend by creating `backend/.env` from `backend/.env.example` and set `OPENAI_API_KEY` and `OPENAI_MODEL`.
- The backend listens by default on `http://127.0.0.1:8000` and exposes `POST /api/chat` and `GET /health`.
- Do NOT commit `.env` or API keys.

Do not run any install/build/test commands automatically; follow the README in `backend/` for manual setup.
