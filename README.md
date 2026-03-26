# BluePrint SaaS - نظام إدارة مكاتب الاستشارات الهندسية

<div align="center">
  <img src="public/logo.svg" alt="BluePrint Logo" width="120" height="120">
  
  <h3>منصة متكاملة لإدارة مشاريع البناء والاستشارات الهندسية</h3>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
</div>

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) + React 19 |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL 16 + Prisma 6 ORM |
| **Authentication** | JWT + NextAuth.js + 2FA (TOTP) |
| **State Management** | TanStack Query v5 + Zustand |
| **UI Components** | shadcn/ui + Radix UI + Tailwind CSS 4 |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Real-time** | Socket.io |
| **Cache** | Redis |
| **Payments** | Stripe |
| **AI Integration** | z-ai-web-dev-sdk |
| **Testing** | Jest + Playwright |
| **Deployment** | Docker + Vercel + Netlify |

---

## 📋 نظرة عامة

BluePrint SaaS هي منصة شاملة لإدارة مشاريع البناء والاستشارات الهندسية، مصممة خصيصاً لمكاتب الاستشارات الهندسية في منطقة الخليج العربي. توفر المنصة حلاً متكاملاً لإدارة المشاريع والمهام والفواتير والموارد البشرية.

### المميزات الرئيسية

- **🏗️ إدارة المشاريع**: تتبع شامل للمشاريع من البداية حتى التسليم
- **📋 إدارة المهام**: نظام مهام متكامل مع مخطط جانت
- **💰 الفواتير والمشاريع**: إنشاء وإدارة الفواتير والعروض
- **👥 الموارد البشرية**: إدارة الموظفين والحضور والإجازات
- **📊 التقارير**: تقارير تفصيلية وتحليلات متقدمة
- **🔒 الأمان**: مصادقة JWT وتحكم في الصلاحيات
- **🌍 دعم اللغات**: واجهة باللغة العربية والإنجليزية

---

## 📸 لقطات الشاشة

### لوحة التحكم الرئيسية
![Dashboard](./docs/screenshots/dashboard.png)

### مخطط جانت
![Gantt Chart](./docs/screenshots/gantt.png)

### إدارة المشاريع
![Projects](./docs/screenshots/projects.png)

### نظام الفواتير
![Invoices](./docs/screenshots/invoices.png)

> 📹 **فيديو تجريبي**: [شاهد العرض الكامل على YouTube](https://youtube.com/@blueprint-saas)

---

## 🚀 البدء السريع

### المتطلبات الأساسية

- Node.js 20 أو أحدث
- PostgreSQL 16 أو أحدث
- npm أو yarn أو pnpm

### التثبيت

1. **استنساخ المستودع**
```bash
git clone https://github.com/mohamedblueprintrak-design/BluePrint.git
cd BluePrint
```

2. **تثبيت التبعيات**
```bash
npm install
```

3. **إعداد متغيرات البيئة**
```bash
cp .env.example .env
```

قم بتعديل ملف `.env` بالقيم المناسبة:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blueprint"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **إعداد قاعدة البيانات**
```bash
# إنشاء المهاجرات
npx prisma migrate dev

# توليد عميل Prisma
npx prisma generate

# بيانات البذرة (اختياري)
npx prisma db seed
```

5. **تشغيل التطبيق**
```bash
# بيئة التطوير
npm run dev

# بناء الإنتاج
npm run build
npm start
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

---

## 📁 هيكل المشروع

```
blueprint-saas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # المصادقة
│   │   │   ├── projects/      # المشاريع
│   │   │   ├── tasks/         # المهام
│   │   │   ├── clients/       # العملاء
│   │   │   ├── invoices/      # الفواتير
│   │   │   └── ...
│   │   ├── dashboard/         # صفحات لوحة التحكم
│   │   └── login/             # صفحة تسجيل الدخول
│   │
│   ├── components/            # مكونات React
│   │   ├── ui/               # مكونات UI الأساسية
│   │   ├── layout/           # التخطيط
│   │   ├── dashboard/        # لوحة التحكم
│   │   └── ...
│   │
│   ├── lib/                   # المكتبات والأدوات
│   │   ├── auth/             # المصادقة والتفويض
│   │   ├── repositories/     # طبقة الوصول للبيانات
│   │   ├── services/         # منطق الأعمال
│   │   ├── cache/            # التخزين المؤقت
│   │   └── validations/      # التحقق من البيانات
│   │
│   ├── context/              # React Context
│   ├── hooks/                # React Hooks
│   └── types/                # TypeScript Types
│
├── prisma/
│   ├── schema.prisma         # مخطط قاعدة البيانات
│   ├── migrations/           # ملفات الهجرة
│   └── seed.ts               # بيانات البذرة
│
├── __tests__/               # الاختبارات
├── e2e/                     # اختبارات E2E
├── .github/
│   └── workflows/           # GitHub Actions
│
├── Dockerfile               # Docker للإنتاج
├── docker-compose.yml       # Docker Compose
└── README.md
```

---

## 🔐 المصادقة والتفويض

### أدوار المستخدمين

| الدور | الوصف | الصلاحيات |
|------|------|----------|
| `admin` | مدير النظام | جميع الصلاحيات |
| `manager` | مدير مشروع | إنشاء وتعديل المشاريع والمهام |
| `engineer` | مهندس | عرض وتعديل المهام المخصصة |
| `accountant` | محاسب | إدارة الفواتير والتقارير المالية |
| `viewer` | مشاهد | عرض البيانات فقط |

### نظام الصلاحيات

```typescript
enum Permission {
  // المشاريع
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  
  // المهام
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  
  // ... المزيد
}
```

---

## 📡 API Documentation

### نقاط النهاية الرئيسية

#### المصادقة

```http
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

#### المشاريع

```http
GET    /api/projects           # قائمة المشاريع
POST   /api/projects           # إنشاء مشروع
GET    /api/projects/:id       # تفاصيل مشروع
PUT    /api/projects/:id       # تحديث مشروع
DELETE /api/projects/:id       # حذف مشروع
```

#### المهام

```http
GET    /api/tasks              # قائمة المهام
POST   /api/tasks              # إنشاء مهمة
PUT    /api/tasks/:id          # تحديث مهمة
DELETE /api/tasks/:id          # حذف مهمة
```

#### العملاء

```http
GET    /api/clients            # قائمة العملاء
POST   /api/clients            # إنشاء عميل
PUT    /api/clients/:id        # تحديث عميل
DELETE /api/clients/:id        # حذف عميل
```

### تنسيق الاستجابة

**نجاح:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 100 }
}
```

**خطأ:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data"
  }
}
```

