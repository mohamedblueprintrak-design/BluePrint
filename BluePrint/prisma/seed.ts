import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check if organization already exists
  const existingOrg = await prisma.organization.findFirst();

  if (existingOrg) {
    console.log('✅ البيانات موجودة بالفعل');
    console.log('Organization ID:', existingOrg.id);
    console.log('Login: admin / admin123');
    return;
  }

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'BluePrint Engineering',
      slug: 'blueprint-eng',
      email: 'info@blueprint.ae',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      locale: 'ar',
    },
  });

  console.log('✅ تم إنشاء المنظمة:', org.id);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@blueprint.ae',
      password: hashedPassword,
      fullName: 'مدير النظام',
      role: 'admin',
      isActive: true,
      organizationId: org.id,
    },
  });

  console.log('✅ تم إنشاء المستخدم:', admin.id);

  // Create a Plan for subscriptions
  const plan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'خطة المؤسسات - جميع الميزات',
      price: 500,
      currency: 'AED',
      interval: 'month',
      features: JSON.stringify(['unlimited_projects', 'unlimited_users', 'ai_assistant', 'reports', 'api_access']),
      limits: JSON.stringify({ projects: -1, users: -1, storage: 100 }),
      isActive: true,
    },
  });

  console.log('✅ تم إنشاء الخطة:', plan.id);

  console.log('\n🎉 تم إنشاء البيانات الأولية بنجاح!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 بيانات الدخول:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
