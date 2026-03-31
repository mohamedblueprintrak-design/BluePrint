/**
 * API Route: Stripe Webhook Handler
 * معالج Webhook من Stripe
 * 
 * Handles the following events:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.created: Subscription created
 * - customer.subscription.updated: Subscription updated
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.paid: Payment successful
 * - invoice.payment_failed: Payment failed
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { constructWebhookEvent, mapStripeStatus } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

// Webhook secret from environment
const _WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  // Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  // Verify webhook signature
  let event: Stripe.Event | null;
  try {
    event = constructWebhookEvent(body, signature);
    if (!event) {
      log.error('Webhook signature verification failed: null event');
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
  } catch (err) {
    log.error('Webhook signature verification failed', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Log the event for payment audit trail
  log.info(`Stripe webhook received: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        log.info(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error('Error processing webhook', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { organizationId, planId } = session.metadata || {};

  if (!organizationId || !planId) {
    log.error('Missing metadata in checkout session');
    return;
  }

  try {
    // Try to find existing subscription
    const existingSubscription = await db.subscription.findFirst({
      where: {
        stripeSubscriptionId: session.subscription as string,
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    } else {
      // Create new subscription
      await db.subscription.create({
        data: {
          organizationId,
          planId,
          status: 'ACTIVE',
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          stripePaymentIntentId: session.payment_intent as string,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Update organization plan
    await db.organization.update({
      where: { id: organizationId },
      data: {
        planId,
      },
    });

    log.info(`Checkout completed for organization: ${organizationId}`);
  } catch {
    log.warn('Database not available, logging event only');
    log.warn('Checkout completed', { organizationId, planId, sessionId: session.id });
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { organizationId, planId } = subscription.metadata || {};

  log.info('Subscription created', {
    id: subscription.id,
    status: subscription.status,
    organizationId,
    planId,
  });
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { _organizationId } = subscription.metadata || {};
  const status = mapStripeStatus(subscription.status);
  
  // Access properties safely
  const sub = subscription as any;

  try {
    // Update subscription in database
    await db.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: status as 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });

    log.info(`Subscription updated: ${subscription.id}, status: ${status}`);
  } catch {
    log.warn('Database not available, logging event only');
    log.info('Subscription updated', { subscriptionId: subscription.id, status });
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { _organizationId } = subscription.metadata || {};

  try {
    // Update subscription status to canceled
    await db.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: 'CANCELED',
      },
    });

    log.info(`Subscription canceled: ${subscription.id}`);
  } catch {
    log.warn('Database not available, logging event only');
    log.info('Subscription canceled', { subscriptionId: subscription.id });
  }
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  const subscriptionId = inv.subscription as string;

  try {
    // Create payment record
    await db.payment.create({
      data: {
        subscriptionId: subscriptionId, // This would need the actual subscription ID from our DB
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'SUCCEEDED',
        stripePaymentIntentId: inv.payment_intent as string,
        stripeInvoiceId: invoice.id,
        receiptUrl: invoice.hosted_invoice_url || undefined,
        description: `Invoice ${invoice.number}`,
      },
    });

    log.info(`Invoice paid: ${invoice.id}, amount: ${invoice.amount_paid}`);
  } catch {
    log.warn('Database not available, logging event only');
    log.info('Invoice paid', { invoiceId: invoice.id, amount: invoice.amount_paid });
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  const { _organizationId } = inv.metadata || {};

  try {
    // Update subscription status to past_due
    if (inv.subscription) {
      await db.subscription.updateMany({
        where: {
          stripeSubscriptionId: inv.subscription as string,
        },
        data: {
          status: 'PAST_DUE',
        },
      });
    }

    log.info(`Invoice payment failed: ${invoice.id}`);
  } catch {
    log.warn('Database not available, logging event only');
    log.info('Invoice payment failed', { invoiceId: invoice.id });
  }
}
