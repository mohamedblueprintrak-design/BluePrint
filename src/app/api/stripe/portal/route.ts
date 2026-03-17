/**
 * API Route: Create Stripe Billing Portal Session
 * إنشاء جلسة بوابة الفوترة
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION_ID',
            message: 'معرف المنظمة مطلوب',
          },
        },
        { status: 400 }
      );
    }

    // Get organization's Stripe customer ID
    let stripeCustomerId: string | null = null;

    try {
      const organization = await db.organization.findUnique({
        where: { id: organizationId },
        select: { stripeCustomerId: true },
      });

      if (!organization?.stripeCustomerId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_STRIPE_CUSTOMER',
              message: 'لا يوجد حساب Stripe مرتبط بهذه المنظمة',
            },
          },
          { status: 400 }
        );
      }

      stripeCustomerId = organization.stripeCustomerId;
    } catch (dbError) {
      console.log('Database not available');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'قاعدة البيانات غير متاحة',
          },
        },
        { status: 500 }
      );
    }

    // Create billing portal session
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const session = await createBillingPortalSession(
      stripeCustomerId,
      `${origin}/settings/billing`
    );

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PORTAL_ERROR',
          message: 'حدث خطأ أثناء فتح بوابة الفوترة',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
