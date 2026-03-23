/**
 * OpenAPI Specification for BluePrint SaaS API
 * مواصفات OpenAPI لواجهة برمجة التطبيقات
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'BluePrint SaaS API',
    description: `
## BluePrint - Construction Project Management SaaS Platform

منصة متكاملة لإدارة مشاريع البناء والاستشارات الهندسية

### Authentication
All API endpoints require authentication using JWT Bearer token.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

### Rate Limiting
- Auth endpoints: 10 requests/minute
- API endpoints: 100 requests/minute
- Public endpoints: 200 requests/minute
    `,
    version: '1.0.0',
    contact: {
      name: 'BluePrint Support',
      email: 'support@blueprint.dev',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
    {
      url: 'https://api.blueprint.dev',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Projects', description: 'Project management' },
    { name: 'Tasks', description: 'Task management' },
    { name: 'Clients', description: 'Client management' },
    { name: 'Invoices', description: 'Invoice management' },
    { name: 'Documents', description: 'Document management' },
    { name: 'Reports', description: 'Reports and analytics' },
    { name: 'Notifications', description: 'Notification management' },
    { name: 'Stripe', description: 'Payment processing' },
    { name: 'Backup', description: 'Backup operations' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          fullName: { type: 'string' },
          role: {
            type: 'string',
            enum: ['admin', 'manager', 'engineer', 'accountant', 'viewer'],
          },
          avatar: { type: 'string', nullable: true },
          organizationId: { type: 'string', nullable: true },
          language: { type: 'string', enum: ['ar', 'en'], default: 'ar' },
          theme: { type: 'string', enum: ['light', 'dark', 'system'], default: 'dark' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          projectNumber: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['pending', 'active', 'on_hold', 'completed', 'cancelled'],
          },
          progressPercentage: { type: 'number', minimum: 0, maximum: 100 },
          contractValue: { type: 'number', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          projectId: { type: 'string', nullable: true },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
          },
          status: {
            type: 'string',
            enum: ['todo', 'in_progress', 'review', 'done', 'cancelled'],
          },
          progress: { type: 'number', minimum: 0, maximum: 100 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Successful login' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'username', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  username: { type: 'string', minLength: 3 },
                  password: { type: 'string', minLength: 8 },
                  fullName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created' },
          '409': { description: 'Email exists' },
        },
      },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'List of projects' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  location: { type: 'string' },
                  contractValue: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Project created' },
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of tasks' },
        },
      },
    },
    '/clients': {
      get: {
        tags: ['Clients'],
        summary: 'List clients',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of clients' },
        },
      },
    },
    '/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'List invoices',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of invoices' },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of notifications' },
        },
      },
    },
    '/stripe/plans': {
      get: {
        tags: ['Stripe'],
        summary: 'Get pricing plans',
        responses: {
          '200': { description: 'List of plans' },
        },
      },
    },
    '/backup': {
      get: {
        tags: ['Backup'],
        summary: 'List backups',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of backups' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'System healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    database: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default openApiSpec;
