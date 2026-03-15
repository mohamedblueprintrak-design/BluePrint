import { db } from './src/lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting seed...');

  // Create organization first
  let organization = await db.organization.findFirst();
  if (!organization) {
    organization = await db.organization.create({
      data: {
        name: 'BluePrint Engineering Consultancy',
        slug: 'blueprint-eng',
        email: 'info@blueprint.ae',
        phone: '+971-4-0000000',
        currency: 'AED',
        timezone: 'Asia/Dubai',
        locale: 'ar'
      }
    });
    console.log('✅ Created organization:', organization.name);
  } else {
    console.log('ℹ️ Organization already exists:', organization.name);
  }

  // Create admin user
  const existingAdmin = await db.user.findUnique({ where: { username: 'admin' } });
  let adminUser;
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await db.user.create({
      data: {
        username: 'admin',
        email: 'admin@blueprint.ae',
        password: hashedPassword,
        fullName: 'مدير النظام',
        role: 'admin',
        isActive: true,
        language: 'ar',
        theme: 'dark',
        organizationId: organization.id
      }
    });
    console.log('✅ Created admin user:', adminUser.username);
  } else {
    adminUser = existingAdmin;
    console.log('ℹ️ Admin user already exists');
  }

  // Create sample clients
  const clientsData = [
    { name: 'شركة الإمارات للإنشاءات', email: 'info@emirates-construct.ae', phone: '+971-4-1234567', clientType: 'company' },
    { name: 'مؤسسة دبي للتطوير العقاري', email: 'contact@dubai-dev.ae', phone: '+971-4-2345678', clientType: 'company' },
    { name: 'أبوظبي للمشاريع الهندسية', email: 'projects@abudhabi-eng.ae', phone: '+971-2-3456789', clientType: 'company' },
    { name: 'محمد الأحمد', email: 'm.ahmad@email.com', phone: '+971-50-1234567', clientType: 'individual' },
  ];

  for (const clientData of clientsData) {
    const existing = await db.client.findFirst({ where: { name: clientData.name } });
    if (!existing) {
      const client = await db.client.create({ 
        data: {
          ...clientData,
          organizationId: organization.id
        } 
      });
      console.log('✅ Created client:', client.name);
    }
  }

  // Create sample projects
  const clients = await db.client.findMany({ take: 3 });
  const projectsData = [
    { name: 'برج الأعمال - دبي مارينا', location: 'دبي مارينا، دبي', projectType: 'تجاري', contractValue: 15000000, status: 'active', progressPercentage: 45 },
    { name: 'فيلا فاخرة - النخلة', location: 'نخلة جميرا، دبي', projectType: 'سكني', contractValue: 5000000, status: 'completed', progressPercentage: 100 },
    { name: 'مجمع تجاري - أبوظبي', location: 'جزيرة الريم، أبوظبي', projectType: 'تجاري', contractValue: 25000000, status: 'pending', progressPercentage: 0 },
    { name: 'فندق 5 نجوم', location: 'وسط دبي، دبي', projectType: 'ضيافة', contractValue: 80000000, status: 'active', progressPercentage: 25 },
  ];

  for (let i = 0; i < projectsData.length; i++) {
    const projectData = projectsData[i];
    const existing = await db.project.findFirst({ where: { name: projectData.name } });
    if (!existing) {
      const count = await db.project.count();
      const projectNumber = `PRJ-2024-${(count + 1).toString().padStart(4, '0')}`;
      const project = await db.project.create({
        data: {
          name: projectData.name,
          projectNumber,
          location: projectData.location,
          projectType: projectData.projectType,
          clientId: clients[i % clients.length]?.id,
          contractValue: projectData.contractValue,
          organizationId: organization.id,
          status: projectData.status as any,
          progressPercentage: projectData.progressPercentage,
          contractDate: new Date(),
          expectedStartDate: new Date(),
          expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('✅ Created project:', project.name);
    }
  }

  // Create sample suppliers
  const suppliersData = [
    { name: 'شركة الخرسانة المتحدة', supplierType: 'مورد مواد', phone: '+971-4-1111111' },
    { name: 'حديد التسليح الإمارات', supplierType: 'مورد مواد', phone: '+971-4-2222222' },
    { name: 'مقاولات البناء الحديث', supplierType: 'مقاول', phone: '+971-4-3333333' },
  ];

  for (const supplierData of suppliersData) {
    const existing = await db.supplier.findFirst({ where: { name: supplierData.name } });
    if (!existing) {
      const supplier = await db.supplier.create({ 
        data: {
          ...supplierData,
          organizationId: organization.id
        } 
      });
      console.log('✅ Created supplier:', supplier.name);
    }
  }

  // Create sample materials
  const materialsData = [
    { name: 'خرسانة جاهزة C25', category: 'خرسانة', unit: 'م³', unitPrice: 320, currentStock: 500 },
    { name: 'خرسانة جاهزة C30', category: 'خرسانة', unit: 'م³', unitPrice: 360, currentStock: 300 },
    { name: 'حديد تسليح 12 مم', category: 'حديد', unit: 'طن', unitPrice: 2800, currentStock: 50 },
    { name: 'حديد تسليح 16 مم', category: 'حديد', unit: 'طن', unitPrice: 2750, currentStock: 40 },
    { name: 'طوب إسمنتي', category: 'بناء', unit: 'حبة', unitPrice: 1.0, currentStock: 10000 },
    { name: 'رمل نظيف', category: 'ركام', unit: 'م³', unitPrice: 85, currentStock: 200 },
  ];

  for (const materialData of materialsData) {
    const existing = await db.material.findFirst({ where: { name: materialData.name } });
    if (!existing) {
      const count = await db.material.count();
      const materialCode = `MAT-${(count + 1).toString().padStart(4, '0')}`;
      const material = await db.material.create({
        data: {
          ...materialData,
          materialCode,
          organizationId: organization.id,
          minStock: 50,
          maxStock: 500
        }
      });
      console.log('✅ Created material:', material.name);
    }
  }

  // Create sample invoices
  const invoiceClients = await db.client.findMany({ take: 2 });
  const invoiceProjects = await db.project.findMany({ take: 2 });
  
  const invoicesData = [
    { subtotal: 50000, status: 'paid', paidRatio: 1 },
    { subtotal: 75000, status: 'partial', paidRatio: 0.4 },
    { subtotal: 120000, status: 'pending', paidRatio: 0 },
  ];

  for (let i = 0; i < invoicesData.length; i++) {
    const invData = invoicesData[i];
    const count = await db.invoice.count();
    const invoiceNumber = `INV-2024-${(count + 1).toString().padStart(4, '0')}`;
    
    const existing = await db.invoice.findUnique({ where: { invoiceNumber } });
    if (!existing) {
      const taxAmount = invData.subtotal * 0.05;
      const total = invData.subtotal + taxAmount;
      const invoice = await db.invoice.create({
        data: {
          invoiceNumber,
          clientId: invoiceClients[i % invoiceClients.length]?.id,
          projectId: invoiceProjects[i % invoiceProjects.length]?.id,
          organizationId: organization.id,
          subtotal: invData.subtotal,
          taxRate: 5,
          taxAmount,
          total,
          paidAmount: total * invData.paidRatio,
          status: invData.status as any,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('✅ Created invoice:', invoice.invoiceNumber);
    }
  }

  // Create sample tasks
  const taskProjects = await db.project.findMany({ take: 2 });
  const tasksData = [
    { title: 'مراجعة المخططات الهندسية', priority: 'high', status: 'in_progress' },
    { title: 'إعداد تقرير التقدم الشهري', priority: 'medium', status: 'todo' },
    { title: 'اجتماع مع العميل', priority: 'high', status: 'todo' },
    { title: 'مراجعة الميزانية', priority: 'medium', status: 'in_progress' },
    { title: 'تسليم المرحلة الأولى', priority: 'urgent', status: 'todo' },
  ];

  for (let i = 0; i < tasksData.length; i++) {
    const taskData = tasksData[i];
    const existing = await db.task.findFirst({ where: { title: taskData.title } });
    if (!existing) {
      const task = await db.task.create({
        data: {
          title: taskData.title,
          projectId: taskProjects[i % taskProjects.length]?.id,
          priority: taskData.priority as any,
          status: taskData.status as any,
          dueDate: new Date(Date.now() + (7 + i * 3) * 24 * 60 * 60 * 1000),
          createdById: adminUser?.id
        }
      });
      console.log('✅ Created task:', task.title);
    }
  }

  console.log('✅ Seed completed!');
  console.log('\n📝 Login credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
