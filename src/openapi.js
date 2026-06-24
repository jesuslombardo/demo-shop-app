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
  required: ['token', 'username', 'role'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    username: { type: 'string', example: 'standard_user' },
    role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
  },
}

const orderItem = {
  type: 'object',
  required: ['productId', 'name', 'price', 'quantity', 'lineTotal'],
  additionalProperties: false,
  properties: {
    productId: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Sauce Labs Backpack' },
    price: { type: 'number', example: 29.99 },
    quantity: { type: 'integer', example: 2 },
    lineTotal: { type: 'number', example: 59.98 },
  },
}

const order = {
  type: 'object',
  required: ['id', 'username', 'customer', 'total', 'createdAt', 'items'],
  additionalProperties: false,
  properties: {
    id: { type: 'integer', example: 1 },
    username: { type: 'string', example: 'standard_user' },
    customer: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Ada Lovelace' },
        address: { type: 'string', example: '1 Analytical Engine Way' },
        city: { type: 'string', example: 'London' },
        zip: { type: 'string', example: 'EC1A' },
      },
    },
    total: { type: 'number', example: 59.98 },
    createdAt: { type: 'string', example: '2026-06-24 18:30:00' },
    items: { type: 'array', items: orderItem },
  },
}

// The checkout payload: line items (product + quantity) and where to ship.
// Prices and totals are computed server-side, never trusted from the client.
const orderInput = {
  type: 'object',
  required: ['items', 'customer'],
  properties: {
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'integer', example: 1 },
          quantity: { type: 'integer', example: 2 },
        },
      },
    },
    customer: {
      type: 'object',
      required: ['name', 'address'],
      properties: {
        name: { type: 'string', example: 'Ada Lovelace' },
        address: { type: 'string', example: '1 Analytical Engine Way' },
        city: { type: 'string', example: 'London' },
        zip: { type: 'string', example: 'EC1A' },
      },
    },
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

// PUT is a PARTIAL update: nothing is required. The server keeps the existing
// value for any field omitted or sent as null (body.x ?? existing.x in the
// router), which is why this is a separate schema from ProductInput (create).
const productUpdate = {
  type: 'object',
  description:
    'Partial update — send only the fields to change. Omitted (or null) fields keep their current value.',
  properties: {
    name: { type: 'string', example: 'Updated name' },
    price: { type: 'number', example: 24.99 },
    description: { type: 'string', example: 'Updated description' },
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
    { name: 'orders', description: 'Cart checkout and order history' },
    { name: 'system', description: 'Operational endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Product: product,
      ProductInput: productInput,
      ProductUpdate: productUpdate,
      LoginResponse: loginResponse,
      Order: order,
      OrderItem: orderItem,
      OrderInput: orderInput,
    },
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
          403: { description: 'Authenticated but lacks the admin role' },
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
        summary: 'Update a product (partial)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductUpdate' } } },
        },
        responses: {
          200: { description: 'Updated' },
          400: { description: 'Validation error' },
          401: { description: 'Missing or invalid token' },
          403: { description: 'Authenticated but lacks the admin role' },
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
          403: { description: 'Authenticated but lacks the admin role' },
          404: { description: 'Not found' },
        },
      },
    },
    '/api/orders': {
      get: {
        tags: ['orders'],
        summary: "List the authenticated user's order history",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Orders, newest first',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } },
            },
          },
          401: { description: 'Missing or invalid token' },
        },
      },
      post: {
        tags: ['orders'],
        summary: 'Place an order (checkout)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderInput' } } },
        },
        responses: {
          201: {
            description: 'Order placed; totals computed server-side',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
          },
          400: { description: 'Validation error or unknown product' },
          401: { description: 'Missing or invalid token' },
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['orders'],
        summary: 'Get one of your orders by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'The order',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
          },
          401: { description: 'Missing or invalid token' },
          404: { description: 'Not found (or not owned by this user)' },
        },
      },
    },
  },
}
