/**
 * API Route: Stripe Subscriptions Management
 * مسار إدارة الاشتراكات Stripe
 * 
 * GET - Get subscription details
 * POST - Create subscription
 * PUT - Update subscription (upgrade/downgrade)
 * DELETE - Cancel subscription
 */

import { NextRequest} from 'next/server';
import {
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  isStripeConfigured,
} from '@/lib/stripe';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { getUserFromRequest } from '../../utils/demo-config';

/**
 * GET - Retrieve subscription details
 */
export async function GET(request: NextRequest) {
  if (!isStripeConfigured) {
    return errorResponse('نظام الدفع غير مُعد', 'STRIPE_NOT_CONFIGURED', 503);
  }

  // SECURITY: Require authentication
  const user = await getUserFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return errorResponse('معرف الاشتراك مطلوب', 'MISSING_SUBSCRIPTION_ID', 400);
    }

    const subscription = await getSubscription(subscriptionId);

    if (!subscription) {
      return errorResponse('الاشتراك غير موجود', 'SUBSCRIPTION_NOT_FOUND', 404);
    }

    const sub = subscription as any;

    return successResponse({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      plan: {
        id: subscription.items.data[0]?.price?.id,
        amount: subscription.items.data[0]?.price?.unit_amount,
        currency: subscription.items.data[0]?.price?.currency,
        interval: subscription.items.data[0]?.price?.recurring?.interval,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return errorResponse(
      'حدث خطأ أثناء استرجاع الاشتراك',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * POST - Create a new subscription
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured) {
    return errorResponse('نظام الدفع غير مُعد', 'STRIPE_NOT_CONFIGURED', 503);
  }

  // SECURITY: Require authentication
  const user = await getUserFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { customerId, priceId, trialPeriodDays, metadata } = body;

    if (!customerId || !priceId) {
      return errorResponse('معرف العميل ومعرف السعر مطلوبان', 'MISSING_FIELDS', 400);
    }

    const subscription = await createSubscription({
      customerId,
      priceId,
      trialPeriodDays,
      metadata,
    });

    if (!subscription) {
      return errorResponse('فشل في إنشاء الاشتراك', 'SUBSCRIPTION_CREATE_ERROR', 500);
    }

    const sub = subscription as any;

    return successResponse({
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: sub.latest_invoice?.payment_intent?.client_secret,
      message: trialPeriodDays 
        ? `تم إنشاء الاشتراك مع فترة تجريبية ${trialPeriodDays} يوم`
        : 'تم إنشاء الاشتراك بنجاح',
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return errorResponse(
      'حدث خطأ أثناء إنشاء الاشتراك',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * PUT - Update subscription (upgrade/downgrade)
 */
export async function PUT(request: NextRequest) {
  if (!isStripeConfigured) {
    return errorResponse('نظام الدفع غير مُعد', 'STRIPE_NOT_CONFIGURED', 503);
  }

  // SECURITY: Require authentication
  const user = await getUserFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { subscriptionId, newPriceId, prorationBehavior, action, metadata } = body;

    if (!subscriptionId) {
      return errorResponse('معرف الاشتراك مطلوب', 'MISSING_SUBSCRIPTION_ID', 400);
    }

    // Handle reactivation
    if (action === 'reactivate') {
      const subscription = await reactivateSubscription(subscriptionId);
      
      if (!subscription) {
        return errorResponse('فشل في إعادة تفعيل الاشتراك', 'REACTIVATE_ERROR', 500);
      }

      return successResponse({
        message: 'تم إعادة تفعيل الاشتراك بنجاح',
        status: subscription.status,
      });
    }

    // Handle upgrade/downgrade
    if (!newPriceId) {
      return errorResponse('معرف السعر الجديد مطلوب', 'MISSING_NEW_PRICE_ID', 400);
    }

    const subscription = await updateSubscription(subscriptionId, {
      newPriceId,
      prorationBehavior: prorationBehavior || 'create_prorations',
      metadata,
    });

    if (!subscription) {
      return errorResponse('فشل في تحديث الاشتراك', 'SUBSCRIPTION_UPDATE_ERROR', 500);
    }

    return successResponse({
      message: 'تم تحديث الاشتراك بنجاح',
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return errorResponse(
      'حدث خطأ أثناء تحديث الاشتراك',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * DELETE - Cancel subscription
 */
export async function DELETE(request: NextRequest) {
  if (!isStripeConfigured) {
    return errorResponse('نظام الدفع غير مُعد', 'STRIPE_NOT_CONFIGURED', 503);
  }

  // SECURITY: Require authentication
  const user = await getUserFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { subscriptionId, immediately = false, _reason } = body;

    if (!subscriptionId) {
      return errorResponse('معرف الاشتراك مطلوب', 'MISSING_SUBSCRIPTION_ID', 400);
    }

    const subscription = await cancelSubscription(subscriptionId, !immediately);

    if (!subscription) {
      return errorResponse('فشل في إلغاء الاشتراك', 'CANCEL_ERROR', 500);
    }

    return successResponse({
      message: immediately
        ? 'تم إلغاء الاشتراك فوراً'
        : 'سيتم إلغاء الاشتراك في نهاية الفترة الحالية',
      status: subscription.status,
      cancelAtPeriodEnd: !immediately,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return errorResponse(
      'حدث خطأ أثناء إلغاء الاشتراك',
      'INTERNAL_ERROR',
      500
    );
  }
}
