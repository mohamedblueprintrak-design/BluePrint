/**
 * Database Seed Script
 * سكريبت بيانات البذرة لقاعدة البيانات
 * 
 * Creates initial data for development and testing
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Password hashing helper
async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // Create Plans
  // ============================================
  console.log('📦 Creating subscription plans...');
  
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: 'starter' },
      update: {},
      create: {
        name: 'Starter',
        slug: 'starter',
        nameAr: 'المبتدئ',
        description: 'Perfect for small teams getting started',
        descriptionAr: 'مثالي للفرق الصغيرة التي تبدأ للتو',
        price: 0,
        currency: 'AED',
        interval: 'month',
        features: JSON.stringify({
          users: 3,
          projects: 5,
          storage: '1GB',
          support: 'email',
        }),
        limits: JSON.stringify({
          maxUsers: 3,
          maxProjects: 5,
          maxStorage: 1073741824, // 1GB in bytes
        }),
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'professional' },
      update: {},
      create: {
        name: 'Professional',
        slug: 'professional',
        nameAr: 'المحترف',
        description: 'For growing teams that need more features',
        descriptionAr: 'للفرق النامية التي تحتاج المزيد من الميزات',
        price: 199,
        currency: 'AED',
        interval: 'month',
        features: JSON.stringify({
          users: 10,
          projects: 25,
          storage: '10GB',
          support: 'priority',
          advancedReports: true,
          apiAccess: true,
        }),
        limits: JSON.stringify({
          maxUsers: 10,
          maxProjects: 25,
          maxStorage: 10737418240, // 10GB
        }),
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'enterprise' },
      update: {},
      create: {
        name: 'Enterprise',
        slug: 'enterprise',
        nameAr: 'المؤسسات',
        description: 'For large organizations with custom needs',
        descriptionAr: 'للمؤسسات الكبيرة ذات الاحتياجات المخصصة',
        price: 499,
        currency: 'AED',
        interval: 'month',
        features: JSON.stringify({
          users: 'unlimited',
          projects: 'unlimited',
          storage: '100GB',
          support: 'dedicated',
          advancedReports: true,
          apiAccess: true,
          sso: true,
          customBranding: true,
        }),
        limits: JSON.stringify({
          maxUsers: -1, // unlimited
          maxProjects: -1,
          maxStorage: 107374182400, // 100GB
        }),
        isActive: true,
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${plans.length} plans`);

  // ============================================
  // Create Demo Organization
  // ============================================
  console.log('🏢 Creating demo organization...');

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-construction' },
    update: {},
    create: {
      name: 'Demo Construction Company',
      slug: 'demo-construction',
      description: 'A demo company for testing the BluePrint SaaS platform',
      email: 'info@demo-construction.com',
      phone: '+971 4 123 4567',
      address: 'Business Bay, Dubai',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      locale: 'ar',
      planId: plans[2].id, // Enterprise plan
    },
  });

  console.log(`✅ Created organization: ${organization.name}`);

  // ============================================
  // Create Admin User
  // ============================================
  console.log('👤 Creating admin user...');

  const adminPassword = await hashPassword('Admin@123456');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@blueprint.dev' },
    update: {},
    create: {
      email: 'admin@blueprint.dev',
      username: 'admin',
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'admin',
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // ============================================
  // Create Demo Users
  // ============================================
  console.log('👥 Creating demo users...');

  const demoUsers = [
    {
      email: 'manager@demo-construction.com',
      username: 'ahmed_manager',
      fullName: 'Ahmed Al-Rashid',
      role: 'manager',
      jobTitle: 'Project Manager',
      department: 'Projects',
    },
    {
      email: 'engineer@demo-construction.com',
      username: 'sara_engineer',
      fullName: 'Sara Al-Mansouri',
      role: 'engineer',
      jobTitle: 'Senior Engineer',
      department: 'Engineering',
    },
    {
      email: 'accountant@demo-construction.com',
      username: 'mohammed_accountant',
      fullName: 'Mohammed Al-Farsi',
      role: 'accountant',
      jobTitle: 'Chief Accountant',
      department: 'Finance',
    },
    {
      email: 'viewer@demo-construction.com',
      username: 'fatima_viewer',
      fullName: 'Fatima Al-Hassan',
      role: 'viewer',
      jobTitle: 'Executive Assistant',
      department: 'Administration',
    },
  ];

  const userPassword = await hashPassword('Demo@123456');

  for (const userData of demoUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: userPassword,
        isActive: true,
        emailVerified: new Date(),
        organizationId: organization.id,
        language: 'ar',
        theme: 'dark',
      },
    });
  }

  console.log(`✅ Created ${demoUsers.length} demo users`);

  // ============================================
  // Create Demo Clients
  // ============================================
  console.log('📁 Creating demo clients...');

  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-001' },
      update: {},
      create: {
        id: 'client-001',
        name: 'شركة البناء الحديث',
        email: 'info@modern-construction.ae',
        phone: '+971 2 555 1234',
        address: 'Al Maryah Island, Abu Dhabi',
        city: 'Abu Dhabi',
        country: 'UAE',
        contactPerson: 'خالد العمري',
        taxNumber: '123456789',
        creditLimit: 500000,
        paymentTerms: 30,
        organizationId: organization.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-002' },
      update: {},
      create: {
        id: 'client-002',
        name: 'مؤسسة الخليج للمقاولات',
        email: 'contact@gulf-contractors.ae',
        phone: '+971 4 666 7890',
        address: 'Jebel Ali Free Zone, Dubai',
        city: 'Dubai',
        country: 'UAE',
        contactPerson: 'سعيد المالكي',
        taxNumber: '987654321',
        creditLimit: 1000000,
        paymentTerms: 45,
        organizationId: organization.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-003' },
      update: {},
      create: {
        id: 'client-003',
        name: 'شركة التطوير العقاري',
        email: 'info@property-dev.ae',
        phone: '+971 6 777 8901',
        address: 'Al Majaz, Sharjah',
        city: 'Sharjah',
        country: 'UAE',
        contactPerson: 'عبدالله النعيمي',
        taxNumber: '456789123',
        creditLimit: 750000,
        paymentTerms: 30,
        organizationId: organization.id,
      },
    }),
  ]);

  console.log(`✅ Created ${clients.length} demo clients`);

  // ============================================
  // Create Demo Projects
  // ============================================
  console.log('🏗️ Creating demo projects...');

  const projects = await Promise.all([
    prisma.project.upsert({
      where: { projectNumber: 'PRJ-2025-0001' },
      update: {},
      create: {
        projectNumber: 'PRJ-2025-0001',
        name: 'برج الأعمال - المرحلة الأولى',
        location: 'دبي مارينا، دبي',
        projectType: 'تجاري',
        status: 'active',
        progressPercentage: 45,
        description: 'برج تجاري من 40 طابق مع موقف سيارات تحت الأرض',
        contractValue: 85000000,
        contractDate: new Date('2024-06-15'),
        expectedStartDate: new Date('2024-07-01'),
        expectedEndDate: new Date('2026-06-30'),
        actualStartDate: new Date('2024-07-15'),
        managerId: adminUser.id,
        clientId: clients[0].id,
        budget: 82000000,
        organizationId: organization.id,
      },
    }),
    prisma.project.upsert({
      where: { projectNumber: 'PRJ-2025-0002' },
      update: {},
      create: {
        projectNumber: 'PRJ-2025-0002',
        name: 'مجمع سكني - الواحة',
        location: 'الواحة، أبوظبي',
        projectType: 'سكني',
        status: 'active',
        progressPercentage: 25,
        description: 'مجمع سكني يحتوي على 200 وحدة سكنية مع مرافق ترفيهية',
        contractValue: 120000000,
        contractDate: new Date('2024-09-01'),
        expectedStartDate: new Date('2024-10-01'),
        expectedEndDate: new Date('2027-03-31'),
        actualStartDate: new Date('2024-10-15'),
        managerId: adminUser.id,
        clientId: clients[1].id,
        budget: 115000000,
        organizationId: organization.id,
      },
    }),
    prisma.project.upsert({
      where: { projectNumber: 'PRJ-2025-0003' },
      update: {},
      create: {
        projectNumber: 'PRJ-2025-0003',
        name: 'مركز تسوق النخيل',
        location: 'النخلة، الشارقة',
        projectType: 'تجاري',
        status: 'pending',
        progressPercentage: 0,
        description: 'مركز تسوق متعدد الطوابق مع سينما ومنطقة ترفيه',
        contractValue: 45000000,
        contractDate: new Date('2025-01-10'),
        expectedStartDate: new Date('2025-02-01'),
        expectedEndDate: new Date('2026-08-31'),
        managerId: adminUser.id,
        clientId: clients[2].id,
        budget: 43000000,
        organizationId: organization.id,
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} demo projects`);

  // ============================================
  // Create Demo Tasks
  // ============================================
  console.log('📋 Creating demo tasks...');

  const tasks = [
    {
      title: 'مراجعة المخططات التنفيذية',
      description: 'مراجعة جميع المخططات التنفيذية للمشروع',
      projectId: projects[0].id,
      priority: 'high',
      status: 'in_progress',
      progress: 60,
      dueDate: new Date('2025-02-15'),
    },
    {
      title: 'إعداد جدول العمل',
      description: 'إعداد جدول العمل للمرحلة القادمة',
      projectId: projects[0].id,
      priority: 'medium',
      status: 'todo',
      progress: 0,
      dueDate: new Date('2025-02-20'),
    },
    {
      title: 'تقييم الموردين',
      description: 'تقييم العروض المقدمة من الموردين',
      projectId: projects[1].id,
      priority: 'high',
      status: 'done',
      progress: 100,
      dueDate: new Date('2025-01-30'),
    },
    {
      title: 'الحصول على التصاريح',
      description: 'استكمال إجراءات التصاريح البلدية',
      projectId: projects[2].id,
      priority: 'critical',
      status: 'in_progress',
      progress: 30,
      dueDate: new Date('2025-02-10'),
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: taskData,
    });
  }

  console.log(`✅ Created ${tasks.length} demo tasks`);

  // ============================================
  // Create Demo Invoices
  // ============================================
  console.log('📄 Creating demo invoices...');

  const invoices = [
    {
      invoiceNumber: 'INV-2025-0001',
      clientId: clients[0].id,
      projectId: projects[0].id,
      issueDate: new Date('2025-01-15'),
      dueDate: new Date('2025-02-15'),
      subtotal: 500000,
      taxRate: 5,
      taxAmount: 25000,
      total: 525000,
      paidAmount: 400000,
      status: 'partial',
      organizationId: organization.id,
    },
    {
      invoiceNumber: 'INV-2025-0002',
      clientId: clients[1].id,
      projectId: projects[1].id,
      issueDate: new Date('2025-01-20'),
      dueDate: new Date('2025-02-20'),
      subtotal: 750000,
      taxRate: 5,
      taxAmount: 37500,
      total: 787500,
      paidAmount: 0,
      status: 'sent',
      organizationId: organization.id,
    },
    {
      invoiceNumber: 'INV-2025-0003',
      clientId: clients[2].id,
      issueDate: new Date('2025-01-25'),
      dueDate: new Date('2025-02-25'),
      subtotal: 250000,
      taxRate: 5,
      taxAmount: 12500,
      total: 262500,
      paidAmount: 262500,
      status: 'paid',
      organizationId: organization.id,
    },
  ];

  for (const invoiceData of invoices) {
    await prisma.invoice.create({
      data: invoiceData,
    });
  }

  console.log(`✅ Created ${invoices.length} demo invoices`);

  // ============================================
  // Create Demo Suppliers
  // ============================================
  console.log('🏭 Creating demo suppliers...');

  const suppliers = [
    {
      name: 'شركة الخرسانة المتحدة',
      supplierType: 'materials',
      email: 'sales@united-concrete.ae',
      phone: '+971 4 111 2222',
      address: 'Industrial City, Dubai',
      contactPerson: 'عمر البلوشي',
      rating: 4.5,
      isApproved: true,
      organizationId: organization.id,
    },
    {
      name: 'مصنع الحديد العربي',
      supplierType: 'materials',
      email: 'info@arab-steel.ae',
      phone: '+971 2 333 4444',
      address: 'ICAD, Abu Dhabi',
      contactPerson: 'حمد الراشد',
      rating: 4.8,
      isApproved: true,
      organizationId: organization.id,
    },
    {
      name: 'مؤسسة المعدات الثقيلة',
      supplierType: 'equipment',
      email: 'rental@heavy-equip.ae',
      phone: '+971 6 555 6666',
      address: 'Industrial Area, Sharjah',
      contactPerson: 'راشد المنصوري',
      rating: 4.2,
      isApproved: true,
      organizationId: organization.id,
    },
  ];

  for (const supplierData of suppliers) {
    await prisma.supplier.create({
      data: supplierData,
    });
  }

  console.log(`✅ Created ${suppliers.length} demo suppliers`);

  // ============================================
  // Create Demo Risks
  // ============================================
  console.log('⚠️ Creating demo risks...');

  const risks = [
    {
      title: 'تأخير تسليم المواد',
      description: 'خطر تأخير تسليم مواد البناء من الموردين الرئيسيين',
      projectId: projects[0].id,
      category: 'schedule',
      probability: 3,
      impact: 4,
      riskScore: 12,
      status: 'open',
      priority: 'high',
      mitigationPlan: 'التعاقد مع موردين بديلين وتخزين مخزون احتياطي',
      responseStrategy: 'mitigate',
    },
    {
      title: 'ارتفاع أسعار المواد',
      description: 'التقلبات في أسعار مواد البناء الأساسية',
      projectId: projects[1].id,
      category: 'financial',
      probability: 4,
      impact: 3,
      riskScore: 12,
      status: 'open',
      priority: 'high',
      mitigationPlan: 'تثبيت الأسعار في العقود طويلة الأجل',
      responseStrategy: 'transfer',
    },
    {
      title: 'نقص العمالة الماهرة',
      description: 'صعوبة الحصول على عمالة ماهرة للمشاريع الكبيرة',
      projectId: projects[0].id,
      category: 'organizational',
      probability: 2,
      impact: 3,
      riskScore: 6,
      status: 'mitigated',
      priority: 'medium',
      mitigationPlan: 'برامج تدريب داخلية وشراكات مع معاهد فنية',
      responseStrategy: 'mitigate',
    },
  ];

  for (const riskData of risks) {
    await prisma.risk.create({
      data: riskData,
    });
  }

  console.log(`✅ Created ${risks.length} demo risks`);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('   Admin: admin@blueprint.dev / Admin@123456');
  console.log('   Manager: manager@demo-construction.com / Demo@123456');
  console.log('   Engineer: engineer@demo-construction.com / Demo@123456');
  console.log('   Accountant: accountant@demo-construction.com / Demo@123456');
  console.log('   Viewer: viewer@demo-construction.com / Demo@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
