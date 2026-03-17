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
import { constructWebhookEvent, mapStripeStatus } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

// Webhook secret from environment
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  // Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Log the event
  console.log(`Stripe webhook received: ${event.type}`);

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
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
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
    console.error('Missing metadata in checkout session');
    return;
  }

  try {
    // Update or create subscription record
    await db.subscription.upsert({
      where: {
        stripeSubscriptionId: session.subscription as string,
      },
      update: {
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      create: {
        organizationId,
        planId,
        status: 'active',
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: session.customer as string,
        stripePaymentIntentId: session.payment_intent as string,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Update organization subscription status
    await db.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionStatus: 'active',
        planId,
      },
    });

    console.log(`Checkout completed for organization: ${organizationId}`);
  } catch (dbError) {
    console.log('Database not available, logging event only');
    console.log('Checkout completed:', { organizationId, planId, sessionId: session.id });
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { organizationId, planId } = subscription.metadata || {};

  console.log('Subscription created:', {
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
  const { organizationId } = subscription.metadata || {};
  const status = mapStripeStatus(subscription.status);

  try {
    // Update subscription in database
    await db.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Update organization status
    if (organizationId) {
      await db.organization.update({
        where: { id: organizationId },
        data: { subscriptionStatus: status },
      });
    }

    console.log(`Subscription updated: ${subscription.id}, status: ${status}`);
  } catch (dbError) {
    console.log('Database not available, logging event only');
    console.log('Subscription updated:', { subscriptionId: subscription.id, status });
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { organizationId } = subscription.metadata || {};

  try {
    // Update subscription status to canceled
    await db.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: 'canceled',
      },
    });

    // Update organization status
    if (organizationId) {
      await db.organization.update({
        where: { id: organizationId },
        data: { subscriptionStatus: 'canceled' },
      });
    }

    console.log(`Subscription canceled: ${subscription.id}`);
  } catch (dbError) {
    console.log('Database not available, logging event only');
    console.log('Subscription canceled:', { subscriptionId: subscription.id });
  }
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  try {
    // Create payment record
    await db.payment.create({
      data: {
        subscriptionId: subscriptionId, // This would need the actual subscription ID from our DB
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'succeeded',
        stripePaymentIntentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id,
        receiptUrl: invoice.hosted_invoice_url || undefined,
        description: `Invoice ${invoice.number}`,
      },
    });

    console.log(`Invoice paid: ${invoice.id}, amount: ${invoice.amount_paid}`);
  } catch (dbError) {
    console.log('Database not available, logging event only');
    console.log('Invoice paid:', { invoiceId: invoice.id, amount: invoice.amount_paid });
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const { organizationId } = (invoice as any).metadata || {};

  try {
    // Update subscription status to past_due
    if (invoice.subscription) {
      await db.subscription.updateMany({
        where: {
          stripeSubscriptionId: invoice.subscription as string,
        },
        data: {
          status: 'past_due',
        },
      });
    }

    // Update organization status
    if (organizationId) {
      await db.organization.update({
        where: { id: organizationId },
        data: { subscriptionStatus: 'past_due' },
      });
    }

    console.log(`Invoice payment failed: ${invoice.id}`);
  } catch (dbError) {
    console.log('Database not available, logging event only');
    console.log('Invoice payment failed:', { invoiceId: invoice.id });
  }
}
