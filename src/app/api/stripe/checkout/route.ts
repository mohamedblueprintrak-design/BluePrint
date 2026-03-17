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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, interval = 'month', organizationId, email, name } = body;

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
    let organization;
    let stripeCustomerId: string;

    try {
      organization = await db.organization.findUnique({
        where: { id: organizationId },
      });

      // Check if organization already has a Stripe customer ID
      if (organization?.stripeCustomerId) {
        stripeCustomerId = organization.stripeCustomerId;
      } else {
        // Create new Stripe customer
        const customer = await createStripeCustomer(email, name, {
          organizationId,
          planId,
        });
        stripeCustomerId = customer.id;

        // Update organization with Stripe customer ID
        if (organization) {
          await db.organization.update({
            where: { id: organizationId },
            data: { stripeCustomerId },
          });
        }
      }
    } catch (dbError) {
      // If database is not available, create customer anyway
      console.log('Database not available, creating Stripe customer directly');
      const customer = await createStripeCustomer(email, name, {
        organizationId,
        planId,
      });
      stripeCustomerId = customer.id;
    }

    // Get Stripe price ID based on interval
    // Note: In production, you would create products and prices in Stripe Dashboard
    // and store the IDs in the database
    const stripePriceId = plan.stripePriceId;

    if (!stripePriceId) {
      // For demo/testing, we'll return an error
      // In production, every plan should have a Stripe price ID
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STRIPE_PRICE_NOT_CONFIGURED',
            message: 'سعر Stripe غير مُعد لهذه الخطة. يرجى التواصل مع الدعم.',
            details: 'This plan needs to be configured with a Stripe Price ID in the admin panel.',
          },
        },
        { status: 400 }
      );
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
