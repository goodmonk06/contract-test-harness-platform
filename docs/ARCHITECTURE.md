# Architecture Documentation

## System Overview

The Contract Test Harness Platform is built as a modular, extensible system for managing and executing API contract tests.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Services   │  │  API Specs   │  │   Contracts  │          │
│  │     UI       │  │      UI      │  │     UI       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────────┐
│                      Backend (NestJS)                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Controllers                             ││
│  │   /services  /api-specs  /contract-suites  /contract-runs  ││
│  └────────────────────────┬────────────────────────────────────┘│
│  ┌────────────────────────▼────────────────────────────────────┐│
│  │                    Business Logic                           ││
│  │  ┌───────────┐  ┌────────────┐  ┌──────────────┐          ││
│  │  │ Services  │  │ Generators │  │   Runners    │          ││
│  │  │  Service  │  │  OpenAPI   │  │  TestRunner  │          ││
│  │  │  ApiSpec  │  │  Parser    │  │  Scheduler   │          ││
│  │  │  Suite    │  │TestGenerat.│  │              │          ││
│  │  └───────────┘  └────────────┘  └──────────────┘          ││
│  └────────────────────────┬────────────────────────────────────┘│
│  ┌────────────────────────▼────────────────────────────────────┐│
│  │                     Cross-Cutting                           ││
│  │  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐ ││
│  │  │  Logging  │  │  Metrics  │  │  Events  │  │ Filters │ ││
│  │  └───────────┘  └───────────┘  └──────────┘  └─────────┘ ││
│  └────────────────────────┬────────────────────────────────────┘│
│  ┌────────────────────────▼────────────────────────────────────┐│
│  │                    Adapters Layer                           ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       ││
│  │  │Notification  │ │   Metrics    │ │   Storage    │       ││
│  │  │  Adapters    │ │   Adapters   │ │   Adapters   │       ││
│  │  └──────────────┘ └──────────────┘ └──────────────┘       ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌────────────────────────┬────────────────────────────────────┐│
│  │                   Prisma ORM                                ││
│  └────────────────────────┬────────────────────────────────────┘│
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                   PostgreSQL Database                            │
│  ┌─────────────┬──────────────┬───────────────┬──────────────┐ │
│  │  services   │  api_specs   │ contract_    │ contract_    │ │
│  │             │              │  suites       │  runs        │ │
│  ├─────────────┼──────────────┼───────────────┼──────────────┤ │
│  │test_        │test_         │custom_        │spec_diffs    │ │
│  │environments │templates     │assertions     │              │ │
│  └─────────────┴──────────────┴───────────────┴──────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Presentation Layer (Frontend)

**Technology**: Next.js 14 with App Router

**Responsibilities**:
- User interface for all CRUD operations
- Real-time status updates via SWR
- Form validation and error display
- Navigation and routing

**Key Pages**:
- `/services` - Service list and creation
- `/services/[id]` - Service details with specs and suites
- `/specs/[id]` - API spec details and parsing visualization
- `/contracts/[id]` - Contract suite details and test runs
- `/runs/[id]` - Test run results and metrics

### 2. API Layer (Controllers)

**Technology**: NestJS Controllers

**Responsibilities**:
- HTTP request handling
- Input validation (via DTOs + class-validator)
- Response formatting
- Error handling (via exception filters)
- Swagger documentation

**Endpoints**:
- `GET/POST/PATCH/DELETE /services`
- `GET/POST/DELETE /api-specs`
- `GET/POST/PATCH/DELETE /contract-suites`
- `POST /contract-suites/generate`
- `GET/POST/DELETE /contract-runs`
- `POST /contract-runs/execute`

### 3. Business Logic Layer (Services)

**Technology**: NestJS Services (Injectable)

**Key Services**:

**ServicesService**: Manages API services
- CRUD operations for services
- Soft delete support
- Tag management

**ApiSpecsService**: Handles OpenAPI specifications
- Upload and validation
- Parsing via OpenApiParserService
- Version comparison (SpecDiff generation)

**ContractSuitesService**: Manages test suites
- Manual suite creation
- Auto-generation via TestGeneratorService
- Schedule management

**ContractRunsService**: Executes tests
- Test execution via TestRunnerService
- Result capture and storage
- Historical tracking

**TestGeneratorService**: Generates test code
- Parses OpenAPI specs
- Identifies testable endpoints
- Creates Jest test files

**TestRunnerService**: Runs tests
- Executes Jest tests
- Captures output and results
- Saves logs and artifacts

### 4. Cross-Cutting Concerns

**Logging**: Structured logging with context
```typescript
const logger = createLogger('ServiceName');
logger.info('Operation completed', { userId, actionId });
```

**Metrics**: Performance and business metrics
```typescript
metrics.counter('test_runs_total', 1, { status: 'passed' });
const stopTimer = metrics.startTimer('test_execution');
// ... do work
stopTimer(); // Automatically records duration
```

**Events**: Domain event system
```typescript
emitTestRunCompleted(runId, suiteId, 'PASSED', 5000, 10, 10, 0);
// Triggers registered event handlers
```

