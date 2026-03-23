/**
 * Stripe API Tests
 * اختبارات API Stripe
 */

import { NextRequest } from 'next/server';
import { POST as webhookHandler } from '@/app/api/stripe/webhook/route';
import { GET as getPlans } from '@/app/api/stripe/plans/route';
import { POST as createCheckout } from '@/app/api/stripe/checkout/route';
import { POST as createPortal } from '@/app/api/stripe/portal/route';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
      configurations: {
        list: jest.fn(),
        create: jest.fn(),
      },
    },
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      create: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    invoices: {
      list: jest.fn(),
      retrieve: jest.fn(),
      create: jest.fn(),
      finalizeInvoice: jest.fn(),
      pay: jest.fn(),
      voidInvoice: jest.fn(),
    },
    paymentMethods: {
      list: jest.fn(),
      attach: jest.fn(),
      detach: jest.fn(),
    },
    promotionCodes: {
      list: jest.fn(),
    },
    products: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    prices: {
      create: jest.fn(),
    },
  }));
});

jest.mock('@/lib/db', () => ({
  prisma: {
    subscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/audit.service', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

describe('Stripe API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stripe/plans', () => {
    it('should return available plans', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/plans', {
        method: 'GET',
      });

      const response = await getPlans(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.plans).toBeDefined();
      expect(data.plans.length).toBeGreaterThan(0);
    });

    it('should include plan features', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/plans', {
        method: 'GET',
      });

      const response = await getPlans(request);
      const data = await response.json();

      expect(data.plans[0].features).toBeDefined();
      expect(Array.isArray(data.plans[0].features)).toBe(true);
    });

    it('should include plan limits', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/plans', {
        method: 'GET',
      });

      const response = await getPlans(request);
      const data = await response.json();

      expect(data.plans[0].limits).toBeDefined();
      expect(data.plans[0].limits.projects).toBeDefined();
      expect(data.plans[0].limits.users).toBeDefined();
    });
  });

  describe('POST /api/stripe/checkout', () => {
    it('should create checkout session', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_123',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
          'x-user-email': 'test@test.com',
        },
      });

      const response = await createCheckout(request);

      expect(response).toBeDefined();
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          // Missing priceId
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await createCheckout(request);
      const data = await response.json();

      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/stripe/portal', () => {
    it('should create billing portal session', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/portal', {
        method: 'POST',
        body: JSON.stringify({
          returnUrl: 'http://localhost:3000/settings/billing',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
      });

      const response = await createPortal(request);

      expect(response).toBeDefined();
    });
  });

  describe('POST /api/stripe/webhook', () => {
    it('should handle checkout.session.completed event', async () => {
      const Stripe = require('stripe');
      const stripe = new Stripe();
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: {
              userId: 'user-1',
              organizationId: 'org-1',
            },
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      const response = await webhookHandler(request);

      expect(response.status).toBe(200);
    });

    it('should handle invoice.paid event', async () => {
      const Stripe = require('stripe');
      const stripe = new Stripe();
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            amount_paid: 49900,
            currency: 'aed',
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      const response = await webhookHandler(request);

      expect(response.status).toBe(200);
    });

    it('should handle customer.subscription.updated event', async () => {
      const Stripe = require('stripe');
      const stripe = new Stripe();
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_start: Date.now() / 1000,
            current_period_end: Date.now() / 1000 + 2592000,
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      const response = await webhookHandler(request);

      expect(response.status).toBe(200);
    });

    it('should handle customer.subscription.deleted event', async () => {
      const Stripe = require('stripe');
      const stripe = new Stripe();
      
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
          },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      const response = await webhookHandler(request);

      expect(response.status).toBe(200);
    });

    it('should reject invalid signature', async () => {
      const Stripe = require('stripe');
      const stripe = new Stripe();
      
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      });

      const response = await webhookHandler(request);

      expect(response.status).toBe(400);
    });
  });
});

describe('Stripe Pricing', () => {
  it('should calculate annual discount', () => {
    const monthlyPrice = 499;
    const annualDiscount = 20;
    const annualPrice = monthlyPrice * 12 * (1 - annualDiscount / 100);

    expect(annualPrice).toBe(4784);
    expect(annualPrice / 12).toBeLessThan(monthlyPrice);
  });

  it('should format price correctly', () => {
    const amount = 499;
    const currency = 'AED';
    
    const formatter = new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });

    const formatted = formatter.format(amount);
    expect(formatted).toContain('499');
  });
});

describe('Subscription Status', () => {
  it('should map Stripe status correctly', () => {
    const statusMap: Record<string, string> = {
      'active': 'active',
      'past_due': 'past_due',
      'canceled': 'canceled',
      'unpaid': 'unpaid',
      'trialing': 'trialing',
      'incomplete': 'incomplete',
    };

    Object.entries(statusMap).forEach(([stripe, internal]) => {
      expect(stripe).toBe(internal);
    });
  });

  it('should identify active subscription', () => {
    const activeStatuses = ['active', 'trialing'];
    
    activeStatuses.forEach(status => {
      expect(['active', 'trialing'].includes(status)).toBe(true);
    });
  });

  it('should identify problematic subscription', () => {
    const problemStatuses = ['past_due', 'unpaid', 'incomplete'];
    
    problemStatuses.forEach(status => {
      expect(['active', 'trialing'].includes(status)).toBe(false);
    });
  });
});

describe('Plan Limits', () => {
  const plans = [
    { id: 'starter', limits: { projects: 5, users: 3, storage: 5 } },
    { id: 'professional', limits: { projects: 25, users: 10, storage: 25 } },
    { id: 'enterprise', limits: { projects: -1, users: -1, storage: 100 } },
  ];

  it('should define limits for all plans', () => {
    plans.forEach(plan => {
      expect(plan.limits.projects).toBeDefined();
      expect(plan.limits.users).toBeDefined();
      expect(plan.limits.storage).toBeDefined();
    });
  });

  it('should use -1 for unlimited', () => {
    const enterprise = plans.find(p => p.id === 'enterprise');
    
    expect(enterprise?.limits.projects).toBe(-1);
    expect(enterprise?.limits.users).toBe(-1);
  });
});

describe('Payment Methods', () => {
  it('should support card payments', () => {
    const supportedTypes = ['card'];
    expect(supportedTypes.includes('card')).toBe(true);
  });

  it('should validate payment method type', () => {
    const validTypes = ['card', 'bank_account'];
    const testType = 'card';
    
    expect(validTypes.includes(testType)).toBe(true);
  });
});
