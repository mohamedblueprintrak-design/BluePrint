/**
 * Transmittal System API
 * API لنظام الإرسال
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch transmittals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const transmittals = await db.transmittal.findMany({
      where,
      include: {
        items: true,
        responses: true,
      },
      orderBy: [
        { sendDate: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: transmittals,
    });
  } catch (error) {
    console.error('Error fetching transmittals:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch transmittals' } },
      { status: 500 }
    );
  }
}

// POST - Create new transmittal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, ...transmittalData } = body;

    const transmittal = await db.transmittal.create({
      data: {
        transmittalNumber: transmittalData.transmittalNumber,
        subject: transmittalData.subject,
        description: transmittalData.description,
        projectId: transmittalData.projectId,
        senderId: transmittalData.senderId,
        recipientName: transmittalData.recipientName,
        recipientEmail: transmittalData.recipientEmail,
        recipientCompany: transmittalData.recipientCompany,
        recipientPhone: transmittalData.recipientPhone,
        sendDate: transmittalData.sendDate ? new Date(transmittalData.sendDate) : new Date(),
        dueDate: transmittalData.dueDate ? new Date(transmittalData.dueDate) : null,
        status: transmittalData.status || 'draft',
        priority: transmittalData.priority || 'normal',
        deliveryMethod: transmittalData.deliveryMethod || 'email',
        trackingNumber: transmittalData.trackingNumber,
        notes: transmittalData.notes,
        items: items ? {
          create: items.map((item: any) => ({
            documentNumber: item.documentNumber,
            documentTitle: item.documentTitle,
            revision: item.revision || 'A',
            copies: item.copies || 1,
            documentType: item.documentType,
            status: item.status || 'for_review',
            notes: item.notes,
          }))
        } : undefined,
      },
      include: {
        items: true,
        responses: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: transmittal,
    });
  } catch (error) {
    console.error('Error creating transmittal:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create transmittal' } },
      { status: 500 }
    );
  }
}

// PUT - Update transmittal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, items, responses, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Transmittal ID is required' } },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.deliveryMethod !== undefined) updateData.deliveryMethod = data.deliveryMethod;
    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.acknowledgedDate !== undefined) updateData.acknowledgedDate = data.acknowledgedDate ? new Date(data.acknowledgedDate) : null;
    if (data.acknowledgedBy !== undefined) updateData.acknowledgedBy = data.acknowledgedBy;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const transmittal = await db.transmittal.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        responses: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: transmittal,
    });
  } catch (error) {
    console.error('Error updating transmittal:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update transmittal' } },
      { status: 500 }
    );
  }
}

// DELETE - Delete transmittal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Transmittal ID is required' } },
        { status: 400 }
      );
    }

    // Delete associated items and responses first
    await db.transmittalItem.deleteMany({
      where: { transmittalId: id },
    });

    await db.transmittalResponse.deleteMany({
      where: { transmittalId: id },
    });

    await db.transmittal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Transmittal deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting transmittal:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete transmittal' } },
      { status: 500 }
    );
  }
}
