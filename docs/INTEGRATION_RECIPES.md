# Integration Recipes

This document provides practical examples of how to integrate the Contract Test Harness Platform with other systems and tools in your ecosystem.

## Table of Contents

1. [CI/CD Integration](#cicd-integration)
2. [Slack Notifications](#slack-notifications)
3. [Prometheus Metrics](#prometheus-metrics)
4. [Webhook Integration](#webhook-integration)
5. [Authentication Services](#authentication-services)
6. [Multi-Environment Testing](#multi-environment-testing)
7. [Database Backup Integration](#database-backup-integration)

---

## CI/CD Integration

### GitHub Actions

Validate API contracts on every pull request:

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run contract tests
        run: |
          # Create service if doesn't exist
          SERVICE_ID=$(curl -s -X POST ${{ secrets.CONTRACT_PLATFORM_URL }}/services \
            -H "Content-Type: application/json" \
            -d '{
              "name": "My API",
              "baseUrl": "${{ secrets.API_BASE_URL }}",
              "description": "Main application API"
            }' | jq -r '.id')

          # Upload OpenAPI spec
          SPEC_ID=$(curl -s -X POST ${{ secrets.CONTRACT_PLATFORM_URL }}/api-specs \
            -H "Content-Type: application/json" \
            -d @openapi.json | jq -r '.id')

          # Generate contract suite
          SUITE_ID=$(curl -s -X POST ${{ secrets.CONTRACT_PLATFORM_URL }}/contract-suites/generate \
            -H "Content-Type: application/json" \
            -d "{
              \"serviceId\": \"$SERVICE_ID\",
              \"apiSpecId\": \"$SPEC_ID\"
            }" | jq -r '.id')

          # Execute tests
          RUN_ID=$(curl -s -X POST ${{ secrets.CONTRACT_PLATFORM_URL }}/contract-runs/execute \
            -H "Content-Type: application/json" \
            -d "{\"suiteId\": \"$SUITE_ID\"}" | jq -r '.id')

          # Wait for completion and check results
          for i in {1..60}; do
            STATUS=$(curl -s ${{ secrets.CONTRACT_PLATFORM_URL }}/contract-runs/$RUN_ID | jq -r '.status')
            if [ "$STATUS" = "PASSED" ]; then
              echo "✅ Contract tests passed!"
              exit 0
            elif [ "$STATUS" = "FAILED" ]; then
              echo "❌ Contract tests failed!"
              curl -s ${{ secrets.CONTRACT_PLATFORM_URL }}/contract-runs/$RUN_ID | jq '.summaryJson'
              exit 1
            elif [ "$STATUS" != "RUNNING" ]; then
              echo "⚠️  Unexpected status: $STATUS"
              exit 1
            fi
            echo "⏳ Waiting for tests to complete... ($i/60)"
            sleep 5
          done

          echo "⏱️  Tests timed out!"
          exit 1
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    environment {
        CONTRACT_PLATFORM_URL = credentials('contract-platform-url')
        API_BASE_URL = credentials('api-base-url')
    }

    stages {
        stage('Run Contract Tests') {
            steps {
                script {
                    def response = sh(
                        script: """
                            curl -X POST ${CONTRACT_PLATFORM_URL}/contract-runs/execute \\
                                -H 'Content-Type: application/json' \\
                                -d '{"suiteId": "${params.SUITE_ID}"}'
                        """,
                        returnStdout: true
                    ).trim()

                    def runId = new groovy.json.JsonSlurper().parseText(response).id

                    // Poll for results
                    timeout(time: 10, unit: 'MINUTES') {
                        waitUntil {
                            def status = sh(
                                script: "curl -s ${CONTRACT_PLATFORM_URL}/contract-runs/${runId} | jq -r '.status'",
                                returnStdout: true
                            ).trim()

                            return status == 'PASSED' || status == 'FAILED'
                        }
                    }

                    def finalStatus = sh(
                        script: "curl -s ${CONTRACT_PLATFORM_URL}/contract-runs/${runId} | jq -r '.status'",
                        returnStdout: true
                    ).trim()

                    if (finalStatus != 'PASSED') {
                        error("Contract tests failed!")
                    }
                }
            }
        }
    }
}
```

---

## Slack Notifications

### Setup Slack Adapter

```typescript
// backend/src/main.ts or config file
import { SlackNotificationAdapter } from './lib/adapters';
import { eventBus } from './lib/events/domain-events';

async function bootstrap() {
  // ... existing setup

  // Configure Slack notifications
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    const slackAdapter = new SlackNotificationAdapter(slackWebhook);

    // Notify on test failures
    eventBus.on('testRun.completed', async (event) => {
      if (event.payload.status === 'FAILED') {
        await slackAdapter.send({
          title: '❌ Contract Tests Failed',
          message: `Suite failed with ${event.payload.failedTests} failed tests`,
          severity: 'error',
          metadata: {
            suiteId: event.payload.suiteId,
            runId: event.payload.runId,
            duration: `${event.payload.duration}ms`,
          },
        });
      }
    });

    // Notify on contract breakage
    eventBus.on('contract.broken', async (event) => {
      await slackAdapter.send({
        title: '⚠️  Contract Broken',
        message: `Service contract has been broken!`,
        severity: 'warning',
        metadata: {
          serviceId: event.payload.serviceId,
          failedEndpoints: event.payload.failedTests.length,
        },
      });
    });
  }
}
```

---

## Prometheus Metrics

### Export Metrics Endpoint

```typescript
// backend/src/metrics/metrics.controller.ts
import { Controller, Get, Header } from '@nestjs/common';
import { metrics } from '../lib/metrics';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain')
  getMetrics(): string {
    // If using Prometheus adapter, return formatted metrics
    // Otherwise, return simple text format
    const inMemoryAdapter = metrics['adapter'] as any;

    if (inMemoryAdapter.getAll) {
      const allMetrics = inMemoryAdapter.getAll();
      return allMetrics
        .map(m => `${m.name} ${m.value} ${m.timestamp.getTime()}`)
        .join('\n');
    }

    return '# Metrics endpoint\n';
  }
}
```

### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'contract-test-platform'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

---

## Webhook Integration

### Receiving Webhooks

```typescript
// backend/src/webhooks/webhooks.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ContractRunsService } from '../contract-runs/contract-runs.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private contractRuns: ContractRunsService) {}

  @Post('github')
  async handleGitHubWebhook(@Body() payload: any) {
    // Triggered on push to main branch
    if (payload.ref === 'refs/heads/main') {
      // Find relevant suite and run tests
      const suite = await this.findSuiteForRepository(payload.repository.name);
      if (suite) {
        await this.contractRuns.executeRun(suite.id);
      }
    }
  }

  @Post('deploy')
  async handleDeploymentWebhook(@Body() payload: any) {
    // Triggered after deployment
    // Run tests against the newly deployed environment
    const environment = payload.environment; // 'staging', 'production'
    const suites = await this.findSuitesForEnvironment(environment);

    for (const suite of suites) {
      await this.contractRuns.executeRun(suite.id);
    }
  }
}
```

---

## Authentication Services

### OAuth Integration

```typescript
// backend/src/lib/adapters/auth.adapter.ts
export interface IAuthAdapter {
  getToken(): Promise<string>;
  refreshToken(): Promise<string>;
}

export class OAuthAdapter implements IAuthAdapter {
  constructor(
    private clientId: string,
    private clientSecret: string,
    private tokenUrl: string,
  ) {}

  async getToken(): Promise<string> {
    const axios = require('axios');
    const response = await axios.post(this.tokenUrl, {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    return response.data.access_token;
  }

  async refreshToken(): Promise<string> {
    return this.getToken(); // Re-auth for client_credentials
  }
}

// Usage in test generator
export class AuthenticatedTestGenerator extends TestGeneratorService {
  constructor(private authAdapter: IAuthAdapter) {
    super();
  }

  protected override generateTestCode(service: any, endpoints: any[]): string {
    return `
const axios = require('axios');
const authAdapter = /* injected */;

describe('${service.name} - Authenticated Tests', () => {
  let token;

  beforeAll(async () => {
    token = await authAdapter.getToken();
  });

  ${endpoints.map(e => this.generateAuthenticatedTest(e, service.baseUrl)).join('\n')}
});
    `;
  }

  private generateAuthenticatedTest(endpoint: any, baseUrl: string): string {
    return `
  test('${endpoint.method} ${endpoint.path}', async () => {
    const response = await axios({
      method: '${endpoint.method.toLowerCase()}',
      url: \`${baseUrl}${endpoint.path}\`,
      headers: {
        'Authorization': \`Bearer \${token}\`
      },
      validateStatus: () => true
    });

    expect(response.status).toBeLessThan(500);
  });
    `;
  }
}
```

---

## Multi-Environment Testing

### Environment Configuration

```typescript
// Create environments via API
const environments = [
  {
    serviceId: 'service-123',
    name: 'development',
    baseUrl: 'https://dev-api.example.com',
    config: JSON.stringify({ timeout: 5000 }),
  },
  {
    serviceId: 'service-123',
    name: 'staging',
    baseUrl: 'https://staging-api.example.com',
    config: JSON.stringify({ timeout: 10000 }),
  },
  {
    serviceId: 'service-123',
    name: 'production',
    baseUrl: 'https://api.example.com',
    config: JSON.stringify({ timeout: 30000 }),
  },
];

for (const env of environments) {
  await axios.post(`${CONTRACT_PLATFORM_URL}/environments`, env);
}

// Run tests against specific environment
await axios.post(`${CONTRACT_PLATFORM_URL}/contract-runs/execute`, {
  suiteId: 'suite-123',
  environmentId: 'env-prod-123',
});
```

### Automated Multi-Env Testing

```bash
#!/bin/bash
# scripts/test-all-environments.sh

SUITE_ID=$1
ENVIRONMENTS=("development" "staging" "production")

for ENV in "${ENVIRONMENTS[@]}"; do
  echo "🧪 Running tests in $ENV..."

  ENV_ID=$(curl -s "${CONTRACT_PLATFORM_URL}/environments?name=$ENV" | jq -r '.[0].id')

  RUN_ID=$(curl -s -X POST "${CONTRACT_PLATFORM_URL}/contract-runs/execute" \
    -H "Content-Type: application/json" \
    -d "{\"suiteId\": \"$SUITE_ID\", \"environmentId\": \"$ENV_ID\"}" \
    | jq -r '.id')

  # Wait and check result
  sleep 10
  STATUS=$(curl -s "${CONTRACT_PLATFORM_URL}/contract-runs/$RUN_ID" | jq -r '.status')

  if [ "$STATUS" = "PASSED" ]; then
    echo "✅ $ENV: PASSED"
  else
    echo "❌ $ENV: FAILED"
    exit 1
  fi
done

echo "🎉 All environments passed!"
```

---

## Database Backup Integration

### Backup Before Tests

```typescript
// backend/src/scheduled-tasks/backup-and-test.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupAndTestService {
  @Cron('0 2 * * *') // Run at 2 AM daily
  async backupAndRunTests() {
    // Backup database
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFile = `backup-${timestamp}.sql`;

    await execAsync(
      `pg_dump ${process.env.DATABASE_URL} > ./backups/${backupFile}`
    );

    console.log(`✅ Database backed up to ${backupFile}`);

    // Run all enabled suites
    const suites = await this.prisma.contractSuite.findMany({
      where: { enabled: true },
    });

    for (const suite of suites) {
      await this.contractRunsService.executeRun(suite.id);
    }
  }
}
```

---

## Best Practices

1. **Use Environment Variables**: Never hardcode credentials or URLs
2. **Implement Retry Logic**: Network calls can fail; implement exponential backoff
3. **Log Integration Events**: Always log when integrations trigger actions
4. **Monitor Integration Health**: Track success/failure rates of integrations
5. **Version Your APIs**: When integrating with the platform API, specify version headers
6. **Handle Timeouts**: Set reasonable timeouts for all HTTP calls
7. **Validate Webhooks**: Verify webhook signatures when receiving them
8. **Use Idempotency**: Make integration actions idempotent when possible

## Troubleshooting

### Integration Not Working

1. Check network connectivity
2. Verify credentials/tokens are valid
3. Check logs for detailed error messages
4. Test adapter connection using `test()` method
5. Verify API endpoints are accessible

### Performance Issues

1. Use async/non-blocking operations
2. Implement caching where appropriate
3. Use connection pooling
4. Monitor and optimize database queries
5. Consider rate limiting for external APIs

## Further Reading

- [Architecture Documentation](./ARCHITECTURE.md)
- [Extension Guide](./EXTENSION_GUIDE.md)
- [API Reference](../README.md#api-endpoints)
