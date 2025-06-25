# Budget Management MVP

A full-stack application for tracking, analyzing, and managing personal or organizational budgets. This project demonstrates a modular, cloud-ready architecture using modern technologies for both frontend and backend.

## Purpose

The Budget Management MVP allows users to securely manage budgets, import data, analyze spending, and interact with budgets through a modern web interface. It is designed for easy deployment to AWS Lambda and DynamoDB, but supports local development with emulated services.

## Project Structure

```
budget-management-mvp/
  backend/      # FastAPI backend (Python)
    src/
      controllers/   # HTTP endpoint logic
      services/      # Business logic
      repositories/  # Data access (DynamoDB)
      models/        # Pydantic models
      routers/       # API routing
      exceptions/    # Custom errors
      utils/         # Helpers (auth, JWT, etc.)
    requirements.txt
  frontend/     # React frontend (TypeScript)
    src/
      api/           # Axios API wrappers
      components/    # UI components
      types/         # TypeScript types
      utils/         # Frontend helpers
      assets/        # Static resources
    tailwind.config.js
    package.json
  scripts/      # Setup scripts (DynamoDB tables)
```

## Technologies Used

### Frontend
- TypeScript, React, Vite
- TailwindCSS (utility-first styling)
- Axios (HTTP requests)
- React Data Grid (tabular data)
- Lucide React (icons)

### Backend
- Python 3.10+
- FastAPI (web framework)
- Uvicorn (ASGI server)
- SQLAlchemy (ORM)
- Pydantic (data validation)
- Pandas, Numpy (data processing)
- Celery, Redis (background tasks)
- boto3 (AWS SDK)
- DynamoDB (local for dev, AWS for prod)
- Pytest (testing)

## Local Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+
- AWS CLI
- Docker (for DynamoDB local)
- virtualenv (recommended)

### 1. Clone the repository
```sh
git clone <repo-url>
cd budget-management-mvp
```

### 2. Backend Setup
```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
- Create a `.env` file with:
  - `DYNAMODB_TABLE_NAME=budgets`
  - `DYNAMODB_ENDPOINT_URL=http://localhost:5555`
  - `AWS_REGION=us-west-2`
- Start DynamoDB local:
```sh
docker run -d -p 5555:8000 amazon/dynamodb-local
```
- Create the table:
```sh
bash ../scripts/create_budgets_table.sh
```
- Start the backend:
```sh
python src/main.py
```

### 3. Frontend Setup
```sh
cd frontend
npm install
npm run dev
```
- The app runs at [http://localhost:5173](http://localhost:5173)

## Additional Notes
- The backend expects DynamoDB local running on `localhost:5555`.
- For production, use `scripts/create_table_production_ready.sh`.
- Authentication is via AWS Cognito (stubbed/mocked for local dev).
