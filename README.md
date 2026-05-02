# Portfolio Management Dashboard

Full-stack portfolio dashboard scaffold using React, FastAPI, PostgreSQL, and Docker Compose.

## Services

- `frontend`: React, TypeScript, Vite, Tailwind CSS
- `backend`: FastAPI, SQLModel, Alembic
- `db`: PostgreSQL

## Local Development

Install frontend dependencies:

```bash
cd frontend
npm install
npm run dev
```

Run the backend locally:

```bash
cd backend
pip install -e .
fastapi dev app/main.py
```

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

The backend health endpoint is available at `http://localhost:8000/api/health`.
