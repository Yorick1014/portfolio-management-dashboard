# Portfolio Management Dashboard Tech Stack

## Frontend

- **React**: Builds the user interface for login, dashboard, investments, and transaction history.
- **TypeScript**: Adds type safety to the frontend code and reduces runtime mistakes.
- **Vite**: Provides fast local development and production builds for the React app.
- **Tailwind CSS**: Handles styling with utility classes for quick, clean dashboard UI development.
- **React Router**: Manages frontend routes such as login, dashboard, investments, and transactions.
- **Axios**: Sends HTTP requests from the frontend to the FastAPI backend.

## Backend

- **FastAPI**: Provides the REST API, request validation, authentication endpoints, and business logic.
- **SQLModel**: Defines database models and simplifies database access with Python classes.
- **PostgreSQL**: Stores users, investments, portfolios, and transaction history.
- **Alembic migrations**: Tracks and applies database schema changes over time.
- **JWT auth**: Authenticates users by issuing and verifying signed JSON Web Tokens.
- **bcrypt password hashing**: Securely hashes user passwords before storing them in the database.

## DevOps

- **Docker Compose**: Runs the frontend, backend, and PostgreSQL database together with one command.
- **Git**: Tracks source code history and demonstrates the project development process.

## High-Level Architecture

```text
React + TypeScript Frontend
        |
        | HTTP requests with Axios
        v
FastAPI Backend with JWT Auth
        |
        | SQLModel database access
        v
PostgreSQL Database
```

## Suggested Local Run Goal

The final project should be runnable with:

```bash
docker compose up --build
```
