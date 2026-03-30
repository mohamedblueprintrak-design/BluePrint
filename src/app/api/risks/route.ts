/**
 * Risk Register API
 * API لسجل المخاطر
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../utils/demo-config';
import { unauthorizedResponse } from '../utils/response';

// GET - Fetch risks
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (category) where.category = category;

    const risks = await db.risk.findMany({
      where,
      include: {
        riskActions: true,
      },
      orderBy: [
        { riskScore: 'desc' },
        { identifiedDate: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: risks,
    });
  } catch (error) {
    console.error('Error fetching risks:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch risks' } },
      { status: 500 }
    );
  }
}

// POST - Create new risk
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    
    const risk = await db.risk.create({
      data: {
        title: body.title,
        description: body.description,
        projectId: body.projectId,
        category: body.category || 'technical',
        probability: body.probability || 1,
        impact: body.impact || 1,
        riskScore: (body.probability || 1) * (body.impact || 1),
        status: body.status || 'open',
        priority: body.priority || 'medium',
        owner: body.owner,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        mitigationPlan: body.mitigationPlan,
        contingencyPlan: body.contingencyPlan,
        responseStrategy: body.responseStrategy,
        triggerEvents: body.triggerEvents ? JSON.stringify(body.triggerEvents) : null as any,
        residualRisk: body.residualRisk,
      },
      include: {
        riskActions: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error('Error creating risk:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create risk' } },
      { status: 500 }
    );
  }
}

// PUT - Update risk
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Risk ID is required' } },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.probability !== undefined) updateData.probability = data.probability;
    if (data.impact !== undefined) updateData.impact = data.impact;
    if (data.probability !== undefined || data.impact !== undefined) {
      updateData.riskScore = (data.probability || 1) * (data.impact || 1);
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'closed') {
        updateData.closedDate = new Date();
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.owner !== undefined) updateData.owner = data.owner;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    if (data.mitigationPlan !== undefined) updateData.mitigationPlan = data.mitigationPlan;
    if (data.contingencyPlan !== undefined) updateData.contingencyPlan = data.contingencyPlan;
    if (data.responseStrategy !== undefined) updateData.responseStrategy = data.responseStrategy;
    if (data.triggerEvents !== undefined) updateData.triggerEvents = JSON.stringify(data.triggerEvents);
    if (data.residualRisk !== undefined) updateData.residualRisk = data.residualRisk;

    const risk = await db.risk.update({
      where: { id },
      data: updateData,
      include: {
        riskActions: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error('Error updating risk:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update risk' } },
      { status: 500 }
    );
  }
}

// DELETE - Delete risk
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Risk ID is required' } },
        { status: 400 }
      );
    }

    // Delete associated risk actions first
    await db.riskAction.deleteMany({
      where: { riskId: id },
    });

    await db.risk.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Risk deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting risk:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete risk' } },
      { status: 500 }
    );
  }
}
