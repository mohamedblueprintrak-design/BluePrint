import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';

function successResponse(data: unknown) { return NextResponse.json({ success: true, data }); }
function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// GET - Fetch all equipment
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    // SECURITY: Filter by organization through project if available
    if (user.organizationId) {
      where.project = { organizationId: user.organizationId };
    }

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

    const equipment = await db.equipment.findMany({
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
      ];

      return successResponse(mockEquipment);
    }

    return successResponse(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return errorResponse('Failed to fetch equipment', 'SERVER_ERROR', 500);
  }
}

// POST - Create new equipment
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse('غير مصرح', 'UNAUTHORIZED', 401);

    const body = await request.json();
    if (!body.name) {
      return errorResponse('اسم المعدة مطلوب', 'VALIDATION_ERROR');
    }

    // SECURITY: Only allow specific fields (prevent mass assignment)
    const equipmentData: Record<string, unknown> = {
      name: body.name,
      equipmentType: body.equipmentType || null,
      model: body.model || null,
      serialNumber: body.serialNumber || null,
      status: body.status || 'available',
      projectId: body.projectId || null,
      location: body.location || null,
      condition: body.condition || 'good',
      purchaseValue: body.purchaseValue || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
      notes: body.notes || null,
      isActive: true,
    };

    const equipment = await db.equipment.create({
      data: equipmentData as any,
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return successResponse(equipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    return errorResponse('Failed to create equipment', 'SERVER_ERROR', 500);
  }
}
