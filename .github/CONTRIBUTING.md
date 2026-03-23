# Contributing to BluePrint

شكراً لاهتمامك بالمساهمة في مشروع BluePrint! 🎉

## 📋 جدول المحتويات

- [البدء](#البدء)
- [إعداد بيئة التطوير](#إعداد-بيئة-التطوير)
- [قواعد الكود](#قواعد-الكود)
- [عملية الـ Pull Request](#عملية-الـ-pull-request)
- [الإبلاغ عن الأخطاء](#الإبلاغ-عن-الأخطاء)
- [طلب ميزات جديدة](#طلب-ميزات-جديدة)

## 🚀 البدء

### المتطلبات الأساسية

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Git

### إعداد بيئة التطوير

1. **Fork المشروع**
   ```bash
   git clone https://github.com/YOUR_USERNAME/BluePrint.git
   cd BluePrint
   ```

2. **تثبيت التبعيات**
   ```bash
   npm install
   ```

3. **إعداد متغيرات البيئة**
   ```bash
   cp .env.example .env.local
   ```
   
   قم بتعديل الملف بمعلومات قاعدة البيانات الخاصة بك.

4. **تشغيل قاعدة البيانات**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **تشغيل التطبيق**
   ```bash
   npm run dev
   ```

## 📝 قواعد الكود

### TypeScript

- استخدم TypeScript لجميع الملفات الجديدة
- قم بتعريف الأنواع بشكل صريح
- تجنب استخدام `any` قدر الإمكان

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ Bad
function getUser(id: any): any {
  return prisma.user.findUnique({ where: { id } });
}
```

### React Components

- استخدم Functional Components
- استخدم `const` للدوال
- قم بتسمية المكونات بـ PascalCase

```typescript
// ✅ Good
export const UserProfile = ({ user }: { user: User }) => {
  return <div>{user.name}</div>;
};

// ❌ Bad
export function userprofile(props) {
  return <div>{props.user.name}</div>;
}
```

### CSS/Tailwind

- استخدم Tailwind CSS للتنسيقات
- استخدم CSS Variables للألوان
- تجنب CSS المضمن (inline styles)

### Commit Messages

نستخدم [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: إضافة ميزة جديدة
fix: إصلاح خطأ
docs: تحديث التوثيق
style: تنسيق الكود
refactor: إعادة هيكلة الكود
test: إضافة اختبارات
chore: مهام الصيانة
```

أمثلة:
```
feat(auth): إضافة المصادقة الثنائية
fix(api): إصلاح خطأ في التحقق من البريد
docs(readme): تحديث تعليمات التثبيت
```

## 🔀 عملية الـ Pull Request

1. **إنشاء فرع جديد**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **إجراء التغييرات**
   - اكتب كود نظيف وقابل للقراءة
   - أضف اختبارات للكود الجديد
   - تأكد من نجاح جميع الاختبارات

3. **تشغيل الاختبارات**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

4. **إنشاء Pull Request**
   - اكتب عنواناً واضحاً
   - اشرح التغييرات بالتفصيل
   - أضف screenshots إن أمكن
   - اربط أي issues ذات صلة

### قالب Pull Request

```markdown
## 📝 الوصف
وصف واضح للتغييرات

## 🔧 نوع التغيير
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## ✅ الاختبارات
- [ ] تم إضافة اختبارات جديدة
- [ ] جميع الاختبارات تمر

## 📸 Screenshots
إن أمكن
```

## 🐛 الإبلاغ عن الأخطاء

قبل الإبلاغ عن خطأ، تأكد من:

1. البحث في الـ Issues الموجودة
2. التأكد من أنك تستخدم أحدث إصدار
3. إرفاق معلومات كافية:
   - خطوات إعادة إنتاج الخطأ
   - السلوك المتوقع
   - السلوك الفعلي
   - لقطات شاشة إن أمكن
   - معلومات النظام (OS, Browser, Version)

## 💡 طلب ميزات جديدة

1. ابحث في الـ Issues الموجودة أولاً
2. افتح Issue جديد مع:
   - وصف واضح للميزة
   - سبب الحاجة إليها
   - أمثلة على الاستخدام

## 📞 التواصل

- افتح Issue للأسئلة العامة
- تواصل معنا على [social media links]

---

بالمساهمة في هذا المشروع، أنت توافق على اتباع [Code of Conduct](CODE_OF_CONDUCT.md).
