import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';

// POST /api/seed - Seed database with demo data
export async function POST(request: NextRequest) {
  try {
    // Check if data already exists
    const existingUsers = await db.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Database already has data. Skipping seed.',
        seeded: false,
      });
    }

    const hashedPassword = await bcrypt.hash('Admin@123456', 12);

    // Create organization
    const organization = await db.organization.create({
      data: {
        name: 'BluePrint Engineering Consultancy',
        description: 'Leading engineering consultancy providing innovative solutions for infrastructure, construction, and environmental projects worldwide.',
        website: 'https://blueprint-eng.com',
        phone: '+1 (555) 123-4567',
        address: '123 Engineering Drive, Suite 500, San Francisco, CA 94105',
      },
    });

    // Create users
    const admin = await db.user.create({
      data: {
        email: 'admin@blueprint.com',
        password: hashedPassword,
        name: 'Alex Morgan',
        role: 'admin',
        department: 'Executive',
        phone: '+1 (555) 100-0001',
        organizationId: organization.id,
      },
    });

    const manager = await db.user.create({
      data: {
        email: 'sarah.chen@blueprint.com',
        password: hashedPassword,
        name: 'Sarah Chen',
        role: 'manager',
        department: 'Project Management',
        phone: '+1 (555) 100-0002',
        organizationId: organization.id,
      },
    });

    const engineer1 = await db.user.create({
      data: {
        email: 'james.wilson@blueprint.com',
        password: hashedPassword,
        name: 'James Wilson',
        role: 'engineer',
        department: 'Structural Engineering',
        phone: '+1 (555) 100-0003',
        organizationId: organization.id,
      },
    });

    const engineer2 = await db.user.create({
      data: {
        email: 'emily.park@blueprint.com',
        password: hashedPassword,
        name: 'Emily Park',
        role: 'engineer',
        department: 'Environmental Engineering',
        phone: '+1 (555) 100-0004',
        organizationId: organization.id,
      },
    });

    const engineer3 = await db.user.create({
      data: {
        email: 'michael.brown@blueprint.com',
        password: hashedPassword,
        name: 'Michael Brown',
        role: 'engineer',
        department: 'Civil Engineering',
        phone: '+1 (555) 100-0005',
        organizationId: organization.id,
      },
    });

    const viewer = await db.user.create({
      data: {
        email: 'lisa.taylor@blueprint.com',
        password: hashedPassword,
        name: 'Lisa Taylor',
        role: 'viewer',
        department: 'Quality Assurance',
        phone: '+1 (555) 100-0006',
        organizationId: organization.id,
      },
    });

    // Create clients
    const client1 = await db.client.create({
      data: {
        name: 'Robert Anderson',
        email: 'r.anderson@techcorp.com',
        phone: '+1 (555) 200-0001',
        company: 'TechCorp Industries',
        address: '456 Innovation Blvd, Austin, TX 73301',
        industry: 'Technology',
        notes: 'Enterprise client with ongoing infrastructure projects',
        organizationId: organization.id,
      },
    });

    const client2 = await db.client.create({
      data: {
        name: 'Maria Garcia',
        email: 'm.garcia@greenbuild.com',
        phone: '+1 (555) 200-0002',
        company: 'GreenBuild Solutions',
        address: '789 Eco Drive, Portland, OR 97201',
        industry: 'Construction',
        notes: 'Focus on sustainable construction projects',
        organizationId: organization.id,
      },
    });

    const client3 = await db.client.create({
      data: {
        name: 'David Kim',
        email: 'd.kim@metro.gov',
        phone: '+1 (555) 200-0003',
        company: 'Metro City Council',
        address: '100 Government Plaza, Chicago, IL 60601',
        industry: 'Government',
        notes: 'Municipal infrastructure and urban development',
        organizationId: organization.id,
      },
    });

    const client4 = await db.client.create({
      data: {
        name: 'Jennifer White',
        email: 'j.white@energyco.com',
        phone: '+1 (555) 200-0004',
        company: 'EnergyCo Power',
        address: '200 Power Street, Houston, TX 77001',
        industry: 'Energy',
        notes: 'Power plant and renewable energy projects',
        organizationId: organization.id,
      },
    });

    const client5 = await db.client.create({
      data: {
        name: 'Thomas Lee',
        email: 't.lee@transit.org',
        phone: '+1 (555) 200-0005',
        company: 'Regional Transit Authority',
        address: '350 Transit Way, Denver, CO 80201',
        industry: 'Transportation',
        notes: 'Public transit infrastructure modernization',
        organizationId: organization.id,
      },
    });

    // Create projects
    const project1 = await db.project.create({
      data: {
        name: 'TechCorp Headquarters Tower',
        code: 'PRJ-TCH-001',
        description: 'Design and engineering consultation for a 40-story commercial tower with LEED Platinum certification requirements. Includes structural analysis, MEP systems design, and sustainability consulting.',
        status: 'active',
        priority: 'high',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-12-31'),
        budget: 2500000,
        spent: 1250000,
        progress: 48,
        clientId: client1.id,
        organizationId: organization.id,
      },
    });

    const project2 = await db.project.create({
      data: {
        name: 'GreenBuild Eco Village',
        code: 'PRJ-GRB-002',
        description: 'Sustainable residential community with 200 units. Features solar integration, rainwater harvesting, and net-zero energy targets.',
        status: 'active',
        priority: 'high',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2026-03-15'),
        budget: 1800000,
        spent: 540000,
        progress: 30,
        clientId: client2.id,
        organizationId: organization.id,
      },
    });

    const project3 = await db.project.create({
      data: {
        name: 'Metro Bridge Restoration',
        code: 'PRJ-MET-003',
        description: 'Structural assessment and restoration plan for the historic Metro River Bridge. Includes seismic retrofitting and modernization of traffic systems.',
        status: 'active',
        priority: 'critical',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-09-30'),
        budget: 3200000,
        spent: 1920000,
        progress: 60,
        clientId: client3.id,
        organizationId: organization.id,
      },
    });

    const project4 = await db.project.create({
      data: {
        name: 'EnergyCo Solar Farm',
        code: 'PRJ-ENG-004',
        description: 'Engineering design for a 50MW solar farm installation including grid connection infrastructure and environmental impact assessment.',
        status: 'planning',
        priority: 'medium',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-06-30'),
        budget: 1500000,
        spent: 75000,
        progress: 5,
        clientId: client4.id,
        organizationId: organization.id,
      },
    });

    const project5 = await db.project.create({
      data: {
        name: 'Transit Light Rail Extension',
        code: 'PRJ-TRN-005',
        description: 'Preliminary design and feasibility study for 12-mile light rail extension connecting downtown to suburbs.',
        status: 'planning',
        priority: 'medium',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2026-12-31'),
        budget: 4500000,
        spent: 180000,
        progress: 4,
        clientId: client5.id,
        organizationId: organization.id,
      },
    });

    const project6 = await db.project.create({
      data: {
        name: 'Harbor Waterfront Development',
        code: 'PRJ-HBR-006',
        description: 'Mixed-use waterfront development including commercial, residential, and public spaces with flood protection measures.',
        status: 'on-hold',
        priority: 'low',
        startDate: new Date('2025-04-15'),
        endDate: new Date('2026-04-30'),
        budget: 3800000,
        spent: 460000,
        progress: 12,
        clientId: client1.id,
        organizationId: organization.id,
      },
    });

    const project7 = await db.project.create({
      data: {
        name: 'University Campus Renovation',
        code: 'PRJ-UNI-007',
        description: 'Complete renovation of the science and engineering buildings, including laboratory upgrades and ADA compliance improvements.',
        status: 'completed',
        priority: 'high',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-02-28'),
        budget: 950000,
        spent: 920000,
        progress: 100,
        clientId: client3.id,
        organizationId: organization.id,
      },
    });

    // Create tasks
    await db.task.createMany({
      data: [
        // TechCorp HQ tasks
        {
          title: 'Foundation Structural Analysis',
          description: 'Complete geotechnical report and foundation load calculations for the 40-story tower.',
          status: 'done',
          priority: 'critical',
          dueDate: new Date('2025-03-30'),
          projectId: project1.id,
          assigneeId: engineer1.id,
        },
        {
          title: 'MEP System Schematic Design',
          description: 'Develop preliminary mechanical, electrical, and plumbing schematics.',
          status: 'review',
          priority: 'high',
          dueDate: new Date('2025-06-15'),
          projectId: project1.id,
          assigneeId: engineer1.id,
        },
        {
          title: 'LEED Certification Documentation',
          description: 'Prepare all documentation required for LEED Platinum certification submission.',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date('2025-08-01'),
          projectId: project1.id,
          assigneeId: engineer2.id,
        },
        {
          title: 'Wind Load Analysis',
          description: 'Perform computational wind analysis for the tower facade design.',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date('2025-07-15'),
          projectId: project1.id,
          assigneeId: engineer3.id,
        },
        {
          title: 'Seismic Design Review',
          description: 'Review seismic design parameters and update structural model.',
          status: 'in-progress',
          priority: 'critical',
          dueDate: new Date('2025-06-30'),
          projectId: project1.id,
          assigneeId: engineer1.id,
        },
        // GreenBuild tasks
        {
          title: 'Solar Panel Layout Design',
          description: 'Design optimal solar panel placement for 200 residential units.',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date('2025-07-30'),
          projectId: project2.id,
          assigneeId: engineer2.id,
        },
        {
          title: 'Rainwater Collection System',
          description: 'Design rainwater harvesting system with storage and filtration.',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date('2025-08-30'),
          projectId: project2.id,
          assigneeId: engineer3.id,
        },
        {
          title: 'Net-Zero Energy Modeling',
          description: 'Create energy simulation models to verify net-zero energy targets.',
          status: 'review',
          priority: 'high',
          dueDate: new Date('2025-07-15'),
          projectId: project2.id,
          assigneeId: engineer2.id,
        },
        // Metro Bridge tasks
        {
          title: 'Structural Health Monitoring Plan',
          description: 'Design sensor placement plan for real-time bridge health monitoring.',
          status: 'done',
          priority: 'critical',
          dueDate: new Date('2025-04-30'),
          projectId: project3.id,
          assigneeId: engineer1.id,
        },
        {
          title: 'Seismic Retrofitting Design',
          description: 'Complete seismic retrofit design for the bridge piers and deck.',
          status: 'in-progress',
          priority: 'critical',
          dueDate: new Date('2025-07-15'),
          projectId: project3.id,
          assigneeId: engineer1.id,
        },
        {
          title: 'Traffic Management Plan',
          description: 'Develop temporary traffic management plan during construction phases.',
          status: 'todo',
          priority: 'high',
          dueDate: new Date('2025-08-01'),
          projectId: project3.id,
          assigneeId: manager.id,
        },
        {
          title: 'Environmental Impact Assessment',
          description: 'Complete environmental impact study for bridge restoration activities.',
          status: 'blocked',
          priority: 'medium',
          dueDate: new Date('2025-07-30'),
          projectId: project3.id,
          assigneeId: engineer2.id,
        },
        // Solar Farm tasks
        {
          title: 'Grid Connection Feasibility Study',
          description: 'Analyze grid connection options and capacity requirements for 50MW installation.',
          status: 'todo',
          priority: 'high',
          dueDate: new Date('2025-08-15'),
          projectId: project4.id,
          assigneeId: engineer3.id,
        },
        {
          title: 'Land Survey and Topography',
          description: 'Complete detailed land survey for panel placement optimization.',
          status: 'in-progress',
          priority: 'medium',
          dueDate: new Date('2025-07-30'),
          projectId: project4.id,
          assigneeId: engineer3.id,
        },
        // Transit tasks
        {
          title: 'Route Alignment Study',
          description: 'Evaluate multiple route options for the 12-mile light rail extension.',
          status: 'todo',
          priority: 'high',
          dueDate: new Date('2025-09-30'),
          projectId: project5.id,
          assigneeId: manager.id,
        },
        {
          title: 'Station Design Concepts',
          description: 'Develop conceptual designs for 8 new transit stations.',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date('2025-10-31'),
          projectId: project5.id,
          assigneeId: engineer1.id,
        },
      ],
    });

    // Create invoices
    await db.invoice.createMany({
      data: [
        {
          invoiceNumber: 'INV-2025-001',
          status: 'paid',
          amount: 250000,
          tax: 20000,
          total: 270000,
          dueDate: new Date('2025-02-28'),
          paidDate: new Date('2025-02-25'),
          notes: 'Phase 1 structural analysis and foundation design - TechCorp HQ',
          clientId: client1.id,
          projectId: project1.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-002',
          status: 'paid',
          amount: 180000,
          tax: 14400,
          total: 194400,
          dueDate: new Date('2025-03-15'),
          paidDate: new Date('2025-03-10'),
          notes: 'Schematic design phase - TechCorp HQ MEP systems',
          clientId: client1.id,
          projectId: project1.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-003',
          status: 'sent',
          amount: 320000,
          tax: 25600,
          total: 345600,
          dueDate: new Date('2025-06-30'),
          notes: 'Phase 2 structural monitoring and retrofit design - Metro Bridge',
          clientId: client3.id,
          projectId: project3.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-004',
          status: 'paid',
          amount: 150000,
          tax: 12000,
          total: 162000,
          dueDate: new Date('2025-03-31'),
          paidDate: new Date('2025-03-28'),
          notes: 'Eco Village preliminary design and energy modeling - GreenBuild',
          clientId: client2.id,
          projectId: project2.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-005',
          status: 'overdue',
          amount: 92000,
          tax: 7360,
          total: 99360,
          dueDate: new Date('2025-04-15'),
          notes: 'University campus renovation - final phase completion',
          clientId: client3.id,
          projectId: project7.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-006',
          status: 'sent',
          amount: 200000,
          tax: 16000,
          total: 216000,
          dueDate: new Date('2025-07-31'),
          notes: 'Solar panel layout and rainwater system design - Eco Village',
          clientId: client2.id,
          projectId: project2.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-007',
          status: 'draft',
          amount: 450000,
          tax: 36000,
          total: 486000,
          dueDate: new Date('2025-08-31'),
          notes: 'Light rail feasibility study and route alignment - Transit Authority',
          clientId: client5.id,
          projectId: project5.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-008',
          status: 'paid',
          amount: 460000,
          tax: 36800,
          total: 496800,
          dueDate: new Date('2025-05-31'),
          paidDate: new Date('2025-05-29'),
          notes: 'Harbor waterfront preliminary design - Phase 1',
          clientId: client1.id,
          projectId: project6.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-009',
          status: 'draft',
          amount: 75000,
          tax: 6000,
          total: 81000,
          dueDate: new Date('2025-08-15'),
          notes: 'Solar farm feasibility study and land survey - EnergyCo',
          clientId: client4.id,
          projectId: project4.id,
          organizationId: organization.id,
        },
      ],
    });

    // Create admin token for immediate login
    const token = signToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return NextResponse.json(
      {
        message: 'Database seeded successfully with demo data',
        seeded: true,
        credentials: {
          email: 'admin@blueprint.com',
          password: 'Admin@123456',
        },
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        stats: {
          users: 6,
          clients: 5,
          projects: 7,
          tasks: 16,
          invoices: 9,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
