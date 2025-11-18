# Contract Test Harness Platform

> A comprehensive platform for managing HTTP contract tests across multiple services using OpenAPI specifications as the source of truth.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

The Contract Test Harness Platform automates the creation and execution of HTTP contract tests based on OpenAPI 3.0 specifications. It provides a complete workflow from service registration to test execution and results visualization, making it easy to ensure API contracts are maintained across your service ecosystem.

## Tech Stack

- **Backend**: NestJS + TypeScript + Prisma
- **Database**: PostgreSQL
- **Test Runner**: Jest
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Deployment**: Docker + Docker Compose

## Domain Model

### Core Entities

```
Service
├── id: string
├── name: string
├── baseUrl: string
├── description?: string
└── relationships:
    ├── apiSpecs[]
    └── contractSuites[]

ApiSpec
├── id: string
├── serviceId: string
├── version: string
├── format: OPENAPI_JSON | OPENAPI_YAML
├── rawText: string (OpenAPI spec content)
└── relationship:
    └── service

ContractSuite
├── id: string
├── serviceId: string
├── name: string
├── description?: string
├── configJson: string (test configuration)
└── relationships:
    ├── service
    └── runs[]

ContractRun
├── id: string
├── suiteId: string
├── startedAt: DateTime
├── finishedAt?: DateTime
├── status: RUNNING | PASSED | FAILED | ERROR
├── summaryJson?: string (test results)
├── logPath?: string
└── relationship:
    └── suite
```

### Key Relationships

- A **Service** represents an API endpoint (e.g., User API, Payment Service)
- An **ApiSpec** is a versioned OpenAPI specification for a Service
- A **ContractSuite** contains auto-generated tests based on an ApiSpec
- A **ContractRun** is a single execution of a ContractSuite with results

## Getting Started

### Requirements

- **Node.js** 18+ and npm
- **PostgreSQL** 15+ (or use Docker)
- **Docker** and **Docker Compose** (optional, for containerized setup)

### Setup

#### Option 1: Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd contract-test-harness-platform
```

2. **Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Frontend
cp frontend/.env.example frontend/.env.local
# Root (for docker-compose)
cp .env.example .env
```

3. **Install dependencies**
```bash
# Install root dependencies
npm install

# Or install all at once
cd backend && npm install
cd ../frontend && npm install
```

4. **Set up database**
```bash
# Run migrations
cd backend
npx prisma migrate dev

# Seed with demo data
npm run db:seed
```

5. **Start the applications**
```bash
# From root directory - starts both backend and frontend
npm run dev

# Or individually:
npm run dev:backend   # Backend on http://localhost:3001
npm run dev:frontend  # Frontend on http://localhost:3000
```

#### Option 2: Docker

1. **Clone and configure**
```bash
git clone <repository-url>
cd contract-test-harness-platform
cp .env.example .env
```

2. **Start everything**
```bash
docker-compose up -d
```

3. **Run migrations and seed (first time only)**
```bash
# Wait for containers to be ready, then:
docker exec contract-testing-backend npx prisma migrate deploy
docker exec contract-testing-backend npm run db:seed
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api

### Quick Start Scripts

```bash
# Development
npm run dev              # Start both backend and frontend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Building
npm run build            # Build both projects
npm run typecheck        # Type check both projects

# Testing
npm test                 # Run all tests
npm run test:backend     # Backend tests only
npm run lint             # Lint code

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database with demo data
npm run db:reset         # Reset database (WARNING: deletes all data)
npm run db:studio        # Open Prisma Studio

# Docker
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
npm run docker:logs      # View logs
npm run docker:rebuild   # Rebuild and restart
```

## Example Flow: Complete Vertical Slice

This platform provides a complete end-to-end workflow. Here's how to use it:

### 1. Register a Service

**Via UI**:
- Navigate to http://localhost:3000/services
- Click "Add Service"
- Fill in:
  - **Name**: "JSONPlaceholder API"
  - **Base URL**: "https://jsonplaceholder.typicode.com"
  - **Description**: "Free fake API for testing"

**Via API**:
```bash
curl -X POST http://localhost:3001/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "JSONPlaceholder API",
    "baseUrl": "https://jsonplaceholder.typicode.com",
    "description": "Free fake API for testing"
  }'
```

### 2. Upload OpenAPI Spec

**Via UI**:
- Click on your service
- Go to "API Specs" tab
- Click "Upload API Spec"
- Paste the OpenAPI JSON/YAML
- Click "Upload Spec"

**Via API**:
```bash
curl -X POST http://localhost:3001/api-specs \
  -H "Content-Type: application/json" \
  -d @examples/sample-openapi.json
