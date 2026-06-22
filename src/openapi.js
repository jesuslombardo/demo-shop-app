const product = {
  type: 'object',
  // The contract: every product has exactly these fields, with these types,
  // and no extras. Tightening this makes Swagger docs precise AND lets the
  // testing repo validate responses against it (schema-based contract tests).
  required: ['id', 'name', 'price', 'description'],
  additionalProperties: false,
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Sauce Labs Backpack' },
    price: { type: 'number', example: 29.99 },
    description: { type: 'string', example: 'carry.allTheThings() ...' },
  },
}

const loginResponse = {
  type: 'object',
  required: ['token', 'username'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    username: { type: 'string', example: 'standard_user' },
  },
}

const productInput = {
  type: 'object',
  required: ['name', 'price'],
  properties: {
    name: { type: 'string', example: 'New Product' },
    price: { type: 'number', example: 19.99 },
    description: { type: 'string', example: 'Optional description' },
  },
}

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Demo Shop API',
    version: '1.0.0',
    description:
      'Minimal product catalogue API. Reads are public; writes require a Bearer token obtained from /api/login. Built as a System Under Test for Playwright API + E2E tests.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'auth', description: 'Authentication' },
    { name: 'products', description: 'Product catalogue (CRUD)' },
    { name: 'system', description: 'Operational endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: { Product: product, ProductInput: productInput, LoginResponse: loginResponse },
  },
  paths: {
    '/health': {
      get: {
        tags: ['system'],
        summary: 'Readiness probe',
        responses: { 200: { description: 'Service is up' } },
      },
    },
    '/api/login': {
      post: {
        tags: ['auth'],
        summary: 'Exchange credentials for a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'standard_user' },
                  password: { type: 'string', example: 'secret_sauce' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'A signed JWT',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['products'],
        summary: 'List all products',
        responses: {
          200: {
            description: 'The full catalogue',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } },
            },
          },
        },
      },
      post: {
        tags: ['products'],
        summary: 'Create a product',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } } },
        },
        responses: {
          201: { description: 'Created' },
          400: { description: 'Validation error' },
          401: { description: 'Missing or invalid token' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['products'],
        summary: 'Get a product by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'The product' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['products'],
        summary: 'Update a product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } } },
        },
        responses: {
          200: { description: 'Updated' },
          400: { description: 'Validation error' },
          401: { description: 'Missing or invalid token' },
          404: { description: 'Not found' },
        },
      },
      delete: {
        tags: ['products'],
        summary: 'Delete a product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: 'Deleted' },
          401: { description: 'Missing or invalid token' },
          404: { description: 'Not found' },
        },
      },
    },
  },
}
