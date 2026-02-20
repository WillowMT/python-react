# FastAPI + React Vite

Monorepo with FastAPI backend and React (Vite) frontend.

## Backend (FastAPI)

```bash
cd backend
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
uvicorn main:app --reload
```

API runs at http://localhost:8000  
Docs at http://localhost:8000/docs

## Frontend (React + Vite)

```bash
cd frontend
bun dev
```

App runs at http://localhost:5173

## API proxy

The frontend proxies `/api` to the backend during dev. Use `fetch('/api/health')` or call `http://localhost:8000` directly (CORS enabled).
