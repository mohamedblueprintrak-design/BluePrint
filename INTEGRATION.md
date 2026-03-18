# Netlify + Neon Database Integration

## الخطوات:

### 1. من Netlify Dashboard
1. افتح: https://app.netlify.com
2. اختر موقعك: `statuesque-pie-69a9d8`
3. اضغط **Integrations** في الشريط الجانبي
4. ابحث عن **Neon** واضغط **Add integration**
5. اضغط **Connect Neon**
6. سجل بـ GitHub (مجاني)
7. Create project → اسمه `blueprint`

### 2. Neon هيضيف DATABASE_URL تلقائياً
- Netlify هيستقبل المتغير تلقائياً
- مفيش حاجة تعملها يدوي

### 3. Deploy من جديد
- اضغط **Deploys**
- **Trigger deploy** → **Clear cache and deploy site**

---

## لو مفيش Neon Integration:

### Plan B: Supabase (مجاني + سهل)

1. https://supabase.com → Sign up with GitHub
2. Create project → `blueprint`
3. Settings → Database
4. انسخ **Connection string** (URI format)
5. في Netlify:
   - Site settings → Environment variables
   - Add: `DATABASE_URL` = `postgres://...`

---

## الخطوة التالية:

بعد ما تضيف الـ DATABASE_URL:
```bash
npx prisma db push
```
هيعمل migrate للـ schema.
