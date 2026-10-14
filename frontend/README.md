# Frontend

This Next.js App Router project is the Asterion Assist chat interface. It sends questions to the FastAPI backend, displays grounded answers, and shows retrieved source excerpts as expandable citations.

For the complete RAG explanation, architecture, package descriptions, API contract, backend setup, environment configuration, and troubleshooting, see the [project README](../README.md).

## Run locally

From this `frontend/` directory:

```powershell
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
npm run dev
```

Open `http://localhost:3000`. The backend should be running at `http://localhost:8000`; configure the URL using `NEXT_PUBLIC_API_URL` in `.env.local` if needed. The frontend must not contain the Gemini API key.

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
```