---

## 🧪 الاختبارات

### تشغيل الاختبارات

```bash
# اختبارات الوحدة
npm run test

# اختبارات التكامل
npm run test:integration

# اختبارات E2E
npm run test:e2e

# تغطية الاختبارات
npm run test:coverage
```

### هيكل الاختبارات

```
__tests__/
├── auth/              # اختبارات المصادقة
├── services/          # اختبارات الخدمات
├── repositories/      # اختبارات المستودعات
└── api/               # اختبارات API

e2e/
├── auth/              # اختبارات E2E للمصادقة
├── dashboard/         # اختبارات لوحة التحكم
└── pricing/           # اختبارات الأسعار
```

---

## 🐳 Docker Deployment

### بناء الصورة

```bash
docker build -t blueprint-saas .
```

### باستخدام Docker Compose

```bash
# تشغيل جميع الخدمات
docker-compose up -d

# عرض السجلات
docker-compose logs -f

# إيقاف الخدمات
docker-compose down
```

### الخدمات المتضمنة

- **app**: تطبيق Next.js
- **postgres**: قاعدة بيانات PostgreSQL
- **redis**: تخزين مؤقت Redis
- **nginx**: خادم عكسي (اختياري)

---

## 🔄 CI/CD Pipeline

يتم استخدام GitHub Actions للتكامل المستمر والنشر المستمر:

1. **Lint & Type Check**: فحص الكود
2. **Unit Tests**: اختبارات الوحدة
3. **Integration Tests**: اختبارات التكامل
4. **E2E Tests**: اختبارات E2E
5. **Security Scan**: فحص الأمان
6. **Build Docker Image**: بناء صورة Docker
7. **Deploy**: النشر التلقائي

---

## 🌍 متغيرات البيئة

| المتغير | الوصف | مطلوب |
|--------|-------|-------|
| `DATABASE_URL` | رابط قاعدة البيانات | ✅ |
| `JWT_SECRET` | مفتاح JWT (32+ حرف) | ✅ |
| `NEXT_PUBLIC_APP_URL` | رابط التطبيق | ✅ |
| `SMTP_HOST` | خادم البريد | ❌ |
| `SMTP_USER` | مستخدم البريد | ❌ |
| `SMTP_PASS` | كلمة مرور البريد | ❌ |
| `STRIPE_SECRET_KEY` | مفتاح Stripe | ❌ |
| `REDIS_URL` | رابط Redis | ❌ |

---

## 📊 مراقبة الأداء

### Health Check Endpoint

```http
GET /api/health
```

الاستجابة:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-01-20T10:00:00Z"
}
```

---

## 🔧 استكشاف الأخطاء

### مشاكل شائعة

**1. خطأ اتصال قاعدة البيانات**
```bash
# التحقق من حالة PostgreSQL
docker-compose ps postgres

# إعادة إنشاء قاعدة البيانات
npx prisma migrate reset
```

**2. خطأ JWT_SECRET**
```bash
# التأكد من طول المفتاح
echo -n "your-secret-key" | wc -c  # يجب أن يكون 32+
```

**3. مشاكل Prisma**
```bash
# إعادة توليد العميل
npx prisma generate

# التحقق من الاتصال
npx prisma db push
```

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. عمل التغييرات
4. عمل commit (`git commit -m 'Add amazing feature'`)
5. رفع التغييرات (`git push origin feature/amazing-feature`)
6. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

## 📞 الدعم

- **البريد الإلكتروني**: support@blueprint.dev
- **GitHub Issues**: [رابط المشاكل](https://github.com/mohamedblueprintrak-design/BluePrint/issues)
- **التوثيق**: [docs.blueprint.dev](https://docs.blueprint.dev)

---

<div align="center">
  <p>صنع بـ ❤️ لخدمة مكاتب الاستشارات الهندسية</p>
</div>
