import { Injectable } from '@nestjs/common';
import SwaggerParser from 'swagger-parser';
import * as yaml from 'js-yaml';

export interface ParsedEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
  hasRequiredParams: boolean;
}

export interface ParsedOpenApiSpec {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  endpoints: ParsedEndpoint[];
}

@Injectable()
export class OpenApiParserService {
  async validate(rawText: string, format: string): Promise<void> {
    const spec = this.parseRawText(rawText, format);
    await SwaggerParser.validate(spec);
  }

  async parse(rawText: string, format: string): Promise<ParsedOpenApiSpec> {
    const spec = this.parseRawText(rawText, format);
    const validated = await SwaggerParser.validate(spec);

    const endpoints: ParsedEndpoint[] = [];

    if (validated.paths) {
      for (const [path, pathItem] of Object.entries(validated.paths)) {
        const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

        for (const method of methods) {
          if (pathItem[method]) {
            const operation = pathItem[method];
            const hasRequiredParams = this.hasRequiredParameters(operation, pathItem);

            endpoints.push({
              path,
              method: method.toUpperCase(),
              operationId: operation.operationId,
              summary: operation.summary,
              description: operation.description,
              parameters: [...(pathItem.parameters || []), ...(operation.parameters || [])],
              requestBody: operation.requestBody,
              responses: operation.responses,
              hasRequiredParams,
            });
          }
        }
      }
    }

    return {
      info: {
        title: validated.info?.title || 'Untitled',
        version: validated.info?.version || '1.0.0',
        description: validated.info?.description,
      },
      servers: validated.servers,
      endpoints,
    };
  }

  private parseRawText(rawText: string, format: string): any {
    if (format === 'OPENAPI_YAML') {
      return yaml.load(rawText);
    }
    return JSON.parse(rawText);
  }

  private hasRequiredParameters(operation: any, pathItem: any): boolean {
    const allParams = [
      ...(pathItem.parameters || []),
      ...(operation.parameters || []),
    ];

    // Check if any parameters are required
    const hasRequiredQueryOrPathParams = allParams.some(
      (param) => param.required === true,
    );

    // Check if request body is required
    const hasRequiredBody = operation.requestBody?.required === true;

    return hasRequiredQueryOrPathParams || hasRequiredBody;
  }
}
