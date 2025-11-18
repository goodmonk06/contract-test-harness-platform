# Quick Start Guide

Get up and running with the Contract Testing Platform in 5 minutes!

## Prerequisites

- Node.js 18+
- PostgreSQL running on localhost:5432
- Basic understanding of OpenAPI/Swagger

## Step 1: Setup (2 minutes)

```bash
# Clone and navigate to the project
cd contract-test-harness-platform

# Setup backend
cd backend
npm install
cp .env.example .env

# Edit .env if your PostgreSQL credentials differ
# Default: postgresql://postgres:postgres@localhost:5432/contract_testing

# Run migrations
npx prisma migrate dev
npx prisma generate

# Setup frontend (in a new terminal)
cd ../frontend
npm install
```

## Step 2: Start the Application (1 minute)

Terminal 1 - Backend:
```bash
cd backend
npm run start:dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Visit http://localhost:3000

## Step 3: Create Your First Service (30 seconds)

1. Click "View Services"
2. Click "Add Service"
3. Fill in:
   - Name: "JSONPlaceholder API"
   - Base URL: "https://jsonplaceholder.typicode.com"
   - Description: "Free fake API for testing"
4. Click "Create Service"

## Step 4: Upload OpenAPI Spec (1 minute)

1. Click on your newly created service
2. Click "Upload API Spec"
3. Copy the contents from `examples/sample-openapi.json`
4. Fill in:
   - Version: "1.0.0"
   - Format: "OpenAPI JSON"
   - Paste the spec content
5. Click "Upload Spec"

## Step 5: Generate & Run Tests (30 seconds)

1. Click on your uploaded spec
2. Click "Generate Contract Suite"
3. On the contract suite page, click "Run Tests"
4. Watch the results come in!

## What Just Happened?

The platform:
1. ✅ Parsed your OpenAPI spec
2. ✅ Identified 3 testable GET endpoints (`/users`, `/posts`, `/comments`)
3. ✅ Generated a Jest test file
4. ✅ Ran the tests against the live API
5. ✅ Captured and displayed the results

## Next Steps

### Try with Your Own API

1. Create a service with your API's base URL
2. Upload your OpenAPI spec (or create one)
3. Generate tests
4. Run and monitor results

### Understand the Test Strategy

The platform tests GET endpoints without required parameters to ensure they:
- Return non-5xx status codes (no server errors)
- Are accessible and responding

This validates basic contract compliance without needing:
- Authentication tokens
- Test data
- Complex setup

### Integrate into CI/CD

Use the API endpoints to:
```bash
# Create a service
curl -X POST http://localhost:3001/services \
  -H "Content-Type: application/json" \
  -d '{"name":"My API","baseUrl":"https://api.example.com"}'

# Upload spec (get spec_id from response)
curl -X POST http://localhost:3001/api-specs \
  -H "Content-Type: application/json" \
  -d @spec.json

# Generate suite (get suite_id from response)
curl -X POST http://localhost:3001/contract-suites/generate \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"...","apiSpecId":"..."}'

# Run tests
curl -X POST http://localhost:3001/contract-runs/execute \
  -H "Content-Type: application/json" \
  -d '{"suiteId":"..."}'

# Check results
curl http://localhost:3001/contract-runs/{run_id}
```

## Using Docker (Alternative)

```bash
# Start everything with Docker
docker-compose up -d

# Wait for services to be ready
# Backend: http://localhost:3001
# Frontend: http://localhost:3000
# Database: localhost:5432

# View logs
docker-compose logs -f
```

## Troubleshooting

**Database connection error?**
- Ensure PostgreSQL is running
- Check credentials in `backend/.env`

**Tests failing?**
- Verify the service base URL is accessible
- Check that the API matches the OpenAPI spec
- Review generated tests in `backend/generated-contract-tests/`

**Frontend can't reach backend?**
- Ensure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

## Support

See the full [README.md](./README.md) for detailed documentation.

Happy testing!
