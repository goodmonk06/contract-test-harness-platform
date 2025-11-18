import { Injectable } from '@nestjs/common';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ParsedOpenApiSpec } from '../api-specs/openapi-parser.service';

@Injectable()
export class TestGeneratorService {
  private readonly generatedTestsDir = join(process.cwd(), 'generated-contract-tests');

  async generateTestFile(service: any, parsedSpec: ParsedOpenApiSpec): Promise<string> {
    // Ensure directory exists
    mkdirSync(this.generatedTestsDir, { recursive: true });

    // Filter endpoints: GET requests without required params
    const testableEndpoints = parsedSpec.endpoints.filter(
      (endpoint) => endpoint.method === 'GET' && !endpoint.hasRequiredParams,
    );

    // Generate test code
    const testCode = this.generateTestCode(service, testableEndpoints);

    // Write to file
    const fileName = `${service.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.spec.js`;
    const filePath = join(this.generatedTestsDir, fileName);

    writeFileSync(filePath, testCode, 'utf-8');

    return filePath;
  }

  private generateTestCode(service: any, endpoints: any[]): string {
    const baseUrl = service.baseUrl;

    return `/**
 * Auto-generated contract tests for: ${service.name}
 * Base URL: ${baseUrl}
 * Generated: ${new Date().toISOString()}
 */

const axios = require('axios');

describe('${service.name} - Contract Tests', () => {
  const baseURL = '${baseUrl}';

  ${endpoints.map((endpoint) => this.generateTestCase(endpoint)).join('\n\n  ')}
});
`;
  }

  private generateTestCase(endpoint: any): string {
    const testName = endpoint.summary || `${endpoint.method} ${endpoint.path}`;
    const url = endpoint.path;

    return `test('${testName}', async () => {
    const response = await axios.get(\`\${baseURL}${url}\`, {
      validateStatus: (status) => status < 500, // Don't throw on 4xx
    });

    // Assert response is not a 5xx error
    expect(response.status).toBeLessThan(500);
    expect(response.status).toBeGreaterThanOrEqual(200);
  });`;
  }
}
