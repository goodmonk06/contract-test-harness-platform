# Extension Guide

This guide explains how to extend the Contract Test Harness Platform with custom functionality.

## Table of Contents

1. [Creating Custom Adapters](#creating-custom-adapters)
2. [Writing Event Handlers](#writing-event-handlers)
3. [Custom Test Generators](#custom-test-generators)
4. [Adding Custom Assertions](#adding-custom-assertions)
5. [Creating Test Templates](#creating-test-templates)
6. [Extending the API](#extending-the-api)

---

## Creating Custom Adapters

Adapters provide integration points with external services. The platform defines three main adapter interfaces.

### Notification Adapter

Send notifications to custom channels:

```typescript
// src/custom/adapters/teams-notification.adapter.ts
import { INotificationAdapter, NotificationMessage } from '../../lib/adapters';
import axios from 'axios';

export class TeamsNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string) {}

  async send(message: NotificationMessage): Promise<void> {
    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: message.title,
      themeColor: this.getColor(message.severity),
      sections: [
        {
          activityTitle: message.title,
          activitySubtitle: new Date().toISOString(),
          facts: Object.entries(message.metadata || {}).map(([name, value]) => ({
            name,
            value: String(value),
          })),
          text: message.message,
        },
      ],
    };

    await axios.post(this.webhookUrl, payload);
  }

  async test(): Promise<boolean> {
    try {
      await this.send({
        title: 'Test Notification',
        message: 'Microsoft Teams integration is working!',
        severity: 'success',
      });
      return true;
    } catch {
      return false;
    }
  }

  private getColor(severity: string): string {
    return {
      success: '00ff00',
      info: '0078d4',
      warning: 'ffa500',
      error: 'ff0000',
    }[severity] || '0078d4';
  }
}

// Register in main.ts
import { TeamsNotificationAdapter } from './custom/adapters/teams-notification.adapter';

const teamsAdapter = new TeamsNotificationAdapter(process.env.TEAMS_WEBHOOK_URL);
// Use in event handlers or services
```

### Metrics Adapter

Export metrics to custom backends:

```typescript
// src/custom/adapters/datadog-metrics.adapter.ts
import { IMetricsAdapter } from '../../lib/adapters';

export class DataDogMetricsAdapter implements IMetricsAdapter {
  constructor(
    private apiKey: string,
    private appKey: string,
    private host: string = 'api.datadoghq.com',
  ) {}

  recordCounter(name: string, value: number, labels?: Record<string, string>): void {
    this.sendMetric('count', name, value, labels);
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.sendMetric('gauge', name, value, labels);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.sendMetric('histogram', name, value, labels);
  }

  async flush(): Promise<void> {
    // DataDog client handles buffering internally
  }

  private async sendMetric(
    type: string,
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): Promise<void> {
    const axios = require('axios');

    const series = {
      series: [
        {
          metric: name,
          type,
          points: [[Math.floor(Date.now() / 1000), value]],
          tags: labels ? Object.entries(labels).map(([k, v]) => `${k}:${v}`) : [],
        },
      ],
    };

    await axios.post(`https://${this.host}/api/v1/series`, series, {
      headers: {
        'DD-API-KEY': this.apiKey,
        'DD-APPLICATION-KEY': this.appKey,
      },
    });
  }
}

// Usage
import { metrics } from '../lib/metrics';
import { DataDogMetricsAdapter } from './custom/adapters/datadog-metrics.adapter';

const ddAdapter = new DataDogMetricsAdapter(
  process.env.DD_API_KEY,
  process.env.DD_APP_KEY,
);
metrics.setAdapter(ddAdapter);
```

### Storage Adapter

Store artifacts in custom backends:

```typescript
// src/custom/adapters/gcs-storage.adapter.ts
import { IStorageAdapter, StorageObject } from '../../lib/adapters';
import { Storage } from '@google-cloud/storage';

export class GCSStorageAdapter implements IStorageAdapter {
  private storage: Storage;

  constructor(
    private bucketName: string,
    keyFilename?: string,
  ) {
    this.storage = new Storage({ keyFilename });
  }

  async put(object: StorageObject): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(object.key);

    const content = typeof object.content === 'string'
      ? Buffer.from(object.content)
      : object.content;

    await file.save(content, {
      metadata: {
        contentType: object.contentType || 'application/octet-stream',
        metadata: object.metadata,
      },
    });

    return object.key;
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);
      const [contents] = await file.download();
      return contents;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(key);
    await file.delete();
  }

  async list(prefix?: string): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles({ prefix });
    return files.map((f) => f.name);
  }

  getUrl(key: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${key}`;
  }
}
```

---

## Writing Event Handlers

React to domain events:

```typescript
// src/custom/handlers/notification-handler.ts
import { eventBus } from '../lib/events/domain-events';
import { INotificationAdapter } from '../lib/adapters';

export function registerNotificationHandlers(notifier: INotificationAdapter) {
  // Notify on test run completion
  eventBus.on('testRun.completed', async (event) => {
    const { status, totalTests, passedTests, failedTests } = event.payload;

    await notifier.send({
      title: `Test Run ${status}`,
      message: `${passedTests}/${totalTests} tests passed`,
      severity: status === 'PASSED' ? 'success' : 'error',
      metadata: {
        runId: event.payload.runId,
        duration: `${event.payload.duration}ms`,
      },
    });
  });

  // Alert on contract breakage
  eventBus.on('contract.broken', async (event) => {
    await notifier.send({
      title: '🚨 Contract Broken',
      message: `Service contract has been broken with ${event.payload.failedTests.length} failures`,
      severity: 'error',
      metadata: {
        serviceId: event.payload.serviceId,
        runId: event.payload.runId,
      },
    });
  });

  // Track new spec uploads
  eventBus.on('apiSpec.uploaded', async (event) => {
    await notifier.send({
      title: 'New API Spec Uploaded',
      message: `Version ${event.payload.version} uploaded`,
      severity: 'info',
      metadata: {
        specId: event.payload.specId,
        serviceId: event.payload.serviceId,
      },
    });
  });
}

// Register in main.ts
import { registerNotificationHandlers } from './custom/handlers/notification-handler';

const notifier = new SlackNotificationAdapter(process.env.SLACK_WEBHOOK_URL);
registerNotificationHandlers(notifier);
```

### Metrics Event Handler

```typescript
// src/custom/handlers/metrics-handler.ts
import { eventBus } from '../lib/events/domain-events';
import { metrics, MetricNames } from '../lib/metrics';

export function registerMetricsHandlers() {
  eventBus.on('testRun.completed', (event) => {
    metrics.counter(MetricNames.TEST_RUNS_TOTAL, 1, {
      status: event.payload.status,
      suiteId: event.payload.suiteId,
    });

    metrics.histogram(
      MetricNames.TEST_DURATION,
      event.payload.duration,
      { suiteId: event.payload.suiteId },
    );

    metrics.counter(
      MetricNames.TESTS_EXECUTED,
      event.payload.totalTests,
      { suiteId: event.payload.suiteId },
    );

    metrics.counter(
      MetricNames.TESTS_PASSED,
      event.payload.passedTests,
      { suiteId: event.payload.suiteId },
    );

    metrics.counter(
      MetricNames.TESTS_FAILED,
      event.payload.failedTests,
      { suiteId: event.payload.suiteId },
    );
  });
}
```

---

## Custom Test Generators

Create alternative test generation strategies:

```typescript
// src/custom/generators/authenticated-test-generator.ts
import { TestGeneratorService } from '../contract-suites/test-generator.service';
import { ParsedOpenApiSpec } from '../api-specs/openapi-parser.service';

export class AuthenticatedTestGenerator extends TestGeneratorService {
  constructor(
    private authEndpoint: string,
    private clientId: string,
    private clientSecret: string,
  ) {
    super();
  }

  protected override generateTestCode(service: any, endpoints: any[]): string {
    return `
const axios = require('axios');

describe('${service.name} - Authenticated Contract Tests', () => {
  const baseURL = '${service.baseUrl}';
  let authToken;

  beforeAll(async () => {
    // Get OAuth token
    const response = await axios.post('${this.authEndpoint}', {
      client_id: '${this.clientId}',
      client_secret: '${this.clientSecret}',
      grant_type: 'client_credentials',
    });

    authToken = response.data.access_token;
  });

  ${endpoints.map((endpoint) => this.generateAuthTest(endpoint)).join('\n\n  ')}
});
    `;
  }

  private generateAuthTest(endpoint: any): string {
    return `
test('${endpoint.method} ${endpoint.path} - with auth', async () => {
  const response = await axios({
    method: '${endpoint.method.toLowerCase()}',
    url: \`\${baseURL}${endpoint.path}\`,
    headers: {
      'Authorization': \`Bearer \${authToken}\`,
    },
    validateStatus: (status) => status < 500,
  });

  expect(response.status).toBeLessThan(500);
  expect(response.status).toBeGreaterThanOrEqual(200);
});
    `;
  }
}
```

### GraphQL Test Generator

```typescript
// src/custom/generators/graphql-test-generator.ts
export class GraphQLTestGenerator {
  async generateFromSchema(schema: string, service: any): Promise<string> {
    // Parse GraphQL schema
    // Generate queries for each type
    // Create tests that execute queries and validate responses

    return `
const { graphql } = require('graphql');

describe('${service.name} - GraphQL Contract Tests', () => {
  // Generated GraphQL tests
});
    `;
  }
}
```

---

## Adding Custom Assertions

Define custom validation rules:

```typescript
// src/custom/assertions/assertion-engine.ts
export interface CustomAssertion {
  type: string;
  config: any;
  validate(response: any): boolean;
  getMessage(): string;
}

export class StatusCodeAssertion implements CustomAssertion {
  type = 'status_code';

  constructor(private config: { expected: number[] }) {}

  validate(response: any): boolean {
    return this.config.expected.includes(response.status);
  }

  getMessage(): string {
    return `Expected status code to be one of: ${this.config.expected.join(', ')}`;
  }
}

export class ResponseSchemaAssertion implements CustomAssertion {
  type = 'response_schema';

  constructor(private config: { schema: any }) {}

  validate(response: any): boolean {
    const Ajv = require('ajv');
    const ajv = new Ajv();
    const validate = ajv.compile(this.config.schema);
    return validate(response.data);
  }

  getMessage(): string {
    return 'Response should match JSON schema';
  }
}

export class ResponseTimeAssertion implements CustomAssertion {
  type = 'response_time';

  constructor(private config: { maxMs: number }) {}

  validate(response: any): boolean {
    return response.duration <= this.config.maxMs;
  }

  getMessage(): string {
    return `Response time should be under ${this.config.maxMs}ms`;
  }
}

// Assertion Factory
export class AssertionFactory {
  static create(type: string, config: any): CustomAssertion {
    switch (type) {
      case 'status_code':
        return new StatusCodeAssertion(config);
      case 'response_schema':
        return new ResponseSchemaAssertion(config);
      case 'response_time':
        return new ResponseTimeAssertion(config);
      default:
        throw new Error(`Unknown assertion type: ${type}`);
    }
  }
}
```

---

## Creating Test Templates

Define reusable test templates:

```typescript
// Database seeding or API call
await prisma.testTemplate.create({
  data: {
    name: 'Authenticated CRUD Template',
    description: 'Full CRUD testing with OAuth authentication',
    strategy: 'authenticated-crud',
    template: `
const axios = require('axios');

describe('{{serviceName}} - CRUD Tests', () => {
  let authToken;
  let createdId;

  beforeAll(async () => {
    const authResponse = await axios.post('{{authUrl}}', {
      client_id: '{{clientId}}',
      client_secret: '{{clientSecret}}',
      grant_type: 'client_credentials',
    });
    authToken = authResponse.data.access_token;
  });

  test('CREATE - POST {{createEndpoint}}', async () => {
    const response = await axios.post(
      '{{baseUrl}}{{createEndpoint}}',
      {{createPayload}},
      { headers: { Authorization: \`Bearer \${authToken}\` } }
    );
    expect(response.status).toBe(201);
    createdId = response.data.id;
  });

  test('READ - GET {{readEndpoint}}', async () => {
    const response = await axios.get(
      \`{{baseUrl}}{{readEndpoint}}/\${createdId}\`,
      { headers: { Authorization: \`Bearer \${authToken}\` } }
    );
    expect(response.status).toBe(200);
  });

  test('UPDATE - PUT {{updateEndpoint}}', async () => {
    const response = await axios.put(
      \`{{baseUrl}}{{updateEndpoint}}/\${createdId}\`,
      {{updatePayload}},
      { headers: { Authorization: \`Bearer \${authToken}\` } }
    );
    expect(response.status).toBe(200);
  });

  test('DELETE - DELETE {{deleteEndpoint}}', async () => {
    const response = await axios.delete(
      \`{{baseUrl}}{{deleteEndpoint}}/\${createdId}\`,
      { headers: { Authorization: \`Bearer \${authToken}\` } }
    );
    expect(response.status).toBe(204);
  });
});
    `,
    config: JSON.stringify({
      requiredVariables: [
        'authUrl',
        'clientId',
        'clientSecret',
        'createEndpoint',
        'createPayload',
        'readEndpoint',
        'updateEndpoint',
        'updatePayload',
        'deleteEndpoint',
      ],
    }),
    isBuiltIn: true,
  },
});
```

---

## Extending the API

Add custom endpoints:

```typescript
// src/custom/controllers/analytics.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Get('success-rate')
  async getSuccessRate(@Query('days') days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const runs = await this.prisma.contractRun.findMany({
      where: {
        startedAt: {
          gte: since,
        },
      },
    });

    const total = runs.length;
    const passed = runs.filter((r) => r.status === 'PASSED').length;

    return {
      total,
      passed,
      failed: total - passed,
      successRate: total > 0 ? (passed / total) * 100 : 0,
      period: `${days} days`,
    };
  }

  @Get('trending')
  async getTrending() {
    // Find suites with increasing failure rates
    // Return list of problematic suites
  }
}

// Register in app.module.ts
import { AnalyticsController } from './custom/controllers/analytics.controller';

@Module({
  controllers: [
    // ... existing controllers
    AnalyticsController,
  ],
})
export class AppModule {}
```

---

## Best Practices

1. **Follow Interface Contracts**: Always implement the full interface
2. **Handle Errors Gracefully**: Don't let extensions crash the app
3. **Log Extension Activity**: Use the logger for debugging
4. **Test Your Extensions**: Write unit tests for custom code
5. **Document Configuration**: Explain required environment variables
6. **Version Your Extensions**: Tag releases if sharing extensions
7. **Keep It Simple**: Don't over-engineer custom solutions
8. **Use TypeScript**: Leverage type safety

## Example: Complete Custom Extension

Here's a complete example combining multiple extension points:

```typescript
// src/custom/premium-monitoring/index.ts
import { eventBus } from '../../lib/events/domain-events';
import { metrics, MetricNames } from '../../lib/metrics';
import { SlackNotificationAdapter } from '../../lib/adapters';
import { DataDogMetricsAdapter } from '../adapters/datadog-metrics.adapter';

export function setupPremiumMonitoring() {
  // Set up DataDog metrics
  const ddAdapter = new DataDogMetricsAdapter(
    process.env.DD_API_KEY,
    process.env.DD_APP_KEY,
  );
  metrics.setAdapter(ddAdapter);

  // Set up Slack notifications
  const slackAdapter = new SlackNotificationAdapter(
    process.env.SLACK_WEBHOOK_URL,
  );

  // Event handler: notify on failures
  eventBus.on('testRun.completed', async (event) => {
    if (event.payload.status === 'FAILED') {
      await slackAdapter.send({
        title: '❌ Test Run Failed',
        message: `Suite ${event.payload.suiteId} failed`,
        severity: 'error',
        metadata: event.payload,
      });

      // Record failure metric
      metrics.counter('test_failures_total', 1, {
        suite: event.payload.suiteId,
      });
    }
  });

  // Event handler: track performance
  eventBus.on('testRun.completed', (event) => {
    metrics.histogram(
      'test_duration_seconds',
      event.payload.duration / 1000,
      { suite: event.payload.suiteId },
    );
  });

  console.log('✅ Premium monitoring enabled');
}

// In main.ts
import { setupPremiumMonitoring } from './custom/premium-monitoring';

async function bootstrap() {
  // ... existing setup
  setupPremiumMonitoring();
  // ...
}
```

## Further Reading

- [Architecture Documentation](./ARCHITECTURE.md)
- [Integration Recipes](./INTEGRATION_RECIPES.md)
- [API Reference](../README.md#api-endpoints)
