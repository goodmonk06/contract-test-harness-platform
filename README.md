# Contract Test Harness Platform

A comprehensive platform for managing HTTP contract tests across multiple services using OpenAPI specifications as the source of truth.

## Features

- **Service Management**: Register and manage multiple services with their base URLs
- **OpenAPI Spec Upload**: Upload and parse OpenAPI 3.0 specifications (JSON or YAML)
- **Auto-Generated Tests**: Automatically generate contract tests from OpenAPI specs
- **Test Execution**: Run contract tests and capture detailed results
- **Dashboard UI**: Beautiful Next.js dashboard for managing everything
- **Test History**: Track test runs over time with detailed summaries

## Tech Stack

- **Backend**: NestJS + TypeScript
- **Database**: Prisma + PostgreSQL
- **Test Runner**: Jest
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS

## Architecture

The platform consists of four main entities:

1. **Service**: Represents an API service (e.g., User API, Payment API)
2. **ApiSpec**: OpenAPI specification for a service
3. **ContractSuite**: A collection of generated tests for a service
4. **ContractRun**: A single execution of a contract suite with results

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd contract-test-harness-platform
```

2. Set up the backend:
```bash
cd backend

# Install dependencies
npm install

# Configure database
cp .env.example .env
# Edit .env and set your DATABASE_URL

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

3. Set up the frontend:
```bash
cd ../frontend

# Install dependencies
npm install

# Configure API URL
cp .env.local.example .env.local
# Edit .env.local if needed (defaults to http://localhost:3001)
```

### Running the Application

1. Start the backend (from `backend/` directory):
```bash
npm run start:dev
```

The backend will run on http://localhost:3001
API documentation available at http://localhost:3001/api

2. Start the frontend (from `frontend/` directory):
```bash
npm run dev
```

The frontend will run on http://localhost:3000

### Database Management

```bash
# Run Prisma Studio to view/edit data
cd backend
npx prisma studio

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Usage Guide

### 1. Create a Service

1. Navigate to http://localhost:3000/services
2. Click "Add Service"
3. Fill in the form:
   - **Name**: e.g., "User API"
   - **Base URL**: e.g., "https://api.example.com"
   - **Description**: Optional description

### 2. Upload an OpenAPI Spec

1. Click on your service
2. Go to the "API Specs" tab
3. Click "Upload API Spec"
4. Fill in:
   - **Version**: e.g., "1.0.0"
   - **Format**: JSON or YAML
   - **Spec**: Paste your OpenAPI specification
5. Click "Upload Spec"

The platform will validate the spec and parse all endpoints.

### 3. Generate a Contract Suite

1. Click on your uploaded spec
2. Review the parsed endpoints
3. Click "Generate Contract Suite"

The platform will:
- Analyze all GET endpoints without required parameters
- Generate a test file in `backend/generated-contract-tests/`
- Create a ContractSuite record in the database

### 4. Run Tests

1. Navigate to your contract suite
2. Click "Run Tests"
3. View the results in real-time

Test results include:
- Total/Passed/Failed counts
- Duration
- Individual test results
- Detailed error messages if any

## How Contract Tests Work

### Test Generation Rules

The platform automatically generates tests for:
- **GET endpoints** without required parameters

For each eligible endpoint, the test will:
1. Send a GET request to the endpoint
2. Assert that the response status is **not 5xx** (server error)
3. Accept any 2xx, 3xx, or 4xx response as valid

### Example Generated Test

For an OpenAPI spec with a `/users` endpoint:

```javascript
test('GET /users', async () => {
  const response = await axios.get(`${baseURL}/users`, {
    validateStatus: (status) => status < 500,
  });

  expect(response.status).toBeLessThan(500);
  expect(response.status).toBeGreaterThanOrEqual(200);
});
```

## Using with Another Repository (e.g., api-mocking-sandbox)

### Scenario: Testing an External API

Let's say you have another repository called `api-mocking-sandbox` that implements various APIs.

#### Step 1: Ensure the API is Running

```bash
cd /path/to/api-mocking-sandbox
npm install
npm start  # Runs on http://localhost:8080
```

#### Step 2: Register the Service

1. Go to http://localhost:3000/services
2. Add a new service:
   - Name: "Mock Sandbox API"
   - Base URL: "http://localhost:8080"
   - Description: "Mock API for testing"

#### Step 3: Get the OpenAPI Spec

If your API has an OpenAPI spec at `/api-docs.json`:

```bash
curl http://localhost:8080/api-docs.json > openapi.json
```

Or create one manually following the OpenAPI 3.0 specification.

#### Step 4: Upload the Spec

1. Navigate to your service
2. Upload the OpenAPI spec (JSON or YAML)
3. Review the parsed endpoints

#### Step 5: Generate and Run Tests

1. Click "Generate Contract Suite"
2. The platform creates tests for all eligible endpoints
3. Click "Run Tests" to validate your API

#### Step 6: View Results

- Green (PASSED): All endpoints returned non-5xx responses
- Red (FAILED): One or more endpoints returned 5xx errors
- View detailed results to see which endpoints failed

### Example OpenAPI Spec

Here's a minimal example for `api-mocking-sandbox`:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Mock Sandbox API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "http://localhost:8080"
    }
  ],
  "paths": {
    "/users": {
      "get": {
        "summary": "Get all users",
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    },
    "/users/{id}": {
      "get": {
        "summary": "Get user by ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    },
    "/health": {
      "get": {
        "summary": "Health check",
        "responses": {
          "200": {
            "description": "Healthy"
          }
        }
      }
    }
  }
}
```

