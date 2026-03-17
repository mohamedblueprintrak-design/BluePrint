/**
 * Stripe Configuration for BluePrint SaaS Platform
 * إعدادات Stripe لمنصة BluePrint
 * 
 * This module provides Stripe integration with graceful fallback
 * when Stripe is not configured.
 */

import Stripe from 'stripe';

// ============================================
// Configuration
// ============================================

/** Check if Stripe is properly configured */
export const isStripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 0);

/** Stripe webhook secret for signature verification */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/** Annual discount percentage */
export const ANNUAL_DISCOUNT_PERCENT = 20;

// ============================================
// Lazy Stripe Client
// ============================================

let _stripe: Stripe | null = null;

/**
 * Get Stripe client instance
 * Throws error if Stripe is not configured
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Safe Stripe operation wrapper
 * Returns null if Stripe is not configured
 */
export async function safeStripeOp<T>(
  operation: (stripe: Stripe) => Promise<T>
): Promise<T | null> {
  if (!isStripeConfigured) {
    return null;
  }
  try {
    return await operation(getStripe());
  } catch (error) {
    console.error('Stripe operation failed:', error);
    return null;
  }
}

// ============================================
// Pricing Plans
// ============================================

export interface PricingPlan {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripeProductId?: string;
  stripePriceId?: string;
  features: string[];
  limits: {
    projects: number;
    users: number;
    storage: number;
    invoices: number;
    aiCalls: number;
  };
  isActive: boolean;
  isPopular?: boolean;
}

/** Default pricing plans */
export const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    nameAr: 'المبتدئ',
    description: 'Perfect for small engineering offices',
    descriptionAr: 'مثالي للمكاتب الهندسية الصغيرة',
    price: 199,
    currency: 'AED',
    interval: 'month',
    features: [
      'Up to 5 projects',
      'Up to 3 users',
      '5GB storage',
      'Basic reports',
      'Email support',
      'AI assistant (100 calls/month)',
    ],
    limits: {
      projects: 5,
      users: 3,
      storage: 5,
      invoices: 50,
      aiCalls: 100,
    },
    isActive: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    nameAr: 'المحترف',
    description: 'Ideal for growing consultancies',
    descriptionAr: 'مثالي للمكاتب النامية',
    price: 499,
    currency: 'AED',
    interval: 'month',
    features: [
      'Up to 25 projects',
      'Up to 10 users',
      '25GB storage',
      'Advanced reports & analytics',
      'Priority support',
      'AI assistant (500 calls/month)',
      'Client portal',
      'API access',
    ],
    limits: {
      projects: 25,
      users: 10,
      storage: 25,
      invoices: 500,
      aiCalls: 500,
    },
    isActive: true,
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameAr: 'المؤسسي',
    description: 'For large engineering firms',
    descriptionAr: 'للمؤسسات الهندسية الكبيرة',
    price: 999,
    currency: 'AED',
    interval: 'month',
    features: [
      'Unlimited projects',
      'Unlimited users',
      '100GB storage',
      'Custom reports & dashboards',
      '24/7 dedicated support',
      'AI assistant (unlimited)',
      'Client & contractor portals',
      'Full API access',
      'Custom integrations',
      'On-premise deployment option',
    ],
    limits: {
      projects: -1,
      users: -1,
      storage: 100,
      invoices: -1,
      aiCalls: -1,
    },
    isActive: true,
  },
];

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate annual price with discount
 */
export function calculateAnnualPrice(monthlyPrice: number): number {
  const annualBeforeDiscount = monthlyPrice * 12;
  const discount = annualBeforeDiscount * (ANNUAL_DISCOUNT_PERCENT / 100);
  return Math.round(annualBeforeDiscount - discount);
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'AED'): string {
  const formatter = new Intl.NumberFormat('ar-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

/**
 * Map Stripe subscription status to our status
 */
export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    paused: 'paused',
  };
  return statusMap[stripeStatus] || 'unknown';
}

// ============================================
// Stripe Operations (require configuration)
// ============================================

/**
 * Create Stripe customer
 */
export async function createStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer | null> {
  return safeStripeOp(async (s) => {
    return await s.customers.create({
      email,
      name,
      metadata: {
        ...metadata,
        platform: 'blueprint',
      },
    });
  });
}

/**
 * Create checkout session
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session | null> {
  return safeStripeOp(async (s) => {
    return await s.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: {
        metadata: params.metadata,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });
  });
}

/**
 * Create billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session | null> {
  return safeStripeOp(async (s) => {
    return await s.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  });
}

/**
 * Get subscription
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  return safeStripeOp(async (s) => {
    return await s.subscriptions.retrieve(subscriptionId);
  });
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription | null> {
  return safeStripeOp(async (s) => {
    if (cancelAtPeriodEnd) {
      return await s.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return await s.subscriptions.cancel(subscriptionId);
  });
}

/**
 * Construct webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!isStripeConfigured || !STRIPE_WEBHOOK_SECRET) {
    return null;
  }
  try {
    return getStripe().webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}
