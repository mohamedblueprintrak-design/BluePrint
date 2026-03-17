# BluePrint SaaS Platform

<p align="center">
  <img src="public/logo.png" alt="BluePrint Logo" width="200"/>
</p>

<p align="center">
  <strong>نظام إدارة مكاتب الاستشارات الهندسية - منصة SaaS متكاملة</strong>
</p>

<p align="center">
  <a href="https://github.com/mohamedblueprintrak-design/BluePrint/actions">
    <img src="https://github.com/mohamedblueprintrak-design/BluePrint/workflows/CI/CD%20Pipeline/badge.svg" alt="CI/CD Pipeline"/>
  </a>
  <a href="https://github.com/mohamedblueprintrak-design/BluePrint/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"/>
  </a>
</p>

---

## 📋 نظرة عامة

BluePrint هو نظام إدارة متكامل لمكاتب الاستشارات الهندسية، يوفر حلولاً شاملة لإدارة:

- المشاريع والمهام
- العملاء والموردين
- الفواتير والعقود
- المخازن والمواد
- الموارد البشرية
- التقارير والتحليلات

## ✨ الميزات

### 🏢 إدارة المنظمات
- نظام اشتراكات متكامل (SaaS)
- عزل البيانات بين المنظمات
- إدارة الصلاحيات والأدوار

### 📊 لوحة التحكم
- إحصائيات شاملة
- رسوم بيانية تفاعلية
- تنبيهات وإشعارات

### 👥 إدارة المستخدمين
- نظام مصادقة JWT آمن
- أدوار متعددة (مدير، مستخدم)
- إدارة الصلاحيات

### 📁 المشاريع
- إدارة المشاريع الكاملة
- جدول الكميات (BOQ)
- تقارير الموقع
- إدارة العيوب

### 💰 المالية
- الفواتير والعروض
- العقود والاتفاقيات
- المصروفات والميزانيات
- السندات المحاسبية

### 🏭 المخازن
- إدارة المواد
- المخزون والحد الأدنى
- أوامر الشراء
- الموردين

### 👔 الموارد البشرية
- الحضور والانصراف
- طلبات الإجازة
- شهادات الموظفين

### 🤖 الذكاء الاصطناعي
- مساعد ذكي للاستفسارات
- تحليل البيانات
- اقتراحات مخصصة

## 🚀 التقنيات المستخدمة

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: JWT (jose), bcryptjs
- **State Management**: TanStack Query (React Query)
- **Testing**: Jest, React Testing Library
- **Monitoring**: Sentry
- **Deployment**: Vercel

## 📦 التثبيت

### المتطلبات

- Node.js 20+
- PostgreSQL 14+
- npm أو yarn أو pnpm

### خطوات التثبيت

1. **استنساخ المستودع**

```bash
git clone https://github.com/mohamedblueprintrak-design/BluePrint.git
cd BluePrint
```

2. **تثبيت الاعتماديات**

```bash
npm install
```

3. **إعداد متغيرات البيئة**

```bash
cp .env.example .env
# قم بتحرير .env وإضافة قيمك
```

4. **إعداد قاعدة البيانات**

```bash
npx prisma migrate dev
npx prisma generate
```

5. **تهيئة البيانات (اختياري)**

```bash
npm run seed
```

6. **تشغيل التطبيق**

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## 🧪 الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات في وضع المراقبة
npm run test:watch

