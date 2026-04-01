/**
 * API Route: Create Stripe Billing Portal Session
 * إنشاء جلسة بوابة الفوترة
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/stripe';
import { getUserFromRequest } from '../../utils/demo-config';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'غير مصرح' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_CUSTOMER_ID',
            message: 'معرف العميل مطلوب',
          },
        },
        { status: 400 }
      );
    }

    // Create billing portal session
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const session = await createBillingPortalSession(
      customerId,
      `${origin}/settings/billing`
    );

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PORTAL_SESSION_ERROR',
            message: 'فشل في إنشاء جلسة البوابة',
          },
        },
        { status: 500 }
      );
    }

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
