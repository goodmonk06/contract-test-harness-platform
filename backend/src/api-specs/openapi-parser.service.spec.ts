import { Test, TestingModule } from '@nestjs/testing';
import { OpenApiParserService } from './openapi-parser.service';

describe('OpenApiParserService', () => {
  let service: OpenApiParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenApiParserService],
    }).compile();

    service = module.get<OpenApiParserService>(OpenApiParserService);
  });

  describe('parse', () => {
    const validOpenApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API',
      },
      servers: [{ url: 'https://api.test.com' }],
      paths: {
        '/users': {
          get: {
            summary: 'Get all users',
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
        '/users/{id}': {
          get: {
            summary: 'Get user by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
        '/posts': {
          get: {
            summary: 'Get all posts',
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
          post: {
            summary: 'Create a post',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Created',
              },
            },
          },
        },
      },
    };

    it('should parse valid OpenAPI JSON spec', async () => {
      const rawText = JSON.stringify(validOpenApiSpec);
      const result = await service.parse(rawText, 'OPENAPI_JSON');

      expect(result.info.title).toBe('Test API');
      expect(result.info.version).toBe('1.0.0');
      expect(result.endpoints).toHaveLength(4); // GET /users, GET /users/{id}, GET /posts, POST /posts
    });

    it('should identify GET endpoints without required parameters', async () => {
      const rawText = JSON.stringify(validOpenApiSpec);
      const result = await service.parse(rawText, 'OPENAPI_JSON');

      const getUsersEndpoint = result.endpoints.find(
        (e) => e.path === '/users' && e.method === 'GET',
      );
      const getPostsEndpoint = result.endpoints.find(
        (e) => e.path === '/posts' && e.method === 'GET',
      );

      expect(getUsersEndpoint?.hasRequiredParams).toBe(false);
      expect(getPostsEndpoint?.hasRequiredParams).toBe(false);
    });

    it('should identify endpoints with required parameters', async () => {
      const rawText = JSON.stringify(validOpenApiSpec);
      const result = await service.parse(rawText, 'OPENAPI_JSON');

      const getUserByIdEndpoint = result.endpoints.find(
        (e) => e.path === '/users/{id}' && e.method === 'GET',
      );
      const postPostsEndpoint = result.endpoints.find(
        (e) => e.path === '/posts' && e.method === 'POST',
      );

      expect(getUserByIdEndpoint?.hasRequiredParams).toBe(true);
      expect(postPostsEndpoint?.hasRequiredParams).toBe(true);
    });

    it('should extract endpoint details correctly', async () => {
      const rawText = JSON.stringify(validOpenApiSpec);
      const result = await service.parse(rawText, 'OPENAPI_JSON');

      const getUsersEndpoint = result.endpoints.find(
        (e) => e.path === '/users' && e.method === 'GET',
      );

      expect(getUsersEndpoint).toBeDefined();
      expect(getUsersEndpoint?.summary).toBe('Get all users');
      expect(getUsersEndpoint?.method).toBe('GET');
      expect(getUsersEndpoint?.path).toBe('/users');
    });

    it('should parse YAML specs', async () => {
      const yamlSpec = `
openapi: 3.0.0
info:
  title: YAML API
  version: 1.0.0
paths:
  /test:
    get:
      summary: Test endpoint
      responses:
        '200':
          description: Success
`;
      const result = await service.parse(yamlSpec, 'OPENAPI_YAML');

      expect(result.info.title).toBe('YAML API');
      expect(result.endpoints).toHaveLength(1);
      expect(result.endpoints[0].path).toBe('/test');
    });
  });

  describe('validate', () => {
    it('should validate correct OpenAPI spec', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      };

      await expect(
        service.validate(JSON.stringify(spec), 'OPENAPI_JSON'),
      ).resolves.not.toThrow();
    });

    it('should reject invalid OpenAPI spec', async () => {
      const invalidSpec = { invalid: 'spec' };

      await expect(
        service.validate(JSON.stringify(invalidSpec), 'OPENAPI_JSON'),
      ).rejects.toThrow();
    });
  });
});
