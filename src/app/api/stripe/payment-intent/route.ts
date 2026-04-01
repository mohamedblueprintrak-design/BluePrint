/**
 * API Route: Stripe Payment Intent
 * مسار نية الدفع Stripe
 * 
 * POST - Create payment intent for one-time payment
 * GET - Retrieve payment intent status
 */

import { NextRequest} from 'next/server';
import {
  createPaymentIntent,
  retrievePaymentIntent,
    isStripeConfigured,
} from '@/lib/stripe';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { getUserFromRequest } from '../../utils/demo-config';

/**
 * POST - Create a payment intent
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
    const { amount, currency = 'AED', customerId, description, metadata } = body;

    if (!amount || amount <= 0) {
      return errorResponse('المبلغ يجب أن يكون أكبر من صفر', 'INVALID_AMOUNT', 400);
    }

    // Validate amount limits (minimum 1 AED = 100 fils)
    if (amount < 1) {
      return errorResponse('الحد الأدنى للدفع هو 1 درهم', 'AMOUNT_TOO_SMALL', 400);
    }

    // Maximum amount (1,000,000 AED)
    if (amount > 1000000) {
      return errorResponse('الحد الأقصى للدفع هو 1,000,000 درهم', 'AMOUNT_TOO_LARGE', 400);
    }

    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      customerId,
      description,
      metadata,
    });

    if (!paymentIntent) {
      return errorResponse('فشل في إنشاء نية الدفع', 'PAYMENT_INTENT_ERROR', 500);
    }

    return successResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return errorResponse(
      'حدث خطأ أثناء إنشاء نية الدفع',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * GET - Retrieve payment intent status
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
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return errorResponse('معرف نية الدفع مطلوب', 'MISSING_PAYMENT_INTENT_ID', 400);
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      return errorResponse('نية الدفع غير موجودة', 'PAYMENT_INTENT_NOT_FOUND', 404);
    }

    return successResponse({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent retrieval error:', error);
    return errorResponse(
      'حدث خطأ أثناء استرجاع نية الدفع',
      'INTERNAL_ERROR',
      500
    );
  }
}