In this example:
- `/users` and `/health` will be tested (GET, no required params)
- `/users/{id}` will be skipped (has required path parameter)

## API Endpoints

### Services
- `GET /services` - List all services
- `GET /services/:id` - Get service details
- `POST /services` - Create a service
- `PATCH /services/:id` - Update a service
- `DELETE /services/:id` - Delete a service

### API Specs
- `GET /api-specs` - List all specs
- `GET /api-specs/:id` - Get spec details
- `GET /api-specs/:id/parsed` - Get parsed spec
- `POST /api-specs` - Upload a spec
- `DELETE /api-specs/:id` - Delete a spec

### Contract Suites
- `GET /contract-suites` - List all suites
- `GET /contract-suites/:id` - Get suite details
- `POST /contract-suites` - Create a suite
- `POST /contract-suites/generate` - Generate suite from spec
- `PATCH /contract-suites/:id` - Update a suite
- `DELETE /contract-suites/:id` - Delete a suite

### Contract Runs
- `GET /contract-runs` - List all runs
- `GET /contract-runs/:id` - Get run details
- `POST /contract-runs/execute` - Execute a test run
- `DELETE /contract-runs/:id` - Delete a run

## Project Structure

```
contract-test-harness-platform/
├── backend/                    # NestJS backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── api-specs/         # API spec management
│   │   ├── contract-runs/     # Test execution
│   │   ├── contract-suites/   # Suite management
│   │   ├── prisma/            # Prisma service
│   │   ├── services/          # Service management
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── generated-contract-tests/  # Generated test files
├── frontend/                   # Next.js frontend
│   └── src/
│       ├── app/               # App router pages
│       │   ├── services/      # Services pages
│       │   ├── specs/         # Spec detail pages
│       │   ├── contracts/     # Contract suite pages
│       │   └── runs/          # Test run pages
│       └── lib/
│           └── api.ts         # API client
└── README.md
```

## Development

### Adding New Features

1. **Backend**: Add new modules in `backend/src/`
2. **Database**: Update `backend/prisma/schema.prisma` and run migrations
3. **Frontend**: Add new pages in `frontend/src/app/`
4. **API Client**: Update `frontend/src/lib/api.ts`

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `backend/.env`
- Run `npx prisma migrate dev` to ensure schema is up to date

### Test Execution Fails

- Ensure the target service is running and accessible
- Check the service's base URL is correct
- Verify the OpenAPI spec matches the actual API
- Check generated test file in `backend/generated-contract-tests/`

### Frontend Can't Connect to Backend

- Ensure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Verify CORS is enabled in backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this platform for your projects!

## Support

For issues, questions, or contributions, please open an issue on GitHub.