**Error Handling**: Centralized exception filter
- Consistent error responses
- Logging of errors
- HTTP status code mapping

### 5. Adapter Layer (Extensibility)

**Purpose**: Decouple core logic from external integrations

**Adapter Types**:

**INotificationAdapter**: Send notifications
- Console (default)
- Webhook
- Slack (stub)
- Email (future)

**IMetricsAdapter**: Publish metrics
- InMemory (default)
- Logging
- Prometheus (stub)
- DataDog (future)

**IStorageAdapter**: Store artifacts
- Local filesystem (default)
- S3 (stub)
- GCS (future)

**Usage**:
```typescript
// In main.ts or module configuration
const notifier = new SlackNotificationAdapter(webhookUrl);
// Register for use in services
```

### 6. Data Layer (Prisma ORM)

**Responsibilities**:
- Database schema management
- Type-safe queries
- Migrations
- Seed data

**Key Models**:
- `Service` - API services being tested
- `ApiSpec` - OpenAPI specifications
- `ContractSuite` - Test suite definitions
- `ContractRun` - Test execution records
- `TestEnvironment` - Deployment environments
- `TestTemplate` - Reusable test templates
- `CustomAssertion` - User-defined assertions
- `SpecDiff` - Spec version comparisons
- `Tag` - Categorization

## Data Flow Examples

### Example 1: Generate and Run Tests

1. **User uploads OpenAPI spec**
   - Frontend sends POST to `/api-specs`
   - Controller validates DTO
   - ApiSpecsService validates OpenAPI format
   - Spec saved to database
   - Event emitted: `apiSpec.uploaded`

2. **User generates contract suite**
   - Frontend sends POST to `/contract-suites/generate`
   - Controller validates input
   - ContractSuitesService calls TestGeneratorService
   - OpenApiParserService parses spec
   - TestGeneratorService creates Jest file
   - Suite record created in database
   - Event emitted: `contractSuite.generated`

3. **User runs tests**
   - Frontend sends POST to `/contract-runs/execute`
   - ContractRunsService creates run record (status: RUNNING)
   - Event emitted: `testRun.started`
   - TestRunnerService executes Jest asynchronously
   - Results captured and stored
   - Run record updated (status: PASSED/FAILED)
   - Metrics recorded
   - Event emitted: `testRun.completed`
   - If failed, event emitted: `contract.broken`

4. **User views results**
   - Frontend polls or refreshes
   - GET `/contract-runs/:id`
   - Results displayed with pass/fail details

## Extension Points

### 1. Custom Test Generators

Implement alternative test generation strategies:

```typescript
interface ITestGenerator {
  generate(spec: ParsedOpenApiSpec, config: any): Promise<string>;
}

// Register custom generator
testGeneratorRegistry.register('custom-strategy', new CustomGenerator());
```

### 2. Event Handlers

React to domain events:

```typescript
eventBus.on('testRun.completed', async (event) => {
  if (event.payload.status === 'FAILED') {
    await notifier.send({
      title: 'Test Run Failed',
      message: `Suite ${event.payload.suiteId} failed`,
      severity: 'error',
    });
  }
});
```

### 3. Custom Adapters

Plug in external services:

```typescript
class CustomMetricsAdapter implements IMetricsAdapter {
  // Implement interface methods
}

metrics.setAdapter(new CustomMetricsAdapter());
```

## Design Patterns

### Repository Pattern
- Prisma acts as repository
- Services encapsulate business logic
- Clear separation of concerns

### Adapter Pattern
- External integrations via adapters
- Easy to swap implementations
- Test with stub adapters

### Observer Pattern
- Event bus for loose coupling
- Multiple handlers per event
- Async event processing

### Strategy Pattern
- Different test generation strategies
- Pluggable via registry
- Configuration-driven selection

## Security Considerations

1. **Input Validation**: All inputs validated via class-validator
2. **SQL Injection**: Prevented by Prisma's query builder
3. **XSS**: Next.js escapes output by default
4. **CORS**: Configured to allow frontend origin only
5. **Rate Limiting**: Future enhancement
6. **Authentication**: Future enhancement (current focus is internal tools)

## Performance Considerations

1. **Async Processing**: Test runs execute asynchronously
2. **Caching**: Parsed OpenAPI specs can be cached
3. **Indexes**: Database indexes on frequently queried fields
4. **Connection Pooling**: Prisma handles connection pooling
5. **Pagination**: Future enhancement for large datasets

## Scalability

**Current State**: Single-instance application suitable for teams

**Future Enhancements**:
- Horizontal scaling with load balancer
- Job queue for test execution (Bull/BullMQ)
- Redis for caching and session management
- Separate test runner workers
- Metrics aggregation service

## Technology Choices Rationale

**NestJS**: Enterprise-grade framework with good TypeScript support and modularity

**Prisma**: Modern ORM with excellent TypeScript integration and migration system

**PostgreSQL**: Reliable, feature-rich relational database

**Next.js**: React framework with good DX and performance

**Jest**: Widely adopted test runner with good ecosystem

**Docker**: Standard containerization for consistent deployments
