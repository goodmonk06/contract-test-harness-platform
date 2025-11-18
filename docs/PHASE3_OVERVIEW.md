# Phase 3 Overview

## Purpose Statement

The Contract Test Harness Platform solves the problem of **manual API contract validation** in distributed systems. Instead of writing tests manually or relying on documentation to stay in sync with actual APIs, this platform:

1. **Automatically generates** contract tests from OpenAPI specifications
2. **Executes** those tests against live services
3. **Tracks** results over time to detect contract drift
4. **Visualizes** test outcomes through a modern dashboard

This makes it easy for teams to ensure their APIs maintain backward compatibility and adhere to documented contracts, especially in microservices architectures where multiple services need to interoperate reliably.

## Existing Features

### Phase 1 & 2 Completed

✅ **Core Domain Model**
- Service, ApiSpec, ContractSuite, ContractRun entities
- Full CRUD for all entities via REST API
- PostgreSQL persistence with Prisma ORM

✅ **OpenAPI Processing**
- Upload and parse OpenAPI 3.0 specs (JSON/YAML)
- Validate specs using swagger-parser
- Extract and classify endpoints

✅ **Test Generation**
- Auto-generate Jest tests for GET endpoints without required params
- Save generated tests to filesystem
- Configurable test generation strategy

✅ **Test Execution**
- Execute generated tests via Jest
- Capture results (pass/fail, duration, error messages)
- Store results in database with full history

✅ **Frontend Dashboard**
- Services list and detail pages
- API spec upload and viewing
- Contract suite management
- Test run execution and results visualization

✅ **Developer Experience**
- Standardized npm scripts (dev, build, test, lint, db:*)
- Docker Compose setup for local development
- Comprehensive error handling
- Seed data for quick demos
- Unit and E2E tests

## Current Limitations

1. **Limited test coverage**: Only GET endpoints without params are tested
2. **No authentication**: Can't test protected endpoints
3. **No scheduling**: Tests must be run manually
4. **No notifications**: No alerts when tests fail
5. **Basic metrics**: No performance tracking or trends
6. **Single environment**: Can't test against multiple environments (dev/staging/prod)
7. **No extensibility**: Hard-coded test generation logic
8. **Limited validation**: Only checks for non-5xx responses
9. **No history/analytics**: Can't see trends over time
10. **No integration hooks**: Can't integrate with CI/CD or other tools

## Phase 3 Plan

### 1. Domain Deepening (Add richness to existing entities)

**New Entities:**
- `TestEnvironment`: Represent different deployment environments
- `TestTemplate`: Custom test templates for different scenarios
- `TestAssertion`: Custom assertion rules
- `SpecDiff`: Track changes between spec versions
- `Tag`: Categorize services and suites

**Enhanced Entities:**
- Add `Service.tags`, `Service.metadata`, `Service.healthCheckUrl`
- Add `ContractSuite.schedule`, `ContractSuite.enabled`, `ContractSuite.retryConfig`
- Add `ContractRun.environmentId`, `ContractRun.performanceMetrics`, `ContractRun.artifacts`
- Add soft deletes and audit timestamps

**New Relationships:**
- Service → TestEnvironments (one-to-many)
- ContractSuite → TestTemplates (many-to-one)
- ApiSpec → SpecDiffs (one-to-many, for version comparison)

### 2. Multiple Vertical Slices

Implement complete flows for:

1. **Test Environment Management**
   - Create/list/update/delete environments
   - Switch suite to run against specific environment
   - UI pages for environment configuration

2. **Scheduled Test Runs**
   - Define cron schedules for suites
   - Background job runner
   - Manual + automatic triggers
   - UI for schedule management

3. **Test Assertion Customization**
   - Define custom assertion rules (status codes, response schemas, headers)
   - Store as reusable templates
   - Apply to generated tests
   - UI for assertion builder

### 3. Extensibility & Integration Points

