/**
 * Comprehensive Database Seed Script
 * سكريبت بيانات البذرة الشامل لقاعدة البيانات
 *
 * Creates demo data showcasing ALL features of the BluePrint SaaS platform
 * Including: Plans, Org, Users, Clients, Projects, WorkflowPhases, ClientInteractions,
 * MunicipalityCorrespondence, ProjectTemplates, Tasks, Proposals, Contracts, Documents,
 * SiteReports, SiteVisitReports, SLABreaches, Transmittals, Risks, Invoices, Suppliers
 */

import {
  PrismaClient,
  UserRole,
  TaskPriority,
  TaskStatus,
  ProjectStatus,
  InvoiceStatus,
  RiskStatus,
  SupplierType,
  PriorityLevel,
  TaskType,
  SLABreachStatus,
  RiskCategory,
  RiskResponseStrategy,
  ProposalStatus,
  ContractStatus,
  ContractType,
  DocumentType,
  DocumentCategory,
  SiteReportStatus,
  TransmittalStatus,
  TransmittalDeliveryMethod,
  TransmittalItemStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// Helpers
// ============================================

async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Starting comprehensive database seed...');
  console.log('═'.repeat(60));

  // ============================================
  // 1. SUBSCRIPTION PLANS (3 plans)
  // ============================================
  console.log('📦 [1/18] Creating subscription plans...');

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
        interval: 'MONTH',
        features: JSON.stringify({ users: 3, projects: 5, storage: '1GB', support: 'email' }),
        limits: JSON.stringify({ maxUsers: 3, maxProjects: 5, maxStorage: 1073741824 }),
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
        interval: 'MONTH',
        features: JSON.stringify({ users: 10, projects: 25, storage: '10GB', support: 'priority', advancedReports: true, apiAccess: true }),
        limits: JSON.stringify({ maxUsers: 10, maxProjects: 25, maxStorage: 10737418240 }),
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
        interval: 'MONTH',
        features: JSON.stringify({ users: 'unlimited', projects: 'unlimited', storage: '100GB', support: 'dedicated', advancedReports: true, apiAccess: true, sso: true, customBranding: true }),
        limits: JSON.stringify({ maxUsers: -1, maxProjects: -1, maxStorage: 107374182400 }),
        isActive: true,
        sortOrder: 3,
      },
    }),
  ]);
  console.log(`   ✅ ${plans.length} plans created`);

  // ============================================
  // 2. ORGANIZATION
  // ============================================
  console.log('🏢 [2/18] Creating demo organization...');

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
      planId: plans[2].id,
    },
  });
  console.log(`   ✅ Organization: ${organization.name}`);

  // ============================================
  // 3. USERS (8 total: 1 admin + 7 demo)
  // ============================================
  console.log('👥 [3/18] Creating users...');

  const adminPassword = await hashPassword('Admin@123456');
  const userPassword = await hashPassword('Demo@123456');

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@blueprint.dev' },
    update: {},
    create: {
      email: 'admin@blueprint.dev',
      username: 'admin',
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  // Manager
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@demo-construction.com' },
    update: {},
    create: {
      email: 'manager@demo-construction.com',
      username: 'ahmed_manager',
      fullName: 'Ahmed Al-Rashid',
      role: 'MANAGER',
      jobTitle: 'Project Manager',
      department: 'Projects',
      password: userPassword,
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  // Engineer
  const engineerUser = await prisma.user.upsert({
    where: { email: 'engineer@demo-construction.com' },
    update: {},
    create: {
      email: 'engineer@demo-construction.com',
      username: 'sara_engineer',
      fullName: 'Sara Al-Mansouri',
      role: 'ENGINEER',
      jobTitle: 'Senior Engineer',
      department: 'Engineering',
      password: userPassword,
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  // Accountant
  const accountantUser = await prisma.user.upsert({
    where: { email: 'accountant@demo-construction.com' },
    update: {},
    create: {
      email: 'accountant@demo-construction.com',
      username: 'mohammed_accountant',
      fullName: 'Mohammed Al-Farsi',
      role: 'ACCOUNTANT',
      jobTitle: 'Chief Accountant',
      department: 'Finance',
      password: userPassword,
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  // Viewer
  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@demo-construction.com' },
    update: {},
    create: {
      email: 'viewer@demo-construction.com',
      username: 'fatima_viewer',
      fullName: 'Fatima Al-Hassan',
      role: 'VIEWER',
      jobTitle: 'Executive Assistant',
      department: 'Administration',
      password: userPassword,
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  // NEW: Draftsman
  const draftsmanUser = await prisma.user.upsert({
    where: { email: 'draftsman@demo-construction.com' },
    update: {},
    create: {
      email: 'draftsman@demo-construction.com',
      username: 'ali_draftsman',
      fullName: 'Ali Al-Shamsi',
      role: 'DRAFTSMAN',
      jobTitle: 'Senior Draftsman',
      department: 'Drafting',
      password: userPassword,
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  // NEW: Project Manager
  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@demo-construction.com' },
    update: {},
    create: {
      email: 'pm@demo-construction.com',
      username: 'khalid_pm',
      fullName: 'Khalid Al-Mansoor',
      role: 'PROJECT_MANAGER',
      jobTitle: 'Project Manager',
      department: 'Projects',
      password: userPassword,
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  // NEW: Secretary
  const secretaryUser = await prisma.user.upsert({
    where: { email: 'secretary@demo-construction.com' },
    update: {},
    create: {
      email: 'secretary@demo-construction.com',
      username: 'noor_secretary',
      fullName: 'Noor Al-Zaabi',
      role: 'SECRETARY',
      jobTitle: 'Office Secretary',
      department: 'Administration',
      password: userPassword,
      isActive: true,
      emailVerified: new Date(),
      organizationId: organization.id,
      language: 'ar',
      theme: 'dark',
    },
  });

  console.log(`   ✅ 8 users created (Admin + 7 demo roles)`);

  // ============================================
  // 4. CLIENTS (3)
  // ============================================
  console.log('📁 [4/18] Creating clients...');

  const client1 = await prisma.client.upsert({
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
  });

  const client2 = await prisma.client.upsert({
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
  });

  const client3 = await prisma.client.upsert({
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
  });

  console.log(`   ✅ 3 clients created`);

  // ============================================
  // 5. PROJECTS (3 with enhanced fields)
  // ============================================
  console.log('🏗️ [5/18] Creating projects...');

  const project1 = await prisma.project.upsert({
    where: { projectNumber: 'PRJ-2025-0001' },
    update: {},
    create: {
      projectNumber: 'PRJ-2025-0001',
      name: 'برج الأعمال - المرحلة الأولى',
      location: 'دبي مارينا، دبي',
      projectType: 'تجاري',
      status: 'ACTIVE',
      progressPercentage: 45,
      description: 'برج تجاري من 40 طابق مع موقف سيارات تحت الأرض',
      contractValue: 85000000,
      contractDate: new Date('2024-06-15'),
      expectedStartDate: new Date('2024-07-01'),
      expectedEndDate: new Date('2026-06-30'),
      actualStartDate: new Date('2024-07-15'),
      plotNumber: 'DN-4521',
      customerFileNumber: 'CF-2024-0891',
      visitDate: new Date('2024-06-20'),
      paymentReceived: 25000000,
      remainingBalance: 60000000,
      managerId: adminUser.id,
      clientId: client1.id,
      budget: 82000000,
      governmentApprovalStatus: 'SUBMITTED',
      electricalStatus: 'IN_PROGRESS',
      organizationId: organization.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { projectNumber: 'PRJ-2025-0002' },
    update: {},
    create: {
      projectNumber: 'PRJ-2025-0002',
      name: 'مجمع سكني - الواحة',
      location: 'الواحة، أبوظبي',
      projectType: 'سكني',
      status: 'ACTIVE',
      progressPercentage: 25,
      description: 'مجمع سكني يحتوي على 200 وحدة سكنية مع مرافق ترفيهية',
      contractValue: 120000000,
      contractDate: new Date('2024-09-01'),
      expectedStartDate: new Date('2024-10-01'),
      expectedEndDate: new Date('2027-03-31'),
      actualStartDate: new Date('2024-10-15'),
      plotNumber: 'AD-7834',
      customerFileNumber: 'CF-2024-1205',
      visitDate: new Date('2024-09-10'),
      paymentReceived: 30000000,
      remainingBalance: 90000000,
      managerId: adminUser.id,
      clientId: client2.id,
      budget: 115000000,
      governmentApprovalStatus: 'PENDING',
      organizationId: organization.id,
    },
  });

  const project3 = await prisma.project.upsert({
    where: { projectNumber: 'PRJ-2025-0003' },
    update: {},
    create: {
      projectNumber: 'PRJ-2025-0003',
      name: 'مركز تسوق النخيل',
      location: 'النخلة، الشارقة',
      projectType: 'تجاري',
      status: 'PENDING',
      progressPercentage: 0,
      description: 'مركز تسوق متعدد الطوابق مع سينما ومنطقة ترفيه',
      contractValue: 45000000,
      contractDate: new Date('2025-01-10'),
      expectedStartDate: new Date('2025-02-01'),
      expectedEndDate: new Date('2026-08-31'),
      plotNumber: 'SH-2156',
      customerFileNumber: 'CF-2025-0034',
      visitDate: new Date('2025-01-15'),
      managerId: adminUser.id,
      clientId: client3.id,
      budget: 43000000,
      governmentApprovalStatus: 'PENDING',
      organizationId: organization.id,
    },
  });

  console.log(`   ✅ 3 projects created (with plotNumber, fileNumber, payments)`);

  // ============================================
  // 6. WORKFLOW PHASES (CRITICAL - 46 total)
  // ============================================
  console.log('📊 [6/18] Creating workflow phases...');

  // ─── PROJECT 1: ARCHITECTURAL phases (order 1-8) ───
  const p1ArchSketch = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'ARCHITECTURAL_SKETCH', phaseCategory: 'ARCHITECTURAL',
      status: 'COMPLETED', startDate: daysAgo(90), endDate: daysAgo(86),
      slaDays: 4, assignedToId: engineerUser.id, order: 1,
    },
  });
  const p1ArchConcept = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'ARCHITECTURAL_CONCEPT', phaseCategory: 'ARCHITECTURAL',
      status: 'COMPLETED', startDate: daysAgo(86), endDate: daysAgo(83),
      slaDays: 3, assignedToId: engineerUser.id, dependsOnId: p1ArchSketch.id, order: 2,
    },
  });
  const p1DesignDev = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'DESIGN_DEVELOPMENT', phaseCategory: 'ARCHITECTURAL',
      status: 'COMPLETED', startDate: daysAgo(83), endDate: daysAgo(77),
      slaDays: 6, assignedToId: engineerUser.id, dependsOnId: p1ArchConcept.id,
      rejectionCount: 1, order: 3,
    },
  });
  const p1ThreeD = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'THREE_D_MODEL', phaseCategory: 'ARCHITECTURAL',
      status: 'COMPLETED', startDate: daysAgo(77), endDate: daysAgo(71),
      slaDays: 6, assignedToId: engineerUser.id, dependsOnId: p1DesignDev.id, order: 4,
    },
  });
  const p1ClientApproval = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'CLIENT_APPROVAL', phaseCategory: 'ARCHITECTURAL',
      status: 'COMPLETED', startDate: daysAgo(71), endDate: daysAgo(64),
      slaDays: 7, dependsOnId: p1ThreeD.id, order: 5,
    },
  });
  const p1ConstDrawings = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'CONSTRUCTION_DRAWINGS', phaseCategory: 'ARCHITECTURAL',
      status: 'IN_PROGRESS', startDate: daysAgo(10),
      slaDays: 10, assignedToId: engineerUser.id, draftAssignedToId: draftsmanUser.id,
      draftStartDate: daysAgo(10), dependsOnId: p1ClientApproval.id, order: 6,
    },
  });
  const p1FinalDrawings = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'FINAL_DRAWINGS', phaseCategory: 'ARCHITECTURAL',
      status: 'NOT_STARTED', slaDays: 5, assignedToId: engineerUser.id,
      draftAssignedToId: draftsmanUser.id, dependsOnId: p1ConstDrawings.id, order: 7,
    },
  });
  const p1DraftingReview = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'DRAFTING_REVIEW', phaseCategory: 'ARCHITECTURAL',
      status: 'NOT_STARTED', slaDays: 3, assignedToId: engineerUser.id,
      draftAssignedToId: draftsmanUser.id, dependsOnId: p1FinalDrawings.id, order: 8,
    },
  });

  // ─── PROJECT 1: STRUCTURAL phases (order 10-18) ───
  const p1SoilReport = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'SOIL_REPORT', phaseCategory: 'STRUCTURAL',
      status: 'COMPLETED', startDate: daysAgo(85), endDate: daysAgo(80),
      slaDays: 5, assignedToId: engineerUser.id, order: 10,
    },
  });
  const p1Foundation = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'FOUNDATION_DESIGN', phaseCategory: 'STRUCTURAL',
      status: 'COMPLETED', startDate: daysAgo(80), endDate: daysAgo(76),
      slaDays: 4, assignedToId: engineerUser.id, dependsOnId: p1SoilReport.id, order: 11,
    },
  });
  const p1BeamDesign = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'BEAM_DESIGN', phaseCategory: 'STRUCTURAL',
      status: 'IN_PROGRESS', startDate: daysAgo(5),
      slaDays: 3, assignedToId: engineerUser.id, draftAssignedToId: draftsmanUser.id,
      dependsOnId: p1Foundation.id, order: 12,
    },
  });
  const p1ColumnDesign = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'COLUMN_DESIGN', phaseCategory: 'STRUCTURAL',
      status: 'IN_PROGRESS', startDate: daysAgo(3),
      slaDays: 3, assignedToId: engineerUser.id, draftAssignedToId: draftsmanUser.id,
      dependsOnId: p1Foundation.id, order: 13,
    },
  });
  const p1SlabDesign = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'SLAB_DESIGN', phaseCategory: 'STRUCTURAL',
      status: 'NOT_STARTED', slaDays: 2, assignedToId: engineerUser.id,
      dependsOnId: p1BeamDesign.id, order: 14,
    },
  });
  const p1StaircaseDesign = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'STAIRCASE_DESIGN', phaseCategory: 'STRUCTURAL',
      status: 'NOT_STARTED', slaDays: 2, assignedToId: engineerUser.id,
      draftAssignedToId: draftsmanUser.id, dependsOnId: p1BeamDesign.id, order: 15,
    },
  });
  const p1StructDetails = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'STRUCTURAL_DETAILS', phaseCategory: 'STRUCTURAL',
      status: 'NOT_STARTED', slaDays: 3, assignedToId: engineerUser.id,
      draftAssignedToId: draftsmanUser.id, dependsOnId: p1ColumnDesign.id, order: 16,
    },
  });
  const p1EtabsModeling = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'ETABS_MODELING', phaseCategory: 'STRUCTURAL',
      status: 'NOT_STARTED', slaDays: 5, assignedToId: engineerUser.id,
      dependsOnId: p1SlabDesign.id, order: 17,
    },
  });
  const p1StructCalcs = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'STRUCTURAL_CALCULATIONS', phaseCategory: 'STRUCTURAL',
      status: 'NOT_STARTED', slaDays: 4, assignedToId: engineerUser.id,
      dependsOnId: p1EtabsModeling.id, order: 18,
    },
  });

  // ─── PROJECT 1: MEP phases (order 20-28) ───
  const p1ElectricalDesign = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'ELECTRICAL_DESIGN', phaseCategory: 'MEP',
      status: 'IN_PROGRESS', startDate: daysAgo(7),
      slaDays: 4, assignedToId: engineerUser.id, order: 20,
    },
  });
  const p1AcCalcs = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'AC_CALCULATIONS', phaseCategory: 'MEP',
      status: 'NOT_STARTED', slaDays: 7, assignedToId: engineerUser.id,
      dependsOnId: p1ElectricalDesign.id, order: 21,
    },
  });
  const p1DrainageDesign = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'DRAINAGE_DESIGN', phaseCategory: 'MEP',
      status: 'NOT_STARTED', slaDays: 2, assignedToId: engineerUser.id,
      dependsOnId: p1ElectricalDesign.id, order: 22,
    },
  });
  const p1WaterSupply = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'WATER_SUPPLY_DESIGN', phaseCategory: 'MEP',
      status: 'NOT_STARTED', slaDays: 3, assignedToId: engineerUser.id,
      dependsOnId: p1DrainageDesign.id, order: 23,
    },
  });
  const p1EtisalatDesign = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'ETISALAT_DESIGN', phaseCategory: 'MEP',
      status: 'NOT_STARTED', slaDays: 2, assignedToId: engineerUser.id,
      dependsOnId: p1ElectricalDesign.id, order: 24,
    },
  });
  const p1FewaApproval = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'FEWA_APPROVAL', phaseCategory: 'MEP',
      status: 'NOT_STARTED', slaDays: 6, order: 25,
      notes: 'إلزامي - موافقة هيئة كهرباء ومياه',
    },
  });
  const p1CivilDefenseDesign = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'CIVIL_DEFENSE_DESIGN', phaseCategory: 'MEP',
      status: 'NOT_STARTED', slaDays: 5, assignedToId: engineerUser.id, order: 26,
    },
  });
  const p1CivilDefenseApproval = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'CIVIL_DEFENSE_APPROVAL', phaseCategory: 'MEP',
      status: 'NOT_STARTED', slaDays: 7, order: 27,
      notes: 'إلزامي - موافقة الدفاع المدني',
    },
  });
  const p1MepCoordination = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'MEP_COORDINATION', phaseCategory: 'MEP',
      status: 'NOT_STARTED', slaDays: 3, assignedToId: engineerUser.id,
      dependsOnId: p1CivilDefenseDesign.id, order: 28,
    },
  });

  // ─── PROJECT 1: GOVERNMENT phases (order 30-37) ───
  const p1DocCollection = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'DOCUMENT_COLLECTION', phaseCategory: 'GOVERNMENT',
      status: 'COMPLETED', startDate: daysAgo(60), endDate: daysAgo(54),
      slaDays: 6, assignedToId: secretaryUser.id, order: 30,
    },
  });
  const p1FileOpening = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'FILE_OPENING', phaseCategory: 'GOVERNMENT',
      status: 'COMPLETED', startDate: daysAgo(54), endDate: daysAgo(51),
      slaDays: 3, assignedToId: secretaryUser.id, dependsOnId: p1DocCollection.id, order: 31,
    },
  });
  const p1DrawingSubmission = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'DRAWING_SUBMISSION', phaseCategory: 'GOVERNMENT',
      status: 'IN_PROGRESS', startDate: daysAgo(2),
      slaDays: 1, assignedToId: secretaryUser.id, dependsOnId: p1FileOpening.id, order: 32,
    },
  });
  const p1MunicipalityReview = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'MUNICIPALITY_REVIEW', phaseCategory: 'GOVERNMENT',
      status: 'NOT_STARTED', slaDays: 10, dependsOnId: p1DrawingSubmission.id, order: 33,
    },
  });
  const p1RejectionHandling = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'REJECTION_HANDLING', phaseCategory: 'GOVERNMENT',
      status: 'NOT_STARTED', slaDays: 5, assignedToId: engineerUser.id,
      dependsOnId: p1MunicipalityReview.id, order: 34,
    },
  });
  const p1Demarcation = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'DEMARCATION_LEVELING', phaseCategory: 'GOVERNMENT',
      status: 'NOT_STARTED', slaDays: 2, order: 35,
    },
  });
  const p1ContractorSelection = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'CONTRACTOR_SELECTION', phaseCategory: 'GOVERNMENT',
      status: 'NOT_STARTED', slaDays: 12, assignedToId: pmUser.id,
      dependsOnId: p1Demarcation.id, order: 36,
    },
  });
  const p1LicenseIssuance = await prisma.workflowPhase.create({
    data: {
      projectId: project1.id, phaseType: 'LICENSE_ISSUANCE', phaseCategory: 'GOVERNMENT',
      status: 'NOT_STARTED', slaDays: 7, dependsOnId: p1ContractorSelection.id, order: 37,
    },
  });

  console.log(`   ✅ Project 1: 33 phases (8 Arch + 9 Struct + 9 MEP + 8 Gov)`);

  // ─── PROJECT 2 PHASES (ACTIVE 25% - early stages) ───
  const p2ArchSketch = await prisma.workflowPhase.create({
    data: {
      projectId: project2.id, phaseType: 'ARCHITECTURAL_SKETCH', phaseCategory: 'ARCHITECTURAL',
      status: 'COMPLETED', startDate: daysAgo(45), endDate: daysAgo(41),
      slaDays: 4, assignedToId: engineerUser.id, order: 1,
    },
  });
  const p2ArchConcept = await prisma.workflowPhase.create({
    data: {
      projectId: project2.id, phaseType: 'ARCHITECTURAL_CONCEPT', phaseCategory: 'ARCHITECTURAL',
      status: 'COMPLETED', startDate: daysAgo(41), endDate: daysAgo(38),
      slaDays: 3, assignedToId: engineerUser.id, dependsOnId: p2ArchSketch.id, order: 2,
    },
  });
  await prisma.workflowPhase.create({
    data: {
      projectId: project2.id, phaseType: 'DESIGN_DEVELOPMENT', phaseCategory: 'ARCHITECTURAL',
      status: 'IN_PROGRESS', startDate: daysAgo(5),
      slaDays: 6, assignedToId: engineerUser.id, dependsOnId: p2ArchConcept.id, order: 3,
    },
  });
  const p2SoilReport = await prisma.workflowPhase.create({
    data: {
      projectId: project2.id, phaseType: 'SOIL_REPORT', phaseCategory: 'STRUCTURAL',
      status: 'COMPLETED', startDate: daysAgo(40), endDate: daysAgo(35),
      slaDays: 5, assignedToId: engineerUser.id, order: 10,
    },
  });
  await prisma.workflowPhase.create({
    data: {
      projectId: project2.id, phaseType: 'FOUNDATION_DESIGN', phaseCategory: 'STRUCTURAL',
      status: 'IN_PROGRESS', startDate: daysAgo(3),
      slaDays: 4, assignedToId: engineerUser.id, draftAssignedToId: draftsmanUser.id,
      dependsOnId: p2SoilReport.id, order: 11,
    },
  });

  console.log(`   ✅ Project 2: 5 phases (3 Arch + 2 Struct)`);

  // ─── PROJECT 3 PHASES (PENDING 0% - earliest stage) ───
  const p3ArchSketch = await prisma.workflowPhase.create({
    data: {
      projectId: project3.id, phaseType: 'ARCHITECTURAL_SKETCH', phaseCategory: 'ARCHITECTURAL',
      status: 'IN_PROGRESS', startDate: daysAgo(2),
      slaDays: 4, assignedToId: engineerUser.id, order: 1,
    },
  });

  const p3ArchNotStarted = [
    'ARCHITECTURAL_CONCEPT', 'DESIGN_DEVELOPMENT', 'THREE_D_MODEL', 'CLIENT_APPROVAL',
    'CONSTRUCTION_DRAWINGS', 'FINAL_DRAWINGS', 'DRAFTING_REVIEW',
  ];
  for (let i = 0; i < p3ArchNotStarted.length; i++) {
    await prisma.workflowPhase.create({
      data: {
        projectId: project3.id,
        phaseType: p3ArchNotStarted[i],
        phaseCategory: 'ARCHITECTURAL',
        status: 'NOT_STARTED',
        order: i + 2,
      },
    });
  }

  console.log(`   ✅ Project 3: 8 phases (1 In Progress + 7 Not Started)`);

  // ============================================
  // 7. CLIENT INTERACTIONS (3 for Project 1)
  // ============================================
  console.log('💬 [7/18] Creating client interactions...');

  await prisma.clientInteraction.create({
    data: {
      projectId: project1.id,
      phaseId: p1ArchConcept.id,
      interactionType: 'APPROVE',
      content: 'تمت الموافقة على التصميم المفاهيمي من قبل العميل بدون ملاحظات إضافية',
      respondedById: managerUser.id,
      responseContent: 'شكراً لكم، نتطلع للمتابعة مع المرحلة التالية',
      responseDate: daysAgo(82),
    },
  });

  await prisma.clientInteraction.create({
    data: {
      projectId: project1.id,
      phaseId: p1DesignDev.id,
      interactionType: 'REJECT',
      content: 'العميل يطلب تعديلات على واجهات المبنى - يفضل واجهة زجاجية حديثة بدلاً من الحجر الطبيعي',
      respondedById: engineerUser.id,
      responseContent: 'تم إعداد المخططات المعدلة حسب طلب العميل',
      responseDate: daysAgo(78),
    },
  });

  await prisma.clientInteraction.create({
    data: {
      projectId: project1.id,
      phaseId: p1ClientApproval.id,
      interactionType: 'APPROVE',
      content: 'الموافقة على نهج المخططات التنفيذية والمواصفات المقترحة',
      respondedById: pmUser.id,
      responseContent: 'ممتاز، سنتابع مع فريق التصميم',
      responseDate: daysAgo(65),
    },
  });

  console.log(`   ✅ 3 client interactions (1 approve, 1 reject, 1 approve)`);

  // ============================================
  // 8. MUNICIPALITY CORRESPONDENCE (4 total)
  // ============================================
  console.log('🏛️ [8/18] Creating municipality correspondence...');

  await prisma.municipalityCorrespondence.create({
    data: {
      projectId: project1.id,
      correspondenceType: 'SUBMISSION',
      referenceNumber: 'DM-2025-4521',
      submissionDate: daysAgo(30),
      responseDate: daysAgo(20),
      subject: 'تقديم المخططات المعمارية للبرج التجاري',
      content: 'تقديم كامل المخططات المعمارية والإنشائية للمراجعة البلدية',
      notes: 'تم التقديم عبر النظام الإلكتروني للبلدية',
      status: 'APPROVED',
      responseNotes: 'تمت الموافقة مع ملاحظات طفيفة على مواقف السيارات',
      createdById: secretaryUser.id,
      attachments: JSON.stringify(['arch-drawings-set-A.pdf', 'structural-drawings.pdf', 'site-plan.pdf']),
    },
  });

  await prisma.municipalityCorrespondence.create({
    data: {
      projectId: project1.id,
      correspondenceType: 'INQUIRY',
      submissionDate: daysAgo(18),
      responseDate: daysAgo(14),
      subject: 'استفسار عن متطلبات إضافية للترخيص',
      content: 'استفسار بخصوص متطلبات مواقف السيارات ومعايير السلامة الجديدة',
      notes: 'تم التواصل هاتفياً مع البلدية أولاً',
      status: 'APPROVED',
      responseNotes: 'يرجى الالتزام بالمعايير المحدثة لمواقف السيارات',
      createdById: pmUser.id,
    },
  });

  await prisma.municipalityCorrespondence.create({
    data: {
      projectId: project1.id,
      correspondenceType: 'SUBMISSION',
      referenceNumber: 'DM-2025-4522',
      submissionDate: daysAgo(3),
      subject: 'تقديم المخططات الإنشائية - المرحلة الثانية',
      content: 'تقديم المخططات الإنشائية المحدثة بعد تعديل واجهات المبنى',
      notes: 'تم التعديل بناءً على ملاحظات البلدية السابقة',
      status: 'UNDER_REVIEW',
      createdById: secretaryUser.id,
      attachments: JSON.stringify(['structural-drawings-rev-B.pdf', 'calculation-report.pdf']),
    },
  });

  await prisma.municipalityCorrespondence.create({
    data: {
      projectId: project2.id,
      correspondenceType: 'INQUIRY',
      submissionDate: daysAgo(7),
      subject: 'استفسار إلى بلدية أبوظبي عن متطلبات الترخيص',
      content: 'استفسار عن المتطلبات الجديدة للمجمعات السكنية في أبوظبي',
      notes: 'في انتظار الرد من البلدية',
      status: 'PENDING',
      createdById: pmUser.id,
    },
  });

  console.log(`   ✅ 4 municipality correspondence records`);

  // ============================================
  // 9. PROJECT TEMPLATES (4 with tasks)
  // ============================================
  console.log('📋 [9/18] Creating project templates...');

  // Template 1: Architecture Department
  const archTemplate = await prisma.projectTemplate.create({
    data: {
      name: 'Architecture Department',
      nameAr: 'قسم العمارة',
      code: 'ARCH_DEPT',
      description: 'Template for architecture department workflow',
      descriptionAr: 'قالب سير عمل قسم العمارة',
      category: 'architecture',
      estimatedDays: 43,
      sortOrder: 1,
    },
  });

  const archTasks = [
    { taskName: 'Schematic Design', taskNameAr: 'التصميم التخطيطي', slaDays: 4, order: 1 },
    { taskName: 'Client Approval Concept', taskNameAr: 'موافقة العميل على المفهوم', slaDays: 3, order: 2 },
    { taskName: 'Modification', taskNameAr: 'التعديلات', slaDays: 4, order: 3 },
    { taskName: 'Letter of Intent', taskNameAr: 'خطاب نوايا', slaDays: 1, order: 4 },
    { taskName: 'Preliminary Drawings', taskNameAr: 'المخططات التمهيدية', slaDays: 6, order: 5 },
    { taskName: 'Client Approval Preliminary', taskNameAr: 'موافقة العميل على التمهيدي', slaDays: 7, order: 6 },
    { taskName: 'Design Contract', taskNameAr: 'عقد التصميم', slaDays: 1, order: 7 },
    { taskName: 'Green Building Checklist', taskNameAr: 'قائمة المباني الخضراء', slaDays: 1, order: 8 },
    { taskName: '3D MAX Exterior', taskNameAr: 'تصميم ثلاثي الأبعاد للواجهات', slaDays: 6, order: 9 },
    { taskName: 'Green Building Calculations', taskNameAr: 'حسابات المباني الخضراء', slaDays: 10, order: 10 },
  ];
  for (const t of archTasks) {
    await prisma.projectTemplateTask.create({
      data: { templateId: archTemplate.id, ...t },
    });
  }

  // Template 2: Structure Department
  const structTemplate = await prisma.projectTemplate.create({
    data: {
      name: 'Structure Department',
      nameAr: 'قسم الإنشاءات',
      code: 'STRUCT_DEPT',
      description: 'Template for structure department workflow',
      descriptionAr: 'قالب سير عمل قسم الإنشاءات',
      category: 'structural',
      estimatedDays: 43,
      sortOrder: 2,
    },
  });

  const structTasks = [
    { taskName: 'Foundation', taskNameAr: 'الأساسات', slaDays: 4, order: 1 },
    { taskName: 'T.B (Transfer Beams)', taskNameAr: 'الروافد الانتقالية', slaDays: 3, order: 2 },
    { taskName: 'Columns', taskNameAr: 'الأعمدة', slaDays: 3, order: 3 },
    { taskName: 'Slab', taskNameAr: 'البلاطات', slaDays: 2, order: 4 },
    { taskName: 'Structural Details', taskNameAr: 'التفاصيل الإنشائية', slaDays: 3, order: 5 },
    { taskName: 'Checklist', taskNameAr: 'قائمة الفحص', slaDays: 4, order: 6 },
    { taskName: 'ETAB Modeling', taskNameAr: 'نمذجة ETABS', slaDays: 5, order: 7 },
    { taskName: 'ETAB Calculations', taskNameAr: 'حسابات ETABS', slaDays: 4, order: 8 },
    { taskName: 'Soil Report', taskNameAr: 'تقرير التربة', slaDays: 5, order: 9 },
    { taskName: 'Municipality Approval', taskNameAr: 'موافقة البلدية', slaDays: 10, order: 10, governmentEntity: 'Dubai Municipality', governmentEntityAr: 'بلدية دبي' },
  ];
  for (const t of structTasks) {
    await prisma.projectTemplateTask.create({
      data: { templateId: structTemplate.id, ...t },
    });
  }

  // Template 3: Electrical Department
  const elecTemplate = await prisma.projectTemplate.create({
    data: {
      name: 'Electrical Department',
      nameAr: 'قسم الكهرباء',
      code: 'ELEC_DEPT',
      description: 'Template for electrical/MEP department workflow',
      descriptionAr: 'قالب سير عمل قسم الكهرباء',
      category: 'mep',
      estimatedDays: 43,
      sortOrder: 3,
    },
  });

  const elecTasks = [
    { taskName: 'NOC', taskNameAr: 'خطاب عدم ممانعة', slaDays: 5, order: 1, governmentEntity: 'FEWA', governmentEntityAr: 'هيئة كهرباء ومياه' },
    { taskName: 'Electrical Design', taskNameAr: 'التصميم الكهربائي', slaDays: 4, order: 2 },
    { taskName: 'Drainage', taskNameAr: 'الصرف الصحي', slaDays: 2, order: 3 },
    { taskName: 'Etisalat', taskNameAr: 'اتصالات', slaDays: 2, order: 4, governmentEntity: 'Etisalat', governmentEntityAr: 'اتصالات' },
    { taskName: 'AC Calculations', taskNameAr: 'حسابات التكييف', slaDays: 7, order: 5 },
    { taskName: 'Flush & Flow', taskNameAr: 'السباكة', slaDays: 1, order: 6 },
    { taskName: 'FEWA Approval', taskNameAr: 'موافقة هيئة كهرباء ومياه', slaDays: 6, order: 7, governmentEntity: 'FEWA', governmentEntityAr: 'هيئة كهرباء ومياه', isMandatory: true },
    { taskName: 'Etisalat Approval', taskNameAr: 'موافقة اتصالات', slaDays: 4, order: 8, governmentEntity: 'Etisalat', governmentEntityAr: 'اتصالات' },
    { taskName: 'Civil Defense Design', taskNameAr: 'تصميم الدفاع المدني', slaDays: 5, order: 9, governmentEntity: 'Civil Defense', governmentEntityAr: 'الدفاع المدني' },
    { taskName: 'Civil Defense Approval', taskNameAr: 'موافقة الدفاع المدني', slaDays: 7, order: 10, governmentEntity: 'Civil Defense', governmentEntityAr: 'الدفاع المدني', isMandatory: true },
  ];
  for (const t of elecTasks) {
    await prisma.projectTemplateTask.create({
      data: { templateId: elecTemplate.id, ...t },
    });
  }

  // Template 4: Government Department
  const govTemplate = await prisma.projectTemplate.create({
    data: {
      name: 'Government Department',
      nameAr: 'قسم الحكومية',
      code: 'GOV_DEPT',
      description: 'Template for government approvals workflow',
      descriptionAr: 'قالب سير عمل قسم الحكومية',
      category: 'municipality',
      estimatedDays: 43,
      sortOrder: 4,
    },
  });

  const govTasks = [
    { taskName: 'Document Collection', taskNameAr: 'جمع المستندات', slaDays: 6, order: 1 },
    { taskName: 'File Opening', taskNameAr: 'فتح ملف', slaDays: 3, order: 2 },
    { taskName: 'Case Creation', taskNameAr: 'إنشاء معاملة', slaDays: 1, order: 3 },
    { taskName: 'Drawing Submission', taskNameAr: 'تقديم المخططات', slaDays: 1, order: 4, governmentEntity: 'Dubai Municipality', governmentEntityAr: 'بلدية دبي' },
    { taskName: 'Rejection Handling', taskNameAr: 'معالجة الرفض', slaDays: 5, order: 5 },
    { taskName: 'Arch-Struct Approval', taskNameAr: 'موافقة عمارة وإنشاءات', slaDays: 10, order: 6, governmentEntity: 'Dubai Municipality', governmentEntityAr: 'بلدية دبي' },
    { taskName: 'Electrical-Drainage Approval', taskNameAr: 'موافقة كهرباء وصرف', slaDays: 3, order: 7 },
    { taskName: 'Demarcation', taskNameAr: 'التحديد والترتيب', slaDays: 2, order: 8 },
    { taskName: 'Contractor Selection', taskNameAr: 'اختيار المقاول', slaDays: 12, order: 9 },
    { taskName: 'License', taskNameAr: 'رخصة البناء', slaDays: 7, order: 10, governmentEntity: 'Dubai Municipality', governmentEntityAr: 'بلدية دبي' },
  ];
  for (const t of govTasks) {
    await prisma.projectTemplateTask.create({
      data: { templateId: govTemplate.id, ...t },
    });
  }

  console.log(`   ✅ 4 templates with 40 total tasks (10 each)`);

  // ============================================
  // 10. TASKS (12 total: 4 existing + 8 new)
  // ============================================
  console.log('✅ [10/18] Creating tasks...');

  // Existing 4 tasks
  await prisma.task.create({
    data: {
      title: 'مراجعة المخططات التنفيذية',
      description: 'مراجعة جميع المخططات التنفيذية للمشروع',
      projectId: project1.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 60,
      dueDate: daysFromNow(15),
    },
  });

  await prisma.task.create({
    data: {
      title: 'إعداد جدول العمل',
      description: 'إعداد جدول العمل للمرحلة القادمة',
      projectId: project1.id,
      priority: 'MEDIUM',
      status: 'TODO',
      progress: 0,
      dueDate: daysFromNow(20),
    },
  });

  await prisma.task.create({
    data: {
      title: 'تقييم الموردين',
      description: 'تقييم العروض المقدمة من الموردين',
      projectId: project2.id,
      priority: 'HIGH',
      status: 'DONE',
      progress: 100,
      dueDate: daysAgo(5),
    },
  });

  await prisma.task.create({
    data: {
      title: 'الحصول على التصاريح',
      description: 'استكمال إجراءات التصاريح البلدية',
      projectId: project3.id,
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      progress: 30,
      dueDate: daysFromNow(10),
    },
  });

  // NEW: 8 additional tasks
  const municipalityReviewTask = await prisma.task.create({
    data: {
      title: 'تصميم المخططات المعمارية',
      description: 'إعداد المخططات المعمارية النهائية للتقديم للبلدية',
      projectId: project1.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 45,
      dueDate: daysFromNow(5),
      taskType: 'GOVERNMENTAL',
      governmentEntity: 'Dubai Municipality',
      slaDays: 10,
      slaStartDate: daysAgo(8),
    },
  });

  await prisma.task.create({
    data: {
      title: 'حسابات الأحمال الكهربائية',
      description: 'إعداد حسابات الأحمال الكهربائية الكاملة للمشروع',
      projectId: project1.id,
      priority: 'HIGH',
      status: 'TODO',
      progress: 0,
      dueDate: daysFromNow(10),
      taskType: 'MANDATORY',
      governmentEntity: 'FEWA',
      slaDays: 7,
      isMandatory: true,
    },
  });

  await prisma.task.create({
    data: {
      title: 'موافقة الدفاع المدني',
      description: 'الحصول على موافقة الدفاع المدني لأنظمة الإطفاء والسلامة',
      projectId: project1.id,
      priority: 'URGENT',
      status: 'TODO',
      progress: 0,
      dueDate: daysFromNow(20),
      taskType: 'GOVERNMENTAL',
      governmentEntity: 'Civil Defense',
      slaDays: 14,
    },
  });

  await prisma.task.create({
    data: {
      title: 'تصميم نظام إطفاء الحريق',
      description: 'تصميم نظام إطفاء الحريق حسب متطلبات الدفاع المدني',
      projectId: project1.id,
      priority: 'HIGH',
      status: 'TODO',
      progress: 0,
      dueDate: daysFromNow(8),
      taskType: 'MANDATORY',
      governmentEntity: 'Civil Defense',
      slaDays: 5,
      isMandatory: true,
    },
  });

  await prisma.task.create({
    data: {
      title: 'تقرير التربة',
      description: 'تقرير فحص التربة وتحمل الأساسات للموقع',
      projectId: project2.id,
      priority: 'MEDIUM',
      status: 'DONE',
      progress: 100,
      dueDate: daysAgo(10),
      taskType: 'STANDARD',
    },
  });

  await prisma.task.create({
    data: {
      title: 'إعداد عرض أسعار',
      description: 'إعداد عرض أسعار شامل لخدمات التصميم',
      projectId: project3.id,
      priority: 'HIGH',
      status: 'TODO',
      progress: 0,
      dueDate: daysFromNow(7),
      taskType: 'CLIENT',
    },
  });

  await prisma.task.create({
    data: {
      title: 'مراجعة مخططات الصرف',
      description: 'مراجعة مخططات الصرف الصحي والتأكد من مطابقتها للمعايير',
      projectId: project2.id,
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      progress: 35,
      dueDate: daysFromNow(5),
      taskType: 'STANDARD',
    },
  });

  await prisma.task.create({
    data: {
      title: 'تقديم طلب NOC',
      description: 'تقديم طلب عدم ممانعة إلى هيئة كهرباء ومياه',
      projectId: project1.id,
      priority: 'HIGH',
      status: 'DONE',
      progress: 100,
      dueDate: daysAgo(3),
      taskType: 'GOVERNMENTAL',
      governmentEntity: 'FEWA',
      slaDays: 5,
    },
  });

  console.log(`   ✅ 12 tasks created (4 existing + 8 new with SLA/gov types)`);

  // ============================================
  // 11. PROPOSALS (3 with items)
  // ============================================
  console.log('📝 [11/18] Creating proposals...');

  // Proposal 1: Accepted - Project 1
  const proposal1 = await prisma.proposal.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      clientId: client1.id,
      proposalNumber: 'PRO-2025-0001',
      title: 'عرض خدمات التصميم - برج الأعمال',
      issueDate: daysAgo(120),
      validUntil: daysAgo(90),
      subtotal: 850000,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 850000,
      status: 'ACCEPTED',
      notes: 'عرض شامل لخدمات التصميم المعماري والإنشائي والكهربائي',
      terms: 'المدة: 12 شهر | الدفعات: 30% مقدم، 40% عند 50%، 30% عند التسليم',
    },
  });

  await prisma.proposalItem.createMany({
    data: [
      { proposalId: proposal1.id, description: 'التصميم المعماري', quantity: 1, unitPrice: 400000, total: 400000, sortOrder: 1 },
      { proposalId: proposal1.id, description: 'التصميم الإنشائي', quantity: 1, unitPrice: 300000, total: 300000, sortOrder: 2 },
      { proposalId: proposal1.id, description: 'التصميم الكهربائي', quantity: 1, unitPrice: 150000, total: 150000, sortOrder: 3 },
    ],
  });

  // Proposal 2: Accepted - Project 2
  const proposal2 = await prisma.proposal.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      clientId: client2.id,
      proposalNumber: 'PRO-2025-0002',
      title: 'عرض خدمات التصميم - مجمع سكني',
      issueDate: daysAgo(90),
      validUntil: daysAgo(60),
      subtotal: 1200000,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 1200000,
      status: 'ACCEPTED',
      notes: 'عرض شامل لخدمات التصميم وإدارة المشاريع',
      terms: 'المدة: 18 شهر | الدفعات: 25% مقدم، 25% عند 33%، 25% عند 66%، 25% عند التسليم',
    },
  });

  await prisma.proposalItem.createMany({
    data: [
      { proposalId: proposal2.id, description: 'التصميم المعماري', quantity: 1, unitPrice: 500000, total: 500000, sortOrder: 1 },
      { proposalId: proposal2.id, description: 'التصميم الإنشائي', quantity: 1, unitPrice: 400000, total: 400000, sortOrder: 2 },
      { proposalId: proposal2.id, description: 'إدارة المشاريع', quantity: 1, unitPrice: 300000, total: 300000, sortOrder: 3 },
    ],
  });

  // Proposal 3: Sent (pending) - Project 3
  const proposal3 = await prisma.proposal.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      clientId: client3.id,
      proposalNumber: 'PRO-2025-0003',
      title: 'عرض استشاري - مركز تسوق النخيل',
      issueDate: daysAgo(14),
      validUntil: daysFromNow(16),
      subtotal: 450000,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 450000,
      status: 'SENT',
      notes: 'عرض استشاري يشمل دراسة الجدوى والتصميم',
      terms: 'المدة: 6 أشهر | الدفعات: 40% مقدم، 30% عند التسليم المرحلي، 30% نهائي',
    },
  });

  await prisma.proposalItem.createMany({
    data: [
      { proposalId: proposal3.id, description: 'دراسة الجدوى', quantity: 1, unitPrice: 100000, total: 100000, sortOrder: 1 },
      { proposalId: proposal3.id, description: 'التصميم المبدئي', quantity: 1, unitPrice: 200000, total: 200000, sortOrder: 2 },
      { proposalId: proposal3.id, description: 'التصميم التفصيلي', quantity: 1, unitPrice: 150000, total: 150000, sortOrder: 3 },
    ],
  });

  console.log(`   ✅ 3 proposals with 9 line items`);

  // ============================================
  // 12. CONTRACTS (2)
  // ============================================
  console.log('📜 [12/18] Creating contracts...');

  await prisma.contract.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      clientId: client1.id,
      contractNumber: 'CTR-2025-0001',
      title: 'عقد خدمات الاستشارات الهندسية - برج الأعمال',
      description: 'عقد شامل لخدمات الاستشارات الهندسية لتصميم البرج التجاري',
      contractType: 'CONSULTING',
      status: 'ACTIVE',
      value: 8500000,
      currency: 'AED',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2026-06-30'),
      signedDate: new Date('2024-06-28'),
      terms: '## شروط العقد\n\n1. تقديم جميع المخططات والتصاميم خلال المدة المحددة\n2. المراجعة الدورية مع العميل كل أسبوعين\n3. التعديلات المجانية محدودة بمرحلتين\n4. ضمان جودة التصميم لمدة سنة',
      createdBy: adminUser.id,
    },
  });

  await prisma.contract.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      clientId: client2.id,
      contractNumber: 'CTR-2025-0002',
      title: 'عقد التصميم - مجمع سكني',
      description: 'عقد تصميم للمجمع السكني في الواحة أبوظبي',
      contractType: 'SERVICE',
      status: 'PENDING_SIGNATURE',
      value: 12000000,
      currency: 'AED',
      startDate: new Date('2024-10-01'),
      endDate: new Date('2027-03-31'),
      terms: '## شروط العقد\n\n1. التصميم الكامل للمجمع السكني\n2. مواففات الطوابق و 200 وحدة\n3. المرافق الترفيهية المشتركة\n4. متابعة الترخيص البلدي',
      createdBy: adminUser.id,
    },
  });

  console.log(`   ✅ 2 contracts (1 Active, 1 Pending Signature)`);

  // ============================================
  // 13. DOCUMENTS (5 for Project 1)
  // ============================================
  console.log('📄 [13/18] Creating documents...');

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      documentNumber: 'DOC-001',
      title: 'المخططات المعمارية - المرحلة الأولى',
      description: 'المخططات المعمارية الكاملة للطوابق الأرضية والأولى',
      documentType: 'DRAWING',
      category: 'TECHNICAL',
      fileName: 'arch-drawings-phase1.pdf',
      filePath: '/documents/project1/arch-drawings-phase1.pdf',
      fileSize: 15420000,
      mimeType: 'application/pdf',
      version: '1.0',
      revision: 'A',
      status: 'APPROVED',
      uploadedBy: engineerUser.id,
      approvedBy: managerUser.id,
      approvedAt: daysAgo(15),
      tags: JSON.stringify(['معماري', 'مخططات', 'مرحلة-1']),
    },
  });

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      documentNumber: 'DOC-002',
      title: 'المخططات الإنشائية - القواعد',
      description: 'مخططات القواعد الخرسانية المسلحة',
      documentType: 'DRAWING',
      category: 'TECHNICAL',
      fileName: 'structural-foundation.pdf',
      filePath: '/documents/project1/structural-foundation.pdf',
      fileSize: 8750000,
      mimeType: 'application/pdf',
      version: '1.0',
      revision: 'B',
      status: 'APPROVED',
      uploadedBy: engineerUser.id,
      approvedBy: managerUser.id,
      approvedAt: daysAgo(10),
      tags: JSON.stringify(['إنشائي', 'قواعد', 'خرسانة']),
    },
  });

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      documentNumber: 'DOC-003',
      title: 'تقرير التربة',
      description: 'تقرير فحص التربة من شركة الجيوتكنيك',
      documentType: 'REPORT',
      category: 'TECHNICAL',
      fileName: 'soil-report.pdf',
      filePath: '/documents/project1/soil-report.pdf',
      fileSize: 3200000,
      mimeType: 'application/pdf',
      version: '1.0',
      revision: 'A',
      status: 'APPROVED',
      uploadedBy: pmUser.id,
      approvedBy: managerUser.id,
      approvedAt: daysAgo(25),
      tags: JSON.stringify(['تربة', 'تقرير', 'جيوتكنيك']),
    },
  });

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      documentNumber: 'DOC-004',
      title: 'مواصفات المشروع',
      description: 'مواصفات المقاولات والتشطيبات الكاملة',
      documentType: 'SPECIFICATION',
      category: 'TECHNICAL',
      fileName: 'project-specifications.docx',
      filePath: '/documents/project1/project-specifications.docx',
      fileSize: 5800000,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      version: '2.0',
      revision: 'A',
      status: 'UNDER_REVIEW',
      uploadedBy: engineerUser.id,
      tags: JSON.stringify(['مواصفات', 'تشطيبات', 'مقاولات']),
    },
  });

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      documentNumber: 'DOC-005',
      title: 'عقد التصميم',
      description: 'عقد خدمات التصميم الهندسي الموقع',
      documentType: 'CONTRACT',
      category: 'LEGAL',
      fileName: 'design-contract-signed.pdf',
      filePath: '/documents/project1/design-contract-signed.pdf',
      fileSize: 2100000,
      mimeType: 'application/pdf',
      version: '1.0',
      revision: 'A',
      status: 'APPROVED',
      uploadedBy: secretaryUser.id,
      approvedBy: adminUser.id,
      approvedAt: daysAgo(100),
      tags: JSON.stringify(['عقد', 'قانوني', 'موقع']),
    },
  });

  console.log(`   ✅ 5 documents (2 drawings, 1 report, 1 spec, 1 contract)`);

  // ============================================
  // 14. SITE REPORTS (2 for Project 1)
  // ============================================
  console.log('🚧 [14/18] Creating site reports...');

  await prisma.siteReport.create({
    data: {
      projectId: project1.id,
      reportDate: daysAgo(14),
      reportNumber: 'SR-2025-001',
      weather: 'مشمس، حار',
      temperature: 38,
      workersCount: 35,
      workDescription: 'أعمال الحفر والأساسات',
      workArea: 'الطابق الأرضي - منطقة الأساسات',
      workProgress: 15,
      issues: 'تأخر في استلام الحديد من المورد',
      safetyIssues: 'لا توجد مشاكل سلامة',
      equipmentUsed: 'حفارة كاتربيلر 320، رافعة برجية',
      materialsReceived: '50 طن حديد تسليح #16، 100 متر مكعب خرسانة',
      nextSteps: 'استكمال أعمال صب القواعد',
      nextDayPlan: 'صب 5 قواعد خرسانية إضافية',
      preparedById: pmUser.id,
      approvedById: managerUser.id,
      status: 'SUBMITTED',
      summary: 'يوم عمل جيد مع تقدم ملحوظ في أعمال الحفر',
    },
  });

  await prisma.siteReport.create({
    data: {
      projectId: project1.id,
      reportDate: daysAgo(7),
      reportNumber: 'SR-2025-002',
      weather: 'غائم جزئياً، معتدل',
      temperature: 33,
      workersCount: 42,
      workDescription: 'صب القواعد الخرسانية',
      workArea: 'الطابق الأرضي - منطقة القواعد',
      workProgress: 22,
      issues: 'لا توجد',
      safetyIssues: 'تم إجراء تدريب سلامة لعمال جدد',
      equipmentUsed: 'خلاطة خرسانة، مضخة خرسانة، رافعة برجية',
      materialsReceived: '80 متر مكعب خرسانة جاهزة، 30 طن حديد تسليح #20',
      nextSteps: 'المتابعة مع أعمال التسليح للأعمدة',
      nextDayPlan: 'بدء تسليح الأعمدة الرئيسية',
      preparedById: pmUser.id,
      approvedById: managerUser.id,
      status: 'APPROVED',
      summary: 'تقدم ممتاز في صب القواعد مع زيادة في عدد العمال',
    },
  });

  console.log(`   ✅ 2 site reports (1 submitted, 1 approved)`);

  // ============================================
  // 15. SITE VISIT REPORTS (1 for Project 1)
  // ============================================
  console.log('🔍 [15/18] Creating site visit reports...');

  await prisma.siteVisitReport.create({
    data: {
      projectId: project1.id,
      reportDate: daysAgo(30),
      plotNumber: 'DN-4521',
      clientName: client1.name,
      consultantName: organization.name,
      caseType: 'بناء جديد - برج تجاري',
      otherDescription: 'برج تجاري 40 طابق مع 3 طوابق موقف سيارات تحت الأرض',
      municipality: 'DUBAI',
      department: 'إدارة التراخيص والبناء',
      generalDescription: 'أرض فضاء محاطة بسور من الجهات الأربع، مساحة الأرض 2500 متر مربع، تقع في منطقة دبي مارينا التجارية',
      boundaryGateDescription: 'بوابة رئيسية من الحديد بعرض 4م مع بوابة جانبية للمشاة بعرض 1.2م، السور ارتفاعه 2.5م من الخرسانة المسلحة',
      neighbourSetbackDescription: 'ارتداد 3م من جميع الجهات، الجار الشرقي فيلا سكنية من 3 طوابق، الجار الغربي شارع رئيسي بعرض 12م، الجار الشمالي أرض فضاء، الجار الجنوبي مجمع سكني',
      buildingDescription: 'لا توجد مباني حالية على الأرض، تم إزالة المباني القديمة بالكامل وتم تنظيف الموقع',
      boundaryGatePhotos: JSON.stringify(['gate-photo-1.jpg', 'gate-photo-2.jpg']),
      neighbourSetbackPhotos: JSON.stringify(['setback-east.jpg', 'setback-north.jpg', 'setback-west.jpg']),
      buildingPhotos: JSON.stringify(['site-overview.jpg', 'site-north.jpg']),
      preparedById: pmUser.id,
      approvedById: managerUser.id,
      status: 'APPROVED',
      notes: 'تمت زيارة الموقع برفقة مندوب البلدية والعميل',
    },
  });

  console.log(`   ✅ 1 site visit report (Dubai Municipality)`);

  // ============================================
  // 16. SLA BREACHES (1 for Project 1)
  // ============================================
  console.log('⏰ [16/18] Creating SLA breaches...');

  await prisma.sLABreach.create({
    data: {
      taskId: municipalityReviewTask.id,
      projectId: project1.id,
      status: 'WARNING',
      daysElapsed: 8,
      slaDays: 10,
      breachDays: -2, // 2 days remaining before breach
      notifiedAt: daysAgo(1),
      notifiedUsers: JSON.stringify([adminUser.id, managerUser.id]),
      resolutionNotes: 'تم إبلاغ مدير المشروع لاتخاذ الإجراء اللازم',
    },
  });

  console.log(`   ✅ 1 SLA breach warning (8/10 days elapsed)`);

  // ============================================
  // 17. TRANSMITTALS (2 for Project 1)
  // ============================================
  console.log('📨 [17/18] Creating transmittals...');

  // Transmittal 1: To Municipality
  const transmittal1 = await prisma.transmittal.create({
    data: {
      projectId: project1.id,
      transmittalNumber: 'TR-2025-0001',
      subject: 'مخططات معمارية - Revision A',
      description: 'إرسال المخططات المعمارية المحدثة للبلدية',
      senderId: secretaryUser.id,
      recipientName: 'بلدية دبي - إدارة التراخيص',
      recipientCompany: 'Dubai Municipality',
      recipientEmail: 'permits@dubai.gov.ae',
      sendDate: daysAgo(5),
      dueDate: daysFromNow(10),
      status: 'SENT',
      priority: 'HIGH',
      deliveryMethod: 'COURIER',
      trackingNumber: 'COUR-2025-78432',
      notes: 'تم الإرسال عبر شركة البريد السريع',
    },
  });

  await prisma.transmittalItem.create({
    data: {
      transmittalId: transmittal1.id,
      documentNumber: 'DWG-ARCH-001',
      documentTitle: 'مخططات الطوابق الأرضية والأولى',
      revision: 'A',
      copies: 3,
      documentType: 'drawing',
      status: 'FOR_REVIEW',
      notes: 'مخططات مقاسة 1:100',
    },
  });

  await prisma.transmittalItem.create({
    data: {
      transmittalId: transmittal1.id,
      documentNumber: 'DWG-ARCH-002',
      documentTitle: 'مخططات الواجهات',
      revision: 'A',
      copies: 3,
      documentType: 'drawing',
      status: 'FOR_REVIEW',
    },
  });

  // Transmittal 2: To Client
  const transmittal2 = await prisma.transmittal.create({
    data: {
      projectId: project1.id,
      transmittalNumber: 'TR-2025-0002',
      subject: 'مخططات إنشائية',
      description: 'إرسال المخططات الإنشائية للمراجعة',
      senderId: engineerUser.id,
      recipientName: 'شركة البناء الحديث - خالد العمري',
      recipientCompany: client1.name,
      recipientEmail: client1.email ?? undefined,
      sendDate: daysAgo(3),
      dueDate: daysFromNow(7),
      status: 'ACKNOWLEDGED',
      priority: 'NORMAL',
      deliveryMethod: 'EMAIL',
      acknowledgedDate: daysAgo(1),
      acknowledgedBy: managerUser.id,
    },
  });

  await prisma.transmittalItem.create({
    data: {
      transmittalId: transmittal2.id,
      documentNumber: 'DWG-STR-001',
      documentTitle: 'مخططات القواعد والأعمدة',
      revision: 'B',
      copies: 2,
      documentType: 'drawing',
      status: 'FOR_INFORMATION',
      notes: 'للمراجعة والتأكيد',
    },
  });

  await prisma.transmittalItem.create({
    data: {
      transmittalId: transmittal2.id,
      documentNumber: 'RPT-STR-001',
      documentTitle: 'تقرير الحسابات الإنشائية',
      revision: 'A',
      copies: 1,
      documentType: 'calculation',
      status: 'FOR_REVIEW',
    },
  });

  console.log(`   ✅ 2 transmittals with 4 items (1 sent, 1 acknowledged)`);

  // ============================================
  // 18. RISKS (5: 3 existing + 2 new)
  // ============================================
  console.log('⚠️ [18/18] Creating risks...');

  // Existing 3 risks
  await prisma.risk.create({
    data: {
      title: 'تأخير تسليم المواد',
      description: 'خطر تأخير تسليم مواد البناء من الموردين الرئيسيين',
      projectId: project1.id,
      category: 'SCHEDULE',
      probability: 3,
      impact: 4,
      riskScore: 12,
      status: 'OPEN',
      priority: 'HIGH',
      mitigationPlan: 'التعاقد مع موردين بديلين وتخزين مخزون احتياطي',
      responseStrategy: 'MITIGATE',
    },
  });

  await prisma.risk.create({
    data: {
      title: 'ارتفاع أسعار المواد',
      description: 'التقلبات في أسعار مواد البناء الأساسية',
      projectId: project2.id,
      category: 'FINANCIAL',
      probability: 4,
      impact: 3,
      riskScore: 12,
      status: 'OPEN',
      priority: 'HIGH',
      mitigationPlan: 'تثبيت الأسعار في العقود طويلة الأجل',
      responseStrategy: 'TRANSFER',
    },
  });

  await prisma.risk.create({
    data: {
      title: 'نقص العمالة الماهرة',
      description: 'صعوبة الحصول على عمالة ماهرة للمشاريع الكبيرة',
      projectId: project1.id,
      category: 'ORGANIZATIONAL',
      probability: 2,
      impact: 3,
      riskScore: 6,
      status: 'MITIGATED',
      priority: 'MEDIUM',
      mitigationPlan: 'برامج تدريب داخلية وشراكات مع معاهد فنية',
      responseStrategy: 'MITIGATE',
    },
  });

  // NEW: 2 additional risks
  await prisma.risk.create({
    data: {
      title: 'تأخير موافقة البلدية',
      description: 'تأخير في الحصول على موافقة البلدية للمخططات المقدمة مما يؤثر على الجدول الزمني',
      projectId: project1.id,
      category: 'EXTERNAL',
      probability: 4,
      impact: 5,
      riskScore: 20,
      status: 'OPEN',
      priority: 'URGENT',
      mitigationPlan: 'التواصل المبكر مع البلدية وتقديم المستندات كاملة من أول مرة، تعيين متابع مختص',
      contingencyPlan: 'تقديم شكوى رسمية في حالة التأخير غير المبرر',
      responseStrategy: 'MITIGATE',
      owner: pmUser.id,
    },
  });

  await prisma.risk.create({
    data: {
      title: 'مشاكل في تصميم MEP',
      description: 'تعارضات بين أنظمة MEP (كهرباء، تكييف، صرف) قد تؤدي إلى أعادة التصميم',
      projectId: project1.id,
      category: 'TECHNICAL',
      probability: 3,
      impact: 4,
      riskScore: 12,
      status: 'OPEN',
      priority: 'HIGH',
      mitigationPlan: 'إجراء تنسيق MEP مكثف في المراحل المبكرة، استخدام نمذجة BIM للكشف عن التعارضات',
      contingencyPlan: 'تعيين استشاري MEP إضافي للمراجعة',
      responseStrategy: 'MITIGATE',
      owner: engineerUser.id,
    },
  });

  console.log(`   ✅ 5 risks (3 existing + 2 new)`);

  // ============================================
  // 19. INVOICES (3 existing)
  // ============================================
  console.log('💰 Creating invoices...');

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-0001',
      clientId: client1.id,
      projectId: project1.id,
      organizationId: organization.id,
      issueDate: daysAgo(30),
      dueDate: daysFromNow(0),
      subtotal: 500000,
      taxRate: 5,
      taxAmount: 25000,
      total: 525000,
      paidAmount: 400000,
      status: 'PARTIAL',
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-0002',
      clientId: client2.id,
      projectId: project2.id,
      organizationId: organization.id,
      issueDate: daysAgo(25),
      dueDate: daysFromNow(5),
      subtotal: 750000,
      taxRate: 5,
      taxAmount: 37500,
      total: 787500,
      paidAmount: 0,
      status: 'SENT',
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-0003',
      clientId: client3.id,
      organizationId: organization.id,
      issueDate: daysAgo(20),
      dueDate: daysAgo(10),
      subtotal: 250000,
      taxRate: 5,
      taxAmount: 12500,
      total: 262500,
      paidAmount: 262500,
      status: 'PAID',
    },
  });

  console.log(`   ✅ 3 invoices (1 partial, 1 sent, 1 paid)`);

  // ============================================
  // 20. SUPPLIERS (3 existing)
  // ============================================
  console.log('🏭 Creating suppliers...');

  await prisma.supplier.create({
    data: {
      name: 'شركة الخرسانة المتحدة',
      supplierType: 'MATERIALS',
      email: 'sales@united-concrete.ae',
      phone: '+971 4 111 2222',
      address: 'Industrial City, Dubai',
      contactPerson: 'عمر البلوشي',
      rating: 4.5,
      isApproved: true,
      organizationId: organization.id,
    },
  });

  await prisma.supplier.create({
    data: {
      name: 'مصنع الحديد العربي',
      supplierType: 'MATERIALS',
      email: 'info@arab-steel.ae',
      phone: '+971 2 333 4444',
      address: 'ICAD, Abu Dhabi',
      contactPerson: 'حمد الراشد',
      rating: 4.8,
      isApproved: true,
      organizationId: organization.id,
    },
  });

  await prisma.supplier.create({
    data: {
      name: 'مؤسسة المعدات الثقيلة',
      supplierType: 'EQUIPMENT',
      email: 'rental@heavy-equip.ae',
      phone: '+971 6 555 6666',
      address: 'Industrial Area, Sharjah',
      contactPerson: 'راشد المنصوري',
      rating: 4.2,
      isApproved: true,
      organizationId: organization.id,
    },
  });

  console.log(`   ✅ 3 suppliers`);

  // ============================================
  // SEED COMPLETE
  // ============================================
  console.log('═'.repeat(60));
  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('📊 Seed Summary:');
  console.log('   • 3 Subscription Plans');
  console.log('   • 1 Organization');
  console.log('   • 8 Users (Admin, Manager, Engineer, Accountant, Viewer, Draftsman, PM, Secretary)');
  console.log('   • 3 Clients');
  console.log('   • 3 Projects (with plotNumber, fileNumber, payments)');
  console.log('   • 46 Workflow Phases (33 + 5 + 8 across 3 projects)');
  console.log('   • 3 Client Interactions');
  console.log('   • 4 Municipality Correspondence');
  console.log('   • 4 Project Templates (40 template tasks)');
  console.log('   • 12 Tasks (with SLA, gov types, mandatory flags)');
  console.log('   • 3 Proposals (with 9 line items)');
  console.log('   • 2 Contracts');
  console.log('   • 5 Documents');
  console.log('   • 2 Site Reports');
  console.log('   • 1 Site Visit Report');
  console.log('   • 1 SLA Breach Warning');
  console.log('   • 2 Transmittals (with 4 items)');
  console.log('   • 5 Risks');
  console.log('   • 3 Invoices');
  console.log('   • 3 Suppliers');
  console.log('');
  console.log('🔑 Demo Credentials:');
  console.log('   Admin:      admin@blueprint.dev / Admin@123456');
  console.log('   Manager:    manager@demo-construction.com / Demo@123456');
  console.log('   Engineer:   engineer@demo-construction.com / Demo@123456');
  console.log('   Accountant: accountant@demo-construction.com / Demo@123456');
  console.log('   Viewer:     viewer@demo-construction.com / Demo@123456');
  console.log('   Draftsman:  draftsman@demo-construction.com / Demo@123456');
  console.log('   PM:         pm@demo-construction.com / Demo@123456');
  console.log('   Secretary:  secretary@demo-construction.com / Demo@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
