/**
 * API Route: Create Stripe Checkout Session
 * إنشاء جلسة دفع Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createCheckoutSession,
  createStripeCustomer,
  DEFAULT_PLANS,
} from '@/lib/stripe';
import { db } from '@/lib/db';
import { getUserFromRequest } from '../../utils/demo-config';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'غير مصرح',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, interval = 'month', organizationId, email, name } = body;

    // SECURITY: Verify the organizationId belongs to the authenticated user
    if (organizationId && user.organizationId && organizationId !== user.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'غير مصرح بهذا التنظيم',
          },
        },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!planId || !organizationId || !email || !name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'جميع الحقول مطلوبة',
          },
        },
        { status: 400 }
      );
    }

    // Find the plan
    const plan = DEFAULT_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'الخطة غير موجودة',
          },
        },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined;

    try {
      const _organization = await db.organization.findUnique({
        where: { id: organizationId },
      });

      // For demo purposes, create a new customer
      const customer = await createStripeCustomer(email, name, {
        organizationId,
        planId,
      });
      
      if (customer) {
        stripeCustomerId = customer.id;
      }
    } catch {
      // If database is not available, create customer anyway
      console.log('Database not available, creating Stripe customer directly');
      const customer = await createStripeCustomer(email, name, {
        organizationId,
        planId,
      });
      
      if (customer) {
        stripeCustomerId = customer.id;
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STRIPE_CUSTOMER_ERROR',
            message: 'فشل في إنشاء عميل Stripe',
          },
        },
        { status: 500 }
      );
    }

    // Get Stripe price ID based on interval
    const stripePriceId = plan.stripePriceId;

    if (!stripePriceId) {
      // For demo/testing, return a mock response
      return NextResponse.json({
        success: true,
        data: {
          sessionId: `cs_test_${Date.now()}`,
          url: `${request.headers.get('origin') || 'http://localhost:3000'}/settings/billing?demo=true`,
          message: 'وضع تجريبي - Stripe غير مُعد',
        },
      });
    }

    // Create checkout session
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: stripePriceId,
      successUrl: `${origin}/settings/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${origin}/settings/billing?canceled=true`,
      metadata: {
        organizationId,
        planId,
        interval,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CHECKOUT_SESSION_ERROR',
            message: 'فشل في إنشاء جلسة الدفع',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CHECKOUT_ERROR',
          message: 'حدث خطأ أثناء إنشاء جلسة الدفع',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
