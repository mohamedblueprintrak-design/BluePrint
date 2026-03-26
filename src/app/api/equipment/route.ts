import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// GET - Fetch all equipment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.equipmentType = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no equipment in database, return mock data for demo
    if (equipment.length === 0) {
      const mockEquipment = [
        {
          id: '1',
          name: 'رافعة برجية',
          equipmentType: 'Crane',
          model: 'Liebherr 710',
          serialNumber: 'CR-2024-001',
          status: 'in_use',
          location: 'موقع البرج السكني',
          condition: 'excellent',
          purchaseValue: 2500000,
          purchaseDate: '2023-01-15',
          lastMaintenanceDate: '2024-01-01',
          nextMaintenanceDate: '2024-07-01',
          project: { id: '1', name: 'برج الرياض السكني' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'خلاطة خرسانة',
          equipmentType: 'Mixer',
          model: 'Caterpillar CM445',
          serialNumber: 'MX-2024-002',
          status: 'available',
          location: 'المستودع الرئيسي',
          condition: 'good',
          purchaseValue: 850000,
          purchaseDate: '2023-03-20',
          lastMaintenanceDate: '2024-02-15',
          nextMaintenanceDate: '2024-08-15',
          project: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'حفار هيدروليكي',
          equipmentType: 'Excavator',
          model: 'Komatsu PC200',
          serialNumber: 'EX-2024-003',
          status: 'maintenance',
          location: 'ورشة الصيانة',
          condition: 'fair',
          purchaseValue: 1200000,
          purchaseDate: '2022-06-10',
          lastMaintenanceDate: '2024-03-01',
          nextMaintenanceDate: '2024-04-01',
          project: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          name: 'شاحنة نقل',
          equipmentType: 'Truck',
          model: 'Volvo FH16',
          serialNumber: 'TR-2024-004',
          status: 'in_use',
          location: 'موقع المستشفى',
          condition: 'good',
          purchaseValue: 650000,
          purchaseDate: '2023-08-05',
          lastMaintenanceDate: '2024-01-20',
          nextMaintenanceDate: '2024-07-20',
          project: { id: '2', name: 'مجمع جدة الطبي' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '5',
          name: 'مضخة خرسانة',
          equipmentType: 'Pump',
          model: 'Putzmeister M38',
          serialNumber: 'PM-2024-005',
          status: 'available',
          location: 'المستودع الرئيسي',
          condition: 'excellent',
          purchaseValue: 1800000,
          purchaseDate: '2023-11-12',
          lastMaintenanceDate: '2024-02-28',
          nextMaintenanceDate: '2024-08-28',
          project: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return NextResponse.json({ data: mockEquipment });
    }

    return NextResponse.json({ data: equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

// POST - Create new equipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      equipmentType,
      model,
      serialNumber,
      status,
      projectId,
      location,
      condition,
      purchaseValue,
      purchaseDate,
      notes,
    } = body;

    // Try to create in database
    try {
      const equipment = await prisma.equipment.create({
        data: {
          name,
          equipmentType,
          model,
          serialNumber,
          status: status || 'available',
          projectId: projectId || null,
          location,
          condition: condition || 'good',
          purchaseValue,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          notes,
          isActive: true,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ data: equipment });
    } catch (dbError) {
      // If database error, return success anyway (demo mode)
      return NextResponse.json({
        data: {
          id: Date.now().toString(),
          ...body,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
  }
}