**Plugin Architecture:**
- `INotificationAdapter`: Send alerts (Slack, Email, Webhook)
- `IMetricsAdapter`: Publish metrics (Prometheus, DataDog, CloudWatch)
- `IStorageAdapter`: Store test artifacts (S3, local, GCS)
- `IAuthAdapter`: Handle authentication (OAuth, API keys, JWT)

**Event System:**
- Typed domain events: `TestRunStarted`, `TestRunCompleted`, `SpecUploaded`, `ContractBroken`
- Event handlers that can be registered dynamically
- Webhook notifications for external systems

**Extension Points:**
- Custom test generators via registry pattern
- Pluggable assertion engines
- Configurable test runners (Jest, Vitest, custom)

### 4. DX Enhancement

**CLI Tool:**
- `npx contract-test init` - Initialize new service
- `npx contract-test upload <spec>` - Upload spec
- `npx contract-test run <suite-id>` - Run tests
- `npx contract-test schedule <suite-id> <cron>` - Set schedule

**Development Helpers:**
- Better error messages with suggestions
- Database migration helpers
- Test data factories
- Debug mode with verbose logging

### 5. Quality Hardening

**Validation:**
- Strict input validation on all endpoints
- Custom Zod schemas for complex types
- Validation error messages with field-level details

**Error Handling:**
- Already implemented: AllExceptionsFilter
- Add error codes for programmatic handling
- Error recovery strategies

**Logging:**
- Structured logging with context
- Log levels (debug, info, warn, error)
- Request IDs for tracing

**Metrics:**
- Record test execution times
- Track success/failure rates
- Monitor API endpoint performance
- Export to metrics adapters

### 6. Testing Expansion

**More Unit Tests:**
- ContractSuites service
- TestGenerator service
- TestRunner service
- All DTOs and validation

**Integration Tests:**
- Full flow: upload spec → generate → run → verify results
- Multi-service scenarios
- Error cases and edge conditions

**Test Fixtures:**
- Realistic OpenAPI specs
- Test data builders
- Mock adapters for external services

### 7. Documentation Deep Dive

**New Documentation:**
- `docs/DOMAIN_NOTES.md`: Deep dive into domain concepts
- `docs/ARCHITECTURE.md`: System architecture details
- `docs/INTEGRATION_RECIPES.md`: How to integrate with other systems
- `docs/API_REFERENCE.md`: Complete API documentation
- `docs/EXTENSION_GUIDE.md`: How to write plugins
- `docs/DEPLOYMENT.md`: Production deployment guide

**Improved README:**
- Add architecture diagrams
- More examples and use cases
- Troubleshooting guide
- Performance tuning tips

## Success Criteria

Phase 3 will be considered complete when:

1. ✅ At least 3 new entities added to domain model
2. ✅ At least 3 complete vertical slices implemented (beyond the basic CRUD)
3. ✅ At least 3 adapter interfaces defined with stub implementations
4. ✅ Domain event system with 5+ event types
5. ✅ CLI tool with at least 5 commands
6. ✅ 80%+ test coverage on business logic
7. ✅ All 7 docs created and comprehensive
8. ✅ Can be deployed to production with Docker
9. ✅ Can integrate with at least 2 external systems (via adapters)
10. ✅ Codebase is 3-5x larger than Phase 2, with good organization

## Timeline

Phase 3 is intended to be completed in a single intensive session, with focus on:
- **Hours 1-2**: Domain model expansion and migrations
- **Hours 3-4**: Vertical slices implementation
- **Hours 5-6**: Extension points and adapters
- **Hours 7-8**: Testing and quality improvements
- **Hours 9-10**: Documentation and polish

## Notes

- Maintain backward compatibility wherever possible
- Keep the architecture simple and understandable
- Prioritize features that make this a reusable building block
- Think about how this fits into a larger ecosystem of services
- Everything should be production-ready, not just demo quality
