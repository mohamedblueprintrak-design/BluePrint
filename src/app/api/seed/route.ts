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
      } as any,
    });

    // Create users (User model: username, email, fullName, role as UserRole enum, password, organizationId)
    const admin = await db.user.create({
      data: {
        username: 'admin',
        email: 'admin@blueprint.com',
        password: hashedPassword,
        fullName: 'Alex Morgan',
        role: 'ADMIN',
        phone: '+1 (555) 100-0001',
        organizationId: organization.id,
      },
    });

    const manager = await db.user.create({
      data: {
        username: 'sarah.chen',
        email: 'sarah.chen@blueprint.com',
        password: hashedPassword,
        fullName: 'Sarah Chen',
        role: 'PROJECT_MANAGER',
        phone: '+1 (555) 100-0002',
        organizationId: organization.id,
      },
    });

    const engineer1 = await db.user.create({
      data: {
        username: 'james.wilson',
        email: 'james.wilson@blueprint.com',
        password: hashedPassword,
        fullName: 'James Wilson',
        role: 'ENGINEER',
        phone: '+1 (555) 100-0003',
        organizationId: organization.id,
      },
    });

    const engineer2 = await db.user.create({
      data: {
        username: 'emily.park',
        email: 'emily.park@blueprint.com',
        password: hashedPassword,
        fullName: 'Emily Park',
        role: 'ENGINEER',
        phone: '+1 (555) 100-0004',
        organizationId: organization.id,
      },
    });

    const engineer3 = await db.user.create({
      data: {
        username: 'michael.brown',
        email: 'michael.brown@blueprint.com',
        password: hashedPassword,
        fullName: 'Michael Brown',
        role: 'ENGINEER',
        phone: '+1 (555) 100-0005',
        organizationId: organization.id,
      },
    });

    const viewer = await db.user.create({
      data: {
        username: 'lisa.taylor',
        email: 'lisa.taylor@blueprint.com',
        password: hashedPassword,
        fullName: 'Lisa Taylor',
        role: 'VIEWER',
        phone: '+1 (555) 100-0006',
        organizationId: organization.id,
      },
    });

    // Create clients (Client model: name, email, phone, address, city, notes, organizationId)
    const client1 = await db.client.create({
      data: {
        name: 'Robert Anderson',
        email: 'r.anderson@techcorp.com',
        phone: '+1 (555) 200-0001',
        address: '456 Innovation Blvd, Austin, TX 73301',
        city: 'Austin',
        notes: 'Enterprise client with ongoing infrastructure projects',
        organizationId: organization.id,
      },
    });

    const client2 = await db.client.create({
      data: {
        name: 'Maria Garcia',
        email: 'm.garcia@greenbuild.com',
        phone: '+1 (555) 200-0002',
        address: '789 Eco Drive, Portland, OR 97201',
        city: 'Portland',
        notes: 'Focus on sustainable construction projects',
        organizationId: organization.id,
      },
    });

    const client3 = await db.client.create({
      data: {
        name: 'David Kim',
        email: 'd.kim@metro.gov',
        phone: '+1 (555) 200-0003',
        address: '100 Government Plaza, Chicago, IL 60601',
        city: 'Chicago',
        notes: 'Municipal infrastructure and urban development',
        organizationId: organization.id,
      },
    });

    const client4 = await db.client.create({
      data: {
        name: 'Jennifer White',
        email: 'j.white@energyco.com',
        phone: '+1 (555) 200-0004',
        address: '200 Power Street, Houston, TX 77001',
        city: 'Houston',
        notes: 'Power plant and renewable energy projects',
        organizationId: organization.id,
      },
    });

    const client5 = await db.client.create({
      data: {
        name: 'Thomas Lee',
        email: 't.lee@transit.org',
        phone: '+1 (555) 200-0005',
        address: '350 Transit Way, Denver, CO 80201',
        city: 'Denver',
        notes: 'Public transit infrastructure modernization',
        organizationId: organization.id,
      },
    });

    // Create projects (Project model: name, projectNumber, description, status as ProjectStatus, progressPercentage, budget, clientId, organizationId, managerId, location)
    const project1 = await db.project.create({
      data: {
        name: 'TechCorp Headquarters Tower',
        projectNumber: 'PRJ-TCH-001',
        description: 'Design and engineering consultation for a 40-story commercial tower with LEED Platinum certification requirements. Includes structural analysis, MEP systems design, and sustainability consulting.',
        status: 'ACTIVE',
        progressPercentage: 48,
        budget: 2500000,
        expectedStartDate: new Date('2025-01-15'),
        expectedEndDate: new Date('2025-12-31'),
        location: 'Austin, TX',
        clientId: client1.id,
        managerId: manager.id,
        organizationId: organization.id,
      },
    });

    const project2 = await db.project.create({
      data: {
        name: 'GreenBuild Eco Village',
        projectNumber: 'PRJ-GRB-002',
        description: 'Sustainable residential community with 200 units. Features solar integration, rainwater harvesting, and net-zero energy targets.',
        status: 'ACTIVE',
        progressPercentage: 30,
        budget: 1800000,
        expectedStartDate: new Date('2025-02-01'),
        expectedEndDate: new Date('2026-03-15'),
        location: 'Portland, OR',
        clientId: client2.id,
        managerId: manager.id,
        organizationId: organization.id,
      },
    });

    const project3 = await db.project.create({
      data: {
        name: 'Metro Bridge Restoration',
        projectNumber: 'PRJ-MET-003',
        description: 'Structural assessment and restoration plan for the historic Metro River Bridge. Includes seismic retrofitting and modernization of traffic systems.',
        status: 'ACTIVE',
        progressPercentage: 60,
        budget: 3200000,
        expectedStartDate: new Date('2025-03-01'),
        expectedEndDate: new Date('2025-09-30'),
        location: 'Chicago, IL',
        clientId: client3.id,
        managerId: engineer1.id,
        organizationId: organization.id,
      },
    });

    const project4 = await db.project.create({
      data: {
        name: 'EnergyCo Solar Farm',
        projectNumber: 'PRJ-ENG-004',
        description: 'Engineering design for a 50MW solar farm installation including grid connection infrastructure and environmental impact assessment.',
        status: 'PENDING',
        progressPercentage: 5,
        budget: 1500000,
        expectedStartDate: new Date('2025-06-01'),
        expectedEndDate: new Date('2026-06-30'),
        location: 'Houston, TX',
        clientId: client4.id,
        managerId: manager.id,
        organizationId: organization.id,
      },
    });

    const project5 = await db.project.create({
      data: {
        name: 'Transit Light Rail Extension',
        projectNumber: 'PRJ-TRN-005',
        description: 'Preliminary design and feasibility study for 12-mile light rail extension connecting downtown to suburbs.',
        status: 'PENDING',
        progressPercentage: 4,
        budget: 4500000,
        expectedStartDate: new Date('2025-07-01'),
        expectedEndDate: new Date('2026-12-31'),
        location: 'Denver, CO',
        clientId: client5.id,
        managerId: manager.id,
        organizationId: organization.id,
      },
    });

    const project6 = await db.project.create({
      data: {
        name: 'Harbor Waterfront Development',
        projectNumber: 'PRJ-HBR-006',
        description: 'Mixed-use waterfront development including commercial, residential, and public spaces with flood protection measures.',
        status: 'ON_HOLD',
        progressPercentage: 12,
        budget: 3800000,
        expectedStartDate: new Date('2025-04-15'),
        expectedEndDate: new Date('2026-04-30'),
        location: 'San Francisco, CA',
        clientId: client1.id,
        managerId: engineer2.id,
        organizationId: organization.id,
      },
    });

    const project7 = await db.project.create({
      data: {
        name: 'University Campus Renovation',
        projectNumber: 'PRJ-UNI-007',
        description: 'Complete renovation of the science and engineering buildings, including laboratory upgrades and ADA compliance improvements.',
        status: 'COMPLETED',
        progressPercentage: 100,
        budget: 950000,
        expectedStartDate: new Date('2024-06-01'),
        expectedEndDate: new Date('2025-02-28'),
        location: 'Chicago, IL',
        clientId: client3.id,
        managerId: manager.id,
        organizationId: organization.id,
      },
    });

    // Create tasks (Task model: title, description, status as TaskStatus, priority as TaskPriority, projectId, assignedTo, dueDate, progress)
    await db.task.createMany({
      data: [
        // TechCorp HQ tasks
        {
          title: 'Foundation Structural Analysis',
          description: 'Complete geotechnical report and foundation load calculations for the 40-story tower.',
          status: 'DONE',
          priority: 'URGENT',
          dueDate: new Date('2025-03-30'),
          projectId: project1.id,
          assignedTo: engineer1.id,
        },
        {
          title: 'MEP System Schematic Design',
          description: 'Develop preliminary mechanical, electrical, and plumbing schematics.',
          status: 'REVIEW',
          priority: 'HIGH',
          dueDate: new Date('2025-06-15'),
          projectId: project1.id,
          assignedTo: engineer1.id,
        },
        {
          title: 'LEED Certification Documentation',
          description: 'Prepare all documentation required for LEED Platinum certification submission.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dueDate: new Date('2025-08-01'),
          projectId: project1.id,
          assignedTo: engineer2.id,
        },
        {
          title: 'Wind Load Analysis',
          description: 'Perform computational wind analysis for the tower facade design.',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: new Date('2025-07-15'),
          projectId: project1.id,
          assignedTo: engineer3.id,
        },
        {
          title: 'Seismic Design Review',
          description: 'Review seismic design parameters and update structural model.',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          dueDate: new Date('2025-06-30'),
          projectId: project1.id,
          assignedTo: engineer1.id,
        },
        // GreenBuild tasks
        {
          title: 'Solar Panel Layout Design',
          description: 'Design optimal solar panel placement for 200 residential units.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dueDate: new Date('2025-07-30'),
          projectId: project2.id,
          assignedTo: engineer2.id,
        },
        {
          title: 'Rainwater Collection System',
          description: 'Design rainwater harvesting system with storage and filtration.',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: new Date('2025-08-30'),
          projectId: project2.id,
          assignedTo: engineer3.id,
        },
        {
          title: 'Net-Zero Energy Modeling',
          description: 'Create energy simulation models to verify net-zero energy targets.',
          status: 'REVIEW',
          priority: 'HIGH',
          dueDate: new Date('2025-07-15'),
          projectId: project2.id,
          assignedTo: engineer2.id,
        },
        // Metro Bridge tasks
        {
          title: 'Structural Health Monitoring Plan',
          description: 'Design sensor placement plan for real-time bridge health monitoring.',
          status: 'DONE',
          priority: 'URGENT',
          dueDate: new Date('2025-04-30'),
          projectId: project3.id,
          assignedTo: engineer1.id,
        },
        {
          title: 'Seismic Retrofitting Design',
          description: 'Complete seismic retrofit design for the bridge piers and deck.',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          dueDate: new Date('2025-07-15'),
          projectId: project3.id,
          assignedTo: engineer1.id,
        },
        {
          title: 'Traffic Management Plan',
          description: 'Develop temporary traffic management plan during construction phases.',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date('2025-08-01'),
          projectId: project3.id,
          assignedTo: manager.id,
        },
        {
          title: 'Environmental Impact Assessment',
          description: 'Complete environmental impact study for bridge restoration activities.',
          status: 'CANCELLED',
          priority: 'MEDIUM',
          dueDate: new Date('2025-07-30'),
          projectId: project3.id,
          assignedTo: engineer2.id,
        },
        // Solar Farm tasks
        {
          title: 'Grid Connection Feasibility Study',
          description: 'Analyze grid connection options and capacity requirements for 50MW installation.',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date('2025-08-15'),
          projectId: project4.id,
          assignedTo: engineer3.id,
        },
        {
          title: 'Land Survey and Topography',
          description: 'Complete detailed land survey for panel placement optimization.',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: new Date('2025-07-30'),
          projectId: project4.id,
          assignedTo: engineer3.id,
        },
        // Transit tasks
        {
          title: 'Route Alignment Study',
          description: 'Evaluate multiple route options for the 12-mile light rail extension.',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date('2025-09-30'),
          projectId: project5.id,
          assignedTo: manager.id,
        },
        {
          title: 'Station Design Concepts',
          description: 'Develop conceptual designs for 8 new transit stations.',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: new Date('2025-10-31'),
          projectId: project5.id,
          assignedTo: engineer1.id,
        },
      ],
    });

    // Create invoices (Invoice model: invoiceNumber, status as InvoiceStatus, subtotal, taxRate, taxAmount, total, paidAmount, issueDate, dueDate, clientId, projectId, organizationId)
    await db.invoice.createMany({
      data: [
        {
          invoiceNumber: 'INV-2025-001',
          status: 'PAID',
          subtotal: 250000,
          taxRate: 8.0,
          taxAmount: 20000,
          total: 270000,
          paidAmount: 270000,
          issueDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-28'),
          notes: 'Phase 1 structural analysis and foundation design - TechCorp HQ',
          clientId: client1.id,
          projectId: project1.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-002',
          status: 'PAID',
          subtotal: 180000,
          taxRate: 8.0,
          taxAmount: 14400,
          total: 194400,
          paidAmount: 194400,
          issueDate: new Date('2025-02-01'),
          dueDate: new Date('2025-03-15'),
          notes: 'Schematic design phase - TechCorp HQ MEP systems',
          clientId: client1.id,
          projectId: project1.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-003',
          status: 'SENT',
          subtotal: 320000,
          taxRate: 8.0,
          taxAmount: 25600,
          total: 345600,
          paidAmount: 0,
          issueDate: new Date('2025-04-01'),
          dueDate: new Date('2025-06-30'),
          notes: 'Phase 2 structural monitoring and retrofit design - Metro Bridge',
          clientId: client3.id,
          projectId: project3.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-004',
          status: 'PAID',
          subtotal: 150000,
          taxRate: 8.0,
          taxAmount: 12000,
          total: 162000,
          paidAmount: 162000,
          issueDate: new Date('2025-03-01'),
          dueDate: new Date('2025-03-31'),
          notes: 'Eco Village preliminary design and energy modeling - GreenBuild',
          clientId: client2.id,
          projectId: project2.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-005',
          status: 'OVERDUE',
          subtotal: 92000,
          taxRate: 8.0,
          taxAmount: 7360,
          total: 99360,
          paidAmount: 0,
          issueDate: new Date('2025-03-01'),
          dueDate: new Date('2025-04-15'),
          notes: 'University campus renovation - final phase completion',
          clientId: client3.id,
          projectId: project7.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-006',
          status: 'SENT',
          subtotal: 200000,
          taxRate: 8.0,
          taxAmount: 16000,
          total: 216000,
          paidAmount: 0,
          issueDate: new Date('2025-05-01'),
          dueDate: new Date('2025-07-31'),
          notes: 'Solar panel layout and rainwater system design - Eco Village',
          clientId: client2.id,
          projectId: project2.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-007',
          status: 'DRAFT',
          subtotal: 450000,
          taxRate: 8.0,
          taxAmount: 36000,
          total: 486000,
          paidAmount: 0,
          issueDate: new Date('2025-06-01'),
          dueDate: new Date('2025-08-31'),
          notes: 'Light rail feasibility study and route alignment - Transit Authority',
          clientId: client5.id,
          projectId: project5.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-008',
          status: 'PAID',
          subtotal: 460000,
          taxRate: 8.0,
          taxAmount: 36800,
          total: 496800,
          paidAmount: 496800,
          issueDate: new Date('2025-04-15'),
          dueDate: new Date('2025-05-31'),
          notes: 'Harbor waterfront preliminary design - Phase 1',
          clientId: client1.id,
          projectId: project6.id,
          organizationId: organization.id,
        },
        {
          invoiceNumber: 'INV-2025-009',
          status: 'DRAFT',
          subtotal: 75000,
          taxRate: 8.0,
          taxAmount: 6000,
          total: 81000,
          paidAmount: 0,
          issueDate: new Date('2025-06-01'),
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
          name: admin.fullName,
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
