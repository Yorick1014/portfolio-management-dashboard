# Portfolio Management Dashboard

A full-stack portfolio dashboard for tracking investments, buy/sell
transactions, portfolio value, cost basis, gain/loss, and allocation by asset
type.

## Stack

- `frontend`: React, TypeScript, Vite, Tailwind CSS, Nginx
- `backend`: FastAPI, SQLModel, Alembic, JWT authentication
- `db`: PostgreSQL
- `delivery`: Docker Compose for the complete local stack

## Run With Docker Compose

```bash
docker compose up --build
```

Compose starts PostgreSQL, applies Alembic migrations, seeds the demo account,
starts the FastAPI backend, and serves the React app through Nginx.

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:8000/api/health`
- API docs: `http://localhost:8000/docs`

Demo sign-in:

```text
username: demo_user
password: password123
```

To reset the database and reseed the demo data:

```bash
docker compose down -v
docker compose up --build
```
