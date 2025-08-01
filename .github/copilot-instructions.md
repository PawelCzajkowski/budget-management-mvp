# GitHub Copilot Custom Instructions

This project is a full-stack budget management system under development. It consists of a **backend written in Python using FastAPI** and a **frontend written in React with TypeScript**, styled with **TailwindCSS** and using **Axios** for HTTP requests.

## Project Architecture

### General Structure

**Backend (Python / FastAPI):**
- Located in `backend/src`
- Organized loosely following MVC principles:
  - `controllers/` – handle HTTP endpoints
  - `services/` – contain business logic
  - `repositories/` – will store data access logic
  - `models/` – Pydantic models for validation and parsing
  - `routers/` – for API routing organization
  - `exceptions/` – custom error classes
  - `utils/` – shared helper functions

**Frontend (React / TypeScript):**
- Located in `frontend/src`
- Key folders:
  - `api/` – Axios client instances and API wrappers
  - `components/` – reusable UI components
  - `types/` – global TypeScript types
  - `utils/` – shared frontend utility functions
  - `assets/` – static resources like images

## Backend Architecture Strategy

- **Decompose the backend into Lambda-based microservices**. Each controller should be scoped as an independent FastAPI app that can be containerized and deployed to a dedicated AWS Lambda function.
- Use **API Gateway** to route requests to the appropriate Lambda.
- Business logic should be in the `services/` layer and fully isolated from HTTP logic.
- All data access should eventually reside in `repositories/`, abstracted from services.
- Models used for communication (DTOs) must use Pydantic.
- Local development should run using emulated services (e.g., DynamoDB on `localhost:5555`).

## Frontend Strategy

- Use **Axios** for all API requests. API methods should be centralized under `api/`.
- Use **TailwindCSS** v4 for styling with utility-first design.
- Follow **Google’s TypeScript style guide**.
- Global state: start with **React Context API** for minimal shared state; for scalability, migrate to **Zustand** for lightweight, scalable state management.
- Components should be functional and typed using `React.FC`.

## Deployment & Environment Strategy

- **Local development** should emulate AWS services. Example: DynamoDB local on port `5555`.
- **Production deployment** must use AWS services:
  - Lambda
  - API Gateway
  - DynamoDB
  - S3 (for static frontend hosting, if applicable)

## Testing Strategy

- Backend:
  - Use **Pytest** for unit and integration tests.
  - Mock external services and database access in tests.
- Frontend:
  - Use **React Testing Library** and **Jest**.
  - Write tests for reusable components and API integrations.

## Security

- Use **AWS Cognito** for authentication:
  - Frontend users must sign in via Cognito-hosted UI or embedded user pools.
  - Cognito ID tokens should be sent in the `Authorization` header to the backend.
  - FastAPI should verify tokens using Cognito's public JWK endpoint.
- Do not commit secrets. Use `.env` files for local development and **AWS Secrets Manager** in production.
- All request payloads must be validated with **Pydantic** to prevent injection attacks.
- Enable and configure **CORS** in FastAPI to restrict frontend origins.
- Use **HTTPS** via API Gateway in production.
- Avoid exposing stack traces and internal errors in client responses.
- Escape untrusted content in the frontend and avoid use of `dangerouslySetInnerHTML`.
- Role-based access control (RBAC) is not currently implemented, but should be added if the need arises.

## Best Practices for GitHub Copilot Suggestions

- Always propose modular, scalable solutions.
- Avoid tightly coupled logic between HTTP layer and services.
- Scaffold new backend features as microservices structured around controllers and services.
- Prioritize clean, typed components and reusable logic on the frontend.
- Follow the existing project structure; new files must go in the appropriate folder (`api/`, `components/`, etc.).
