# Development Activities Log

Use this file to capture what you did, why you did it, and what’s next.

## Template (copy for each day)

### YYYY-MM-DD (Day)

- **Goal**:
- ## **What I did**:
- ## **Result / output**:
- ## **Notes / decisions**: Optional
- ## **Blockers / risks**: Optional

---

### 2026-05-01 (Fri)

- **Goal**: Pick an initial tech stack combination for the project.
- **What I did**:
  - Reviewed possible stack combinations and how they fit a small portfolio dashboard (speed of setup, maintainability, hosting).
- **Result / output**:
  - Shortlisted a preferred stack direction (to be finalized once requirements/data model are clear).
- **decisions**:
  - Prioritizing simplicity and fast iteration over maximum flexibility.
  - Although I am going to use AI to build it mostly, I should choose a tech stact that I am fimiliar with to reduce the risk.

---

### 2026-05-01 (Fri)

- **Goal**: Improve understanding of project requirements.
- **What I did**:
  - Re-read requirements and identified an unclear area: Add/Edit Investment vs Add/Edit Transaction History behavior.
  - Clarified the difference between an investment holding and a transaction record.
- **Result / output**:
  - Updated `PROJECT_REQUIREMENTS.md` so adding an investment creates an initial buy transaction.
  - Updated `PROJECT_REQUIREMENTS.md` so editing an investment only changes metadata or market fields.
  - Added transaction CRUD requirements and matching API routes.
- **Notes / decisions**:
  - Transactions are the source of truth for quantity and purchase cost.
  - Investment records represent holdings and descriptive metadata, not manually edited quantity or purchase price.
  - Buy transactions increase calculated quantity.
  - Sell transactions decrease calculated quantity and cannot exceed the currently held quantity.
  - Editing or deleting transactions must recalculate portfolio metrics.

---

### 2026-05-02 (Sat)

- **Goal**: Finalize project design before implementation.
- **What I did**:
  - Created and refined the project design plan.
  - Reviewed the requirements and design plan multiple times to find inconsistencies before coding.
  - Converted the design from a general concept into a concrete backend, frontend, database, API, and UI plan.
- **Result / output**:
  - Finalized the high-level architecture: React/Vite frontend, FastAPI backend, PostgreSQL database, and Docker Compose delivery.
  - Added a detailed database schema for users, investments, and transactions.
  - Added detailed API endpoint design for authentication, investments, transactions, and dashboard summary.
  - Added a lightweight UI design section with a professional trading platform style.
- **Notes / decisions**:
  - Use username and password for login instead of email.
  - Registration creates an account only; login returns the JWT.
  - Do not store investment quantity or purchase price directly on the investment record.
  - Enforce one investment per user and symbol; buying more of the same symbol should be handled by a buy transaction.
  - Use strict positive validation for prices and quantities.
  - Use a left sidebar layout instead of top navigation.
  - Use a professional trading platform style with compact cards, dense tables, aligned numbers, and green/red gain-loss indicators.

---

### 2026-05-02 (Sat)

- **Goal**: Decide deletion and transaction consistency rules.
- **What I did**:
  - Reviewed whether investment deletion should be allowed when transactions are the source of truth.
  - Compared possible approaches: archive investments, restrict deletion, or hard delete with cascade.
  - Chose the hard-delete approach for the first version.
- **Result / output**:
  - Updated the plan so deleting an investment also deletes its related transactions.
  - Added the requirement that the frontend must show a confirmation warning before deleting an investment.
  - Clarified that deletion should happen in one consistent database operation.
- **Notes / decisions**:
  - Hard delete with cascade keeps database references consistent because no transaction points to a missing investment.
  - The trade-off is that historical transaction records for the deleted investment are permanently removed.
  - This is acceptable for the assessment version because it keeps the product simpler and easier to finish.
- **Blockers / risks**:
  - If future requirements need audit history, this should be changed to archive/inactive status instead of hard delete.
- **Next**:
  - Implement cascade behavior carefully and make the delete warning clear in the UI.

---

### 2026-05-02 (Sat)

- **Goal**: Convert the design plan into an implementation checklist.
- **What I did**:
  - Reviewed the existing plan todos and found they were design-phase tasks, not build-phase tasks.
  - Replaced them with implementation-focused todos.
- **Result / output**:
  - Updated the plan todos to cover:
    - Scaffold frontend, backend, Docker Compose, and Git.
    - Implement backend models and Alembic migrations.
    - Implement username/password JWT authentication.
    - Implement investment API with automatic initial buy transaction.
    - Implement transaction CRUD and sell validation.
    - Implement dashboard calculation service.
    - Build frontend auth, protected sidebar layout, dashboard, investments, and transactions pages.
    - Add demo data, README, styling polish, and final Docker verification.
- **Notes / decisions**:
  - Implementation should be done in small verified batches.
  - Commit history should show clear progress through setup, backend, frontend, Docker, and final polish.
- **Blockers / risks**:
  - Building too much at once could make debugging harder, so each phase should be verified before moving on.
- **Next**:
  - Begin with project scaffolding and Docker Compose foundation.

---

### 2026-05-02 (Sat)

- **Goal**: Scaffold the project foundation.
- **What I did**:
  - Created a React + TypeScript Vite frontend with Tailwind CSS, React Router, and Axios dependencies.
  - Created a FastAPI backend skeleton with configuration, health route, SQLModel database wiring, and Alembic setup.
  - Added Dockerfiles, Docker Compose, `.gitignore`, and basic README instructions.
  - Initialized the project as a Git repository on `main`.
