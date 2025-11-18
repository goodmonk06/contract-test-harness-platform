import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'JSONPlaceholder API',
    version: '1.0.0',
    description: 'Free fake API for testing and prototyping',
  },
  servers: [
    {
      url: 'https://jsonplaceholder.typicode.com',
      description: 'Main API server',
    },
  ],
  paths: {
    '/posts': {
      get: {
        summary: 'Get all posts',
        description: 'Returns a list of all posts',
        operationId: 'getPosts',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
    },
    '/users': {
      get: {
        summary: 'Get all users',
        description: 'Returns a list of all users',
        operationId: 'getUsers',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
    },
    '/comments': {
      get: {
        summary: 'Get all comments',
        description: 'Returns a list of all comments',
        operationId: 'getComments',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Returns a single user',
        operationId: 'getUserById',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
          },
          '404': {
            description: 'User not found',
          },
        },
      },
    },
  },
};

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.contractRun.deleteMany();
  await prisma.contractSuite.deleteMany();
  await prisma.apiSpec.deleteMany();
  await prisma.service.deleteMany();

  console.log('✅ Cleared existing data');

  // Create services
  const jsonPlaceholderService = await prisma.service.create({
    data: {
      name: 'JSONPlaceholder API',
      baseUrl: 'https://jsonplaceholder.typicode.com',
      description:
        'Free fake API for testing and prototyping. Perfect for demos and experiments.',
    },
  });

  const restapiService = await prisma.service.create({
    data: {
      name: 'ReqRes API',
      baseUrl: 'https://reqres.in/api',
      description: 'A hosted REST-API ready to respond to your AJAX requests.',
    },
  });

  const petStoreService = await prisma.service.create({
    data: {
      name: 'Petstore API (Example)',
      baseUrl: 'https://petstore.swagger.io/v2',
      description:
        'Sample Pet Store API for demonstration purposes (may not be live)',
    },
  });

  console.log('✅ Created 3 services');

  // Create API specs
  const jsonPlaceholderSpec = await prisma.apiSpec.create({
    data: {
      serviceId: jsonPlaceholderService.id,
      version: '1.0.0',
      format: 'OPENAPI_JSON',
      rawText: JSON.stringify(sampleOpenApiSpec, null, 2),
    },
  });

  const reqresSpec = await prisma.apiSpec.create({
    data: {
      serviceId: restapiService.id,
      version: '1.0.0',
      format: 'OPENAPI_JSON',
      rawText: JSON.stringify(
        {
          openapi: '3.0.0',
          info: {
            title: 'ReqRes API',
            version: '1.0.0',
          },
          servers: [
            {
              url: 'https://reqres.in/api',
            },
          ],
          paths: {
            '/users': {
              get: {
                summary: 'List users',
                responses: {
                  '200': {
                    description: 'Success',
                  },
                },
              },
            },
          },
        },
        null,
        2,
      ),
    },
  });

  console.log('✅ Created 2 API specs');

  // Create contract suites
  const jsonPlaceholderSuite = await prisma.contractSuite.create({
    data: {
      serviceId: jsonPlaceholderService.id,
      name: 'JSONPlaceholder Basic Tests',
      description:
        'Auto-generated tests for GET endpoints without required parameters',
      configJson: JSON.stringify({
        apiSpecId: jsonPlaceholderSpec.id,
        testFilePath: './generated-contract-tests/jsonplaceholder_demo.spec.js',
        generatedAt: new Date().toISOString(),
        endpointCount: 3,
        strategy: 'simple-get-requests',
      }),
    },
  });

  const reqresSuite = await prisma.contractSuite.create({
    data: {
      serviceId: restapiService.id,
      name: 'ReqRes API Tests',
      description: 'Basic contract tests for ReqRes endpoints',
      configJson: JSON.stringify({
        apiSpecId: reqresSpec.id,
        testFilePath: './generated-contract-tests/reqres_demo.spec.js',
        generatedAt: new Date().toISOString(),
        endpointCount: 1,
        strategy: 'simple-get-requests',
      }),
    },
  });

  console.log('✅ Created 2 contract suites');

  // Create sample contract runs
  const run1 = await prisma.contractRun.create({
    data: {
      suiteId: jsonPlaceholderSuite.id,
      startedAt: new Date(Date.now() - 86400000), // 1 day ago
      finishedAt: new Date(Date.now() - 86400000 + 5000),
      status: 'PASSED',
      summaryJson: JSON.stringify({
        total: 3,
        passed: 3,
        failed: 0,
        duration: 5234,
        tests: [
          {
            name: 'GET /posts',
            status: 'passed',
            duration: 1234,
          },
          {
            name: 'GET /users',
            status: 'passed',
            duration: 2000,
          },
          {
            name: 'GET /comments',
            status: 'passed',
            duration: 2000,
          },
        ],
      }),
      logPath: './test-logs/run-1.log',
    },
  });

  const run2 = await prisma.contractRun.create({
    data: {
      suiteId: jsonPlaceholderSuite.id,
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      finishedAt: new Date(Date.now() - 3600000 + 4500),
      status: 'PASSED',
      summaryJson: JSON.stringify({
        total: 3,
        passed: 3,
        failed: 0,
        duration: 4523,
        tests: [
          {
            name: 'GET /posts',
            status: 'passed',
            duration: 1100,
          },
          {
            name: 'GET /users',
            status: 'passed',
            duration: 1900,
          },
          {
            name: 'GET /comments',
            status: 'passed',
            duration: 1523,
          },
        ],
      }),
      logPath: './test-logs/run-2.log',
    },
  });

  const run3 = await prisma.contractRun.create({
    data: {
      suiteId: reqresSuite.id,
      startedAt: new Date(Date.now() - 7200000), // 2 hours ago
      finishedAt: new Date(Date.now() - 7200000 + 2000),
      status: 'PASSED',
      summaryJson: JSON.stringify({
        total: 1,
        passed: 1,
        failed: 0,
        duration: 2103,
        tests: [
          {
            name: 'GET /users',
            status: 'passed',
            duration: 2103,
          },
        ],
      }),
      logPath: './test-logs/run-3.log',
    },
  });

  console.log('✅ Created 3 sample contract runs');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  - Services: 3`);
  console.log(`  - API Specs: 2`);
  console.log(`  - Contract Suites: 2`);
  console.log(`  - Contract Runs: 3`);
  console.log('');
  console.log('🌐 You can now:');
  console.log('  1. Start the backend: npm run dev:backend');
  console.log('  2. Start the frontend: npm run dev:frontend');
  console.log('  3. Visit http://localhost:3000/services');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