```

The platform will:
- ✅ Validate the OpenAPI specification
- ✅ Parse all endpoints and methods
- ✅ Identify which endpoints can be tested

### 3. Generate Contract Suite

**Via UI**:
- Click on your uploaded spec
- Click "Generate Contract Suite"

**Via API**:
```bash
curl -X POST http://localhost:3001/contract-suites/generate \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "<service-id>",
    "apiSpecId": "<spec-id>"
  }'
```

The platform automatically:
- ✅ Analyzes GET endpoints without required parameters
- ✅ Generates a Jest test file
- ✅ Saves it to `backend/generated-contract-tests/`
- ✅ Creates a ContractSuite record

### 4. Run Tests

**Via UI**:
- Navigate to your contract suite
- Click "Run Tests"
- Watch real-time status updates

**Via API**:
```bash
curl -X POST http://localhost:3001/contract-runs/execute \
  -H "Content-Type: application/json" \
  -d '{
    "suiteId": "<suite-id>"
  }'
```

### 5. View Results

**Via UI**:
- Results appear automatically on the suite page
- Click on a run to see detailed results:
  - Total/Passed/Failed counts
  - Duration
  - Individual test results
  - Error messages (if any)

**Via API**:
```bash
curl http://localhost:3001/contract-runs/<run-id>
```

## Test Generation Strategy

### What Gets Tested

The platform generates tests for:
- **GET endpoints** without required parameters

### Test Logic

For each eligible endpoint:
```javascript
test('GET /endpoint', async () => {
  const response = await axios.get(`${baseURL}/endpoint`, {
    validateStatus: (status) => status < 500,
  });

  // Assert: no 5xx server errors
  expect(response.status).toBeLessThan(500);
  expect(response.status).toBeGreaterThanOrEqual(200);
});
```

This validates:
- ✅ Endpoint is accessible
- ✅ Server doesn't crash (no 5xx errors)
- ✅ Basic contract is maintained

### Why This Strategy?

- **No auth required**: Tests work immediately
- **No test data needed**: GET endpoints don't modify state
- **Fast execution**: Simple HTTP requests
- **Contract validation**: Ensures APIs respond as expected

## Demo Data

After running `npm run db:seed`, you'll have:

- **3 Services**:
  - JSONPlaceholder API (live public API)
  - ReqRes API (live public API)
  - Petstore API (example)

- **2 API Specs**:
  - JSONPlaceholder OpenAPI spec
  - ReqRes OpenAPI spec

- **2 Contract Suites**:
  - JSONPlaceholder tests (3 endpoints)
  - ReqRes tests (1 endpoint)

- **3 Sample Test Runs**:
  - Historical run data with PASSED status

### Demo Credentials

No authentication required! All endpoints are public.

### Demo URLs

- **Services List**: http://localhost:3000/services
- **API Documentation**: http://localhost:3001/api

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js)              │
│  /services  /specs/[id]  /contracts/[id]  /runs  │
└───────────────────┬─────────────────────────────┘
                    │ HTTP/REST
┌───────────────────▼─────────────────────────────┐
│              Backend (NestJS)                    │
│  ┌─────────────────────────────────────────┐   │
│  │  Controllers (REST API)                  │   │
│  ├─────────────────────────────────────────┤   │
│  │  Services (Business Logic)               │   │
│  │  - ServicesService                       │   │
│  │  - ApiSpecsService + OpenApiParser       │   │
│  │  - ContractSuitesService + TestGenerator │   │
│  │  - ContractRunsService + TestRunner      │   │
│  ├─────────────────────────────────────────┤   │
│  │  Prisma ORM                              │   │
│  └─────────────┬───────────────────────────┘   │
└────────────────┼───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│           PostgreSQL Database                   │
│  tables: services, api_specs,                   │
│          contract_suites, contract_runs         │
└─────────────────────────────────────────────────┘
```

## Future Extensions

- [ ] **Authentication**: Add auth for private APIs
- [ ] **Advanced Test Generation**: POST/PUT/DELETE endpoint testing
- [ ] **Scheduled Runs**: Cron-based automatic test execution
- [ ] **Notifications**: Slack/Email alerts on test failures
- [ ] **Test Parameterization**: Custom test data injection
- [ ] **Response Validation**: JSON schema validation against OpenAPI
- [ ] **Performance Metrics**: Track response times over time
- [ ] **Multi-Environment**: Test against dev/staging/prod
- [ ] **Custom Assertions**: User-defined test rules
- [ ] **CI/CD Integration**: GitHub Actions / Jenkins plugins
- [ ] **Diff Detection**: Compare spec versions and highlight changes
- [ ] **Mock Server**: Generate mock servers from OpenAPI specs

## License

This project is licensed under the MIT License.

---

**Built with ❤️ for reliable API contract testing**