- **Result / output**:
  - Frontend production build passes.
  - Backend package installs in a local virtual environment and the FastAPI app imports successfully.
  - Marked the scaffold task complete in the implementation plan.
- **Blockers / risks**:
  - Docker is not installed in the current environment, so `docker compose up --build` could not be verified yet.

---

### 2026-05-02 (Sat)

- **Goal**: Complete Docker Compose verification after Docker Desktop installation.
- **What I did**:
  - Ran `docker compose up --build -d`.
  - Fixed the frontend Docker image to use `node:24.11.0-alpine`, matching the local Node/npm versions used to generate the lockfile.
  - Verified the running backend and frontend over HTTP.
- **Result / output**:
  - Docker Compose builds and starts the `db`, `backend`, and `frontend` services.
  - PostgreSQL reports healthy.
  - Backend health endpoint returns `{"status":"ok"}`.
  - Frontend responds with `HTTP/1.1 200 OK`.

---

### 2026-05-02 (Sat)

- **Goal**: Add persistent guidance for when to update the development activity log.
- **What I did**:
  - Created a project Cursor rule that asks agents to check whether `DEVELOPMENT_ACTIVITIES_LOG.md` needs a new entry after meaningful work.
- **Result / output**:
  - Added criteria for logging critical issues, decisions, non-trivial milestones, important verification results, and relevant follow-up constraints.
- **Notes / decisions**:
  - Trivial activity should not be logged, so the log remains focused on project-relevant decisions and outcomes.

---

### 2026-05-02 (Sat)

- **Goal**: Implement backend username/password authentication.
- **What I did**:
  - Added registration, login, JWT issuing, JWT validation, and the protected `/api/me` endpoint.
  - Added API tests for registration, duplicate usernames, login, current-user lookup, invalid credentials, and invalid tokens.
  - Replaced `passlib[bcrypt]` with direct `bcrypt` usage after reproducing a Python 3.14 / bcrypt 5 compatibility failure in Passlib.
  - Removed the committed default JWT secret so default tokens are not forgeable from repository contents.
- **Result / output**:
  - Backend tests pass with 14 tests.
  - Ruff passes for the backend.
- **Notes / decisions**:
  - Usernames are normalized by trimming and lowercasing before storage and login.
  - Password input is limited to 72 bytes to match bcrypt's hashing limit and avoid runtime hashing failures.

---

### 2026-05-02 (Sat)

- **Goal**: Complete the backend dashboard summary API using transaction-ledger calculations.
- **What I did**:
  - Added `GET /api/dashboard/summary` with authenticated user scoping.
  - Aggregated total current value, cost basis, gain/loss, performance percentage, and per-asset-type totals from calculated investment positions.
  - Added endpoint tests that cover multi-asset totals, sell-adjusted quantities, current-user isolation, and empty portfolios.
- **Result / output**:
  - Backend tests pass with 24 tests.
  - Ruff passes for the backend.
- **Notes / decisions**:
  - The summary reuses average-cost investment calculations so dashboard metrics stay consistent with investment responses.

---

### 2026-05-02 (Sat)

- **Goal**: Complete the frontend authentication flow and establish the trading-terminal UI direction.
- **What I did**:
  - Added React Router auth routes for login, registration, protected app pages, and redirects.
  - Added a shared Axios API client with JWT attachment and simple token-backed auth state.
  - Built the protected dashboard shell with sidebar navigation, logout, placeholder dashboard/investment/transaction pages, and a light/dark mode switch.
  - Iterated the visual style toward a professional trading platform layout using compact panels, dense text hierarchy, orange navigation accents, and green/red financial metric colors.
  - Added Vitest and Testing Library coverage for auth routing, protected layout behavior, full navigation labels, range controls, and the theme switch.
- **Result / output**:
  - Frontend tests pass with 4 tests.
  - Frontend production build passes.
  - Frontend lint passes.
  - Marked the frontend auth/layout task complete in the implementation plan.
- **Notes / decisions**:
  - Finalized the style direction before building the data-heavy dashboard pages, so task 8 can reuse the terminal layout instead of restyling later.
  - Kept dashboard, investments, and transactions as route placeholders for now because the detailed tables/forms belong to the next frontend pages task.
- **Next**:
  - Build the real dashboard, investments, and transaction pages against the existing backend APIs using this terminal-style shell.

---

### 2026-05-02 (Sat)

- **Goal**: Replace frontend page placeholders with assessment-ready portfolio workflows.
- **What I did**:
  - Built API-backed dashboard summary cards and asset allocation from `/api/dashboard/summary`.
  - Added holdings and transaction tables with create/edit forms, loading, empty, error, success, and delete-confirmation states.
  - Added focused React tests for dashboard data, investment create/edit/delete, transaction create/delete, and sell-validation error display.
- **Result / output**:
  - Frontend tests pass with 9 tests.
  - Frontend production build passes.
  - Frontend lint passes.
  - Marked the frontend pages task complete in the implementation plan.
- **Notes / decisions**:
  - Kept transaction quantity and investment cost fields derived from backend responses; edit investment only changes metadata/current price.
  - Investment deletion explicitly warns that related transaction history will be removed.

