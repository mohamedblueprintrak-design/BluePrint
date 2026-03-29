/**
 * Swagger/OpenAPI Documentation Endpoint
 * نقطة نهاية توثيق API التفاعلية
 */

import { NextRequest, NextResponse } from 'next/server';

// OpenAPI Specification
const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'BluePrint SaaS API',
    description: `
## نظام إدارة مكاتب الاستشارات الهندسية

BluePrint هي منصة شاملة لإدارة مشاريع البناء والاستشارات الهندسية.

### الميزات الرئيسية:
- 🏗️ إدارة المشاريع
- 📋 إدارة المهام مع مخطط جانت
- 💰 نظام الفواتير
- 👥 إدارة الموارد البشرية
- 📊 التقارير والتحليلات
- 🤖 تكامل الذكاء الاصطناعي

### المصادقة:
جميع الـ APIs محمية بـ JWT Token. أضف:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`
    `,
    version: '1.0.0',
    contact: {
      name: 'BluePrint Support',
      email: 'support@blueprint.dev',
      url: 'https://blueprint.dev',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: 'API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key for server-to-server communication',
      },
    },
    schemas: {
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique user ID' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          role: { 
            type: 'string', 
            enum: ['ADMIN', 'MANAGER', 'ENGINEER', 'ACCOUNTANT', 'VIEWER'] 
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      
      // Project schemas
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          status: { 
            type: 'string', 
            enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] 
          },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          budget: { type: 'number' },
          progress: { type: 'number', minimum: 0, maximum: 100 },
          clientId: { type: 'string' },
          managerId: { type: 'string' },
        },
      },
      
      // Task schemas
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { 
            type: 'string', 
            enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'] 
          },
          priority: { 
            type: 'string', 
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] 
          },
          dueDate: { type: 'string', format: 'date' },
          assigneeId: { type: 'string' },
          projectId: { type: 'string' },
        },
      },
      
      // Client schemas
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          company: { type: 'string' },
          address: { type: 'string' },
        },
      },
      
      // Invoice schemas
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          invoiceNumber: { type: 'string' },
          status: { 
            type: 'string', 
            enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] 
          },
          total: { type: 'number' },
          dueDate: { type: 'string', format: 'date' },
          clientId: { type: 'string' },
          projectId: { type: 'string' },
        },
      },
      
      // Error schema
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      
      // Success response schema
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
      },
      
      // Pagination params
      PaginationParams: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1, minimum: 1 },
          limit: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Unauthorized - Missing or invalid authentication',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      ForbiddenError: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFoundError: {
        description: 'Not Found - Resource does not exist',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      ValidationError: {
        description: 'Validation Error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // Authentication
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'تسجيل الدخول',
        description: 'Authenticate user and return JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    
    '/api/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'إنشاء حساب جديد',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  fullName: { type: 'string' },
                  organizationName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created' },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'تجديد التوكن',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Token refreshed' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    
    // Projects
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'قائمة المشاريع',
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'clientId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Project' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'إنشاء مشروع جديد',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Project' },
            },
          },
        },
        responses: {
          '201': { description: 'Project created' },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    
    '/api/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'تفاصيل المشروع',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Project details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Project' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
      put: {
        tags: ['Projects'],
        summary: 'تحديث المشروع',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Project' },
            },
          },
        },
        responses: {
          '200': { description: 'Project updated' },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'حذف المشروع',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Project deleted' },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
    },
    
    // Tasks
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'قائمة المهام',
        parameters: [
          { name: 'projectId', in: 'query', schema: { type: 'string' } },
          { name: 'assigneeId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'إنشاء مهمة جديدة',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Task' },
            },
          },
        },
        responses: {
          '201': { description: 'Task created' },
        },
      },
    },
    
    // Clients
    '/api/clients': {
      get: {
        tags: ['Clients'],
        summary: 'قائمة العملاء',
        responses: {
          '200': {
            description: 'List of clients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Client' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Clients'],
        summary: 'إضافة عميل جديد',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Client' },
            },
          },
        },
        responses: {
          '201': { description: 'Client created' },
        },
      },
    },
    
    // Invoices
    '/api/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'قائمة الفواتير',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'clientId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of invoices',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Invoice' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Invoices'],
        summary: 'إنشاء فاتورة جديدة',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Invoice' },
            },
          },
        },
        responses: {
          '201': { description: 'Invoice created' },
        },
      },
    },
    
    // Dashboard
    '/api/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'إحصائيات لوحة التحكم',
        responses: {
          '200': {
            description: 'Dashboard statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalProjects: { type: 'integer' },
                        activeTasks: { type: 'integer' },
                        totalRevenue: { type: 'number' },
                        pendingInvoices: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    
    // Health Check
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'فحص صحة النظام',
        security: [],
        responses: {
          '200': {
            description: 'System health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                    database: { type: 'string' },
                    redis: { type: 'string' },
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
  parameters: {
    page: {
      name: 'page',
      in: 'query',
      schema: { type: 'integer', default: 1 },
      description: 'Page number',
    },
    limit: {
      name: 'limit',
      in: 'query',
      schema: { type: 'integer', default: 10, maximum: 100 },
      description: 'Items per page',
    },
  },
  tags: [
    { name: 'Authentication', description: 'مصادقة المستخدمين' },
    { name: 'Projects', description: 'إدارة المشاريع' },
    { name: 'Tasks', description: 'إدارة المهام' },
    { name: 'Clients', description: 'إدارة العملاء' },
    { name: 'Invoices', description: 'إدارة الفواتير' },
    { name: 'Dashboard', description: 'لوحة التحكم' },
    { name: 'System', description: 'النظام' },
  ],
};

// Add all endpoints dynamically
const apiRoutes = [
  'attendance', 'automations', 'backup', 'bidding', 'boq', 'calendar',
  'contracts', 'defects', 'docs', 'documents', 'email', 'equipment',
  'expenses', 'gantt', 'inventory', 'knowledge', 'leaves', 'materials',
  'notifications', 'payroll', 'profile', 'reports', 'risks', 'settings',
  'subscriptions', 'users', 'warehouse', 'ai', 'ai-chat'
];

apiRoutes.forEach(route => {
  (openApiSpec.paths as any)[`/api/${route}`] = {
    get: {
      tags: ['API'],
      summary: `${route} - GET`,
      responses: { '200': { description: 'Success' } },
    },
    post: {
      tags: ['API'],
      summary: `${route} - POST`,
      responses: { '201': { description: 'Created' } },
    },
  };
});

export async function GET(request: NextRequest) {
  const acceptHeader = request.headers.get('accept') || '';
  
  // Return JSON for API clients
  if (acceptHeader.includes('application/json')) {
    return NextResponse.json(openApiSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  // Return HTML Swagger UI for browsers
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BluePrint API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { font-size: 28px; }
    .information-container { padding: 20px; }
    .swagger-ui .info .title small { display: none; }
  </style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
<script>
window.onload = function() {
  const spec = ${JSON.stringify(openApiSpec)};
  SwaggerUIBundle({
    spec: spec,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout",
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  });
}
</script>
</body>
</html>
`;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
