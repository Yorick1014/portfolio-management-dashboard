# Portfolio Management Dashboard Requirements

## Project Goal

Build a basic Portfolio Management Dashboard application that allows users to manage and review their investment portfolios. The project should demonstrate full-stack development ability, including authentication, frontend UI, backend API design, database persistence, Docker-based delivery, and Git version control.

## Functional Requirements

### 1. User Authentication

- Users should be able to register an account.
- Users should be able to log in with their username and password.
- Registration should create the account only; users should log in after registration to receive a JWT.
- The backend should issue a JWT after successful login.
- Protected API routes should require a valid JWT.
- Users should be able to log out from the frontend.
- Passwords must be stored securely using bcrypt hashing.

### 2. Portfolio Overview

- Users should be able to view a dashboard summary of their investment portfolio.
- The dashboard should display total portfolio value.
- The dashboard should display total purchase cost.
- The dashboard should display total gain or loss.
- The dashboard should display percentage performance.
- The dashboard should summarize assets by type, such as:
  - Stocks
  - Bonds
  - Mutual funds

### 3. Investment Management

- Users should be able to add new investments as portfolio holdings.
- When a user adds a new investment, the application should also create an initial buy transaction for that investment.
- Users should be able to edit existing investment metadata.
- Editing an investment should only update descriptive or market fields, such as asset name, symbol, asset type, and current price.
- Editing an investment should not directly change quantity or purchase price, because those values should come from transaction records.
- Each user should only have one investment record per symbol.
- If a user buys more of an existing symbol, they should add a buy transaction instead of creating a duplicate investment.
- Deleting an investment should also delete all related transactions for that investment.
- The frontend should show a confirmation warning before deleting an investment because related transaction history will also be deleted.
- Users should be able to view their list of investments.
- Each investment should include:
  - Asset name
  - Symbol or identifier
  - Asset type
  - Current price
  - Current quantity, calculated from buy and sell transactions
  - Average purchase price or cost basis, calculated from buy transactions
  - Current value
  - Performance metrics

### 4. Transaction History

- Users should be able to view a history of buy and sell transactions.
- Users should be able to add buy and sell transactions for existing investments.
- Users should be able to edit existing transactions.
- Users should be able to delete transactions.
- Buy transactions should increase the calculated investment quantity.
- Sell transactions should decrease the calculated investment quantity.
- Editing or deleting a transaction should update the calculated investment quantity, cost basis, current value, and performance metrics.
- Sell transactions should not allow users to sell more quantity than they currently hold.
- Transaction records should be the source of truth for quantity and purchase cost.
- Each transaction should include:
  - Investment
  - Transaction type: buy or sell
  - Quantity
  - Price
  - Transaction date

## Technical Requirements

### 1. Frontend

- Use React for the user interface.
- Use TypeScript for type safety.
- Use Vite as the frontend build tool.
- Use Tailwind CSS for styling.
- Use React Router for page navigation.
- Use Axios for API communication.

### 2. Backend

- Use FastAPI for the backend REST API.
- Use SQLModel for database models and database access.
- Use PostgreSQL as the database.
- Use Alembic for database migrations.
- Use JWT for authentication.
- Use bcrypt for password hashing.

### 3. DevOps

- Use Docker Compose to run the full application.
- Include services for the frontend, backend, and database.
- The application should be runnable with:

```bash
docker compose up --build
```

### 4. Version Control

- Use Git for source control.
- Maintain a clear commit history that demonstrates project progress.
- Suggested commit milestones:
  - Initial project setup
  - Backend database models
  - Authentication implementation
  - Investment management API
  - Transaction CRUD API
  - Frontend authentication flow
  - Portfolio dashboard UI
  - Transaction history feature
  - Docker Compose setup
  - README and final polish

## Suggested API Scope

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/investments`
- `POST /api/investments`
- `PUT /api/investments/{investment_id}`
- `DELETE /api/investments/{investment_id}`
- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/{transaction_id}`
- `DELETE /api/transactions/{transaction_id}`
- `GET /api/dashboard/summary`

## Success Criteria

- A reviewer can run the project locally with Docker Compose.
- A user can register, log in, and log out.
- Authenticated users can manage investments.
- Authenticated users can create, edit, and delete transactions.
- Authenticated users can view portfolio summary data.
- Authenticated users can view transaction history.
- Data is persisted in PostgreSQL.
- The repository includes clear documentation and meaningful Git history.

## Out of Scope for Initial Version

- Real-time market price integration.
- Advanced charting or analytics.
- Multi-currency support.
- Password reset by email.
- OAuth login.
- Production cloud deployment.