# توليد تقرير التغطية
npm run test:coverage
```

## 📁 هيكل المشروع

```
blueprint/
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── prisma/
│   ├── schema.prisma     # نموذج قاعدة البيانات
│   └── seed.ts           # بيانات أولية
├── public/               # الملفات الثابتة
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── page.tsx      # الصفحة الرئيسية
│   │   └── layout.tsx    # تخطيط التطبيق
│   ├── components/       # مكونات React
│   │   ├── ui/           # مكونات shadcn/ui
│   │   └── ...           # مكونات المشروع
│   ├── hooks/            # React Hooks
│   │   └── queries/      # TanStack Query hooks
│   ├── lib/              # Utilities
│   │   ├── db.ts         # Prisma Client
│   │   ├── env.ts        # Environment validation
│   │   └── translations.ts # الترجمات
│   ├── providers/        # React Providers
│   │   └── query-provider.tsx # TanStack Query Provider
│   └── types/            # TypeScript types
├── .env.example          # نموذج متغيرات البيئة
├── .gitignore           # ملفات Git المستبعدة
├── jest.config.ts       # إعداد Jest
├── next.config.ts       # إعداد Next.js
├── package.json         # اعتماديات المشروع
├── tailwind.config.ts   # إعداد Tailwind CSS
└── tsconfig.json        # إعداد TypeScript
```

## 🔐 متغيرات البيئة

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| `DATABASE_URL` | رابط قاعدة البيانات | ✅ |
| `DIRECT_DATABASE_URL` | رابط مباشر لقاعدة البيانات | ✅ |
| `JWT_SECRET` | مفتاح JWT (32+ حرف) | ✅ |
| `JWT_EXPIRES_IN` | مدة صلاحية JWT | ❌ |
| `NEXT_PUBLIC_APP_URL` | رابط التطبيق | ❌ |
| `SENTRY_DSN` | رابط Sentry | ❌ |
| `OPENAI_API_KEY` | مفتاح OpenAI | ❌ |

## 🔒 الأمان

- ✅ تشفير كلمات المرور بـ bcryptjs
- ✅ JWT tokens للمصادقة
- ✅ GitHub OAuth للمصادقة الاجتماعية
- ✅ Rate limiting (100 طلب/دقيقة)
- ✅ Organization isolation
- ✅ CORS protection
- ✅ Security headers
- ✅ CSRF protection للـ OAuth

## 📱 التصميم المتجاوب

- ✅ تصميم متجاوب لجميع الشاشات
- ✅ قائمة جانبية (Sidebar) تتحول لـ Drawer في الجوال
- ✅ رأس ثابتة للجوال مع الشعار
- ✅ زر قائمة للجوال
- ✅ تباعد و padding مناسب للشاشات الصغيرة

## 🔗 GitHub OAuth

تطبيقك يدعم تسجيل الدخول عبر GitHub! للإعداد:

1. اذهب إلى [GitHub Developer Settings](https://github.com/settings/developers)
2. أنشئ OAuth App جديد
3. اضبط:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/github/callback`
4. انسخ Client ID و Client Secret إلى `.env.local`

```bash
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
```

## 🚀 GitHub Actions CI/CD

المشروع يحتوي على GitHub Actions للتجميع المستمر:

### Workflows المتاحة:
- `ci.yml` - بناء واختبار المشروع
- `verify.yml` - التحقق من جودة الكود
- `schema-check.yml` - التحقق من صحة قاعدة البيانات

### الأسرار المطلوبة:
- `DATABASE_URL` - رابط قاعدة البيانات
- `JWT_SECRET` - مفتاح JWT
- `GITHUB_CLIENT_ID` - معرف GitHub OAuth
- `GITHUB_CLIENT_SECRET` - سر GitHub OAuth
- `VERCEL_TOKEN` - رمز Vercel للنشر

## 🚢 النشر

### Vercel (موصى به)

1. اربط المستودع بـ Vercel
2. أضف متغيرات البيئة في إعدادات المشروع
3. انشر!

```bash
npm i -g vercel
vercel --prod
```

### Docker

```bash
docker build -t blueprint .
docker run -p 3000:3000 blueprint
```

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:

1. انسخ المستودع (Fork)
2. أنشئ فرعاً جديداً (`git checkout -b feature/amazing-feature`)
3. أجرِ تغييراتك (`git commit -m 'Add amazing feature'`)
4. ادفع الفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص بموجب [MIT License](LICENSE).

## 👨‍💻 المطور

**Mohamed BluePrint**

- GitHub: [@mohamedblueprintrak-design](https://github.com/mohamedblueprintrak-design)

## 🙏 الشكر

- [Next.js](https://nextjs.org/)
- [Prisma](https://prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

<p align="center">
  Made with ❤️ in UAE
</p>
