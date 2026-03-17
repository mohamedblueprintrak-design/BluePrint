/**
 * Tests for Stripe Utility Functions
 * اختبارات دوال Stripe المساعدة
 */

import {
  calculateAnnualPrice,
  formatPrice,
  DEFAULT_PLANS,
  ANNUAL_DISCOUNT_PERCENT,
  isStripeConfigured,
  mapStripeStatus,
} from '@/lib/stripe';

describe('Stripe Utilities', () => {
  describe('calculateAnnualPrice', () => {
    it('should calculate annual price with 20% discount', () => {
      const monthlyPrice = 100;
      const annualPrice = calculateAnnualPrice(monthlyPrice);
      
      // Monthly * 12 = 1200, with 20% discount = 960
      expect(annualPrice).toBe(960);
    });

    it('should handle zero price', () => {
      expect(calculateAnnualPrice(0)).toBe(0);
    });

    it('should handle decimal prices', () => {
      const annualPrice = calculateAnnualPrice(199.99);
      expect(typeof annualPrice).toBe('number');
    });

    it('should round to nearest integer', () => {
      const annualPrice = calculateAnnualPrice(199);
      // 199 * 12 = 2388, 20% discount = 478.4, result = 1909.6, rounded = 1910
      expect(annualPrice).toBe(1910);
    });

    it('should apply correct discount percentage', () => {
      const monthlyPrice = 500;
      const annualPrice = calculateAnnualPrice(monthlyPrice);
      const expectedDiscount = monthlyPrice * 12 * (ANNUAL_DISCOUNT_PERCENT / 100);
      const expectedAnnual = Math.round(monthlyPrice * 12 - expectedDiscount);
      expect(annualPrice).toBe(expectedAnnual);
    });
  });

  describe('formatPrice', () => {
    it('should format price in AED by default', () => {
      const formatted = formatPrice(199);
      expect(formatted).toContain('199');
    });

    it('should format price with currency code', () => {
      const formatted = formatPrice(499, 'AED');
      expect(formatted).toContain('499');
    });

    it('should handle large numbers', () => {
      const formatted = formatPrice(999999);
      expect(formatted).toContain('999');
    });

    it('should handle zero price', () => {
      const formatted = formatPrice(0);
      expect(formatted).toContain('0');
    });
  });

  describe('mapStripeStatus', () => {
    it('should map active status correctly', () => {
      expect(mapStripeStatus('active')).toBe('active');
    });

    it('should map past_due status correctly', () => {
      expect(mapStripeStatus('past_due')).toBe('past_due');
    });

    it('should map canceled status correctly', () => {
      expect(mapStripeStatus('canceled')).toBe('canceled');
    });

    it('should map trialing status correctly', () => {
      expect(mapStripeStatus('trialing')).toBe('trialing');
    });

    it('should map incomplete status correctly', () => {
      expect(mapStripeStatus('incomplete')).toBe('incomplete');
    });

    it('should map incomplete_expired to expired', () => {
      expect(mapStripeStatus('incomplete_expired')).toBe('expired');
    });

    it('should map paused status correctly', () => {
      expect(mapStripeStatus('paused')).toBe('paused');
    });

    it('should return unknown for unrecognized status', () => {
      expect(mapStripeStatus('invalid_status' as any)).toBe('unknown');
    });
  });

  describe('DEFAULT_PLANS', () => {
    it('should have 3 plans defined', () => {
      expect(DEFAULT_PLANS).toHaveLength(3);
    });

    it('should have starter as first plan', () => {
      expect(DEFAULT_PLANS[0].id).toBe('starter');
    });

    it('should have professional as second plan', () => {
      expect(DEFAULT_PLANS[1].id).toBe('professional');
    });

    it('should have enterprise as third plan', () => {
      expect(DEFAULT_PLANS[2].id).toBe('enterprise');
    });

    it('should mark professional as popular', () => {
      expect(DEFAULT_PLANS[1].isPopular).toBe(true);
    });

    it('should have valid pricing for all plans', () => {
      DEFAULT_PLANS.forEach(plan => {
        expect(plan.price).toBeGreaterThan(0);
        expect(plan.currency).toBe('AED');
      });
    });

    it('should have limits defined for all plans', () => {
      DEFAULT_PLANS.forEach(plan => {
        expect(plan.limits).toHaveProperty('projects');
        expect(plan.limits).toHaveProperty('users');
        expect(plan.limits).toHaveProperty('storage');
      });
    });

    it('should have features array for all plans', () => {
      DEFAULT_PLANS.forEach(plan => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it('should have -1 for unlimited limits in enterprise', () => {
      const enterprise = DEFAULT_PLANS.find(p => p.id === 'enterprise');
      expect(enterprise?.limits.projects).toBe(-1);
      expect(enterprise?.limits.users).toBe(-1);
    });

    it('should have Arabic names for all plans', () => {
      DEFAULT_PLANS.forEach(plan => {
        expect(plan.nameAr).toBeDefined();
        expect(plan.nameAr.length).toBeGreaterThan(0);
      });
    });

    it('should have Arabic descriptions for all plans', () => {
      DEFAULT_PLANS.forEach(plan => {
        expect(plan.descriptionAr).toBeDefined();
        expect(plan.descriptionAr.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ANNUAL_DISCOUNT_PERCENT', () => {
    it('should be set to 20', () => {
      expect(ANNUAL_DISCOUNT_PERCENT).toBe(20);
    });
  });

  describe('isStripeConfigured', () => {
    it('should be a boolean', () => {
      expect(typeof isStripeConfigured).toBe('boolean');
    });

    it('should be false without STRIPE_SECRET_KEY', () => {
      expect(isStripeConfigured).toBe(false);
    });
  });
});
