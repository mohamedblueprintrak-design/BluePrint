/**
 * Gantt Chart API
 * API لمخطط جانت
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch tasks for Gantt chart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where = projectId ? { projectId } : {};

    const tasks = await db.task.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { startDate: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch tasks' } },
      { status: 500 }
    );
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description,
        projectId: body.projectId,
        parentId: body.parentId,
        assignedTo: body.assignedTo,
        priority: body.priority || 'medium',
        status: body.status || 'todo',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        progress: body.progress || 0,
        estimatedHours: body.estimatedHours,
        actualHours: body.actualHours,
        dependencies: body.dependencies ? JSON.stringify(body.dependencies) : null,
        order: body.order || 0,
        color: body.color,
        isMilestone: body.isMilestone || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create task' } },
      { status: 500 }
    );
  }
}

// PUT - Update task
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Task ID is required' } },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
    if (data.actualHours !== undefined) updateData.actualHours = data.actualHours;
    if (data.dependencies !== undefined) updateData.dependencies = JSON.stringify(data.dependencies);
    if (data.order !== undefined) updateData.order = data.order;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isMilestone !== undefined) updateData.isMilestone = data.isMilestone;

    const task = await db.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update task' } },
      { status: 500 }
    );
  }
}

// DELETE - Delete task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Task ID is required' } },
        { status: 400 }
      );
    }

    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete task' } },
      { status: 500 }
    );
  }
}
