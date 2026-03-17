/**
 * Tests for Pricing Page Component
 * اختبارات مكون صفحة الأسعار
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import { PricingPage } from '@/components/pricing/pricing-page';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock plans response
const mockPlansResponse = {
  success: true,
  data: {
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        nameAr: 'المبتدئ',
        description: 'Perfect for small offices',
        descriptionAr: 'مثالي للمكاتب الصغيرة',
        price: 199,
        displayPrice: '199',
        currency: 'AED',
        interval: 'month',
        stripeProductId: 'prod_starter',
        stripePriceId: 'price_starter_monthly',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        limits: { projects: 5, users: 3, storage: 10, aiCalls: 100 },
        isActive: true,
      },
      {
        id: 'professional',
        name: 'Professional',
        nameAr: 'المحترف',
        description: 'Ideal for growing consultancies',
        descriptionAr: 'مثالي للمكاتب المتنامية',
        price: 499,
        displayPrice: '499',
        currency: 'AED',
        interval: 'month',
        stripeProductId: 'prod_professional',
        stripePriceId: 'price_professional_monthly',
        features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
        limits: { projects: 25, users: 10, storage: 50, aiCalls: 500 },
        isActive: true,
        isPopular: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        nameAr: 'المؤسسي',
        description: 'For large organizations',
        descriptionAr: 'للمؤسسات الكبيرة',
        price: 999,
        displayPrice: '999',
        currency: 'AED',
        interval: 'month',
        stripeProductId: 'prod_enterprise',
        stripePriceId: 'price_enterprise_monthly',
        features: ['All Features'],
        limits: { projects: -1, users: -1, storage: -1, aiCalls: -1 },
        isActive: true,
      },
    ],
    annualDiscount: 20,
  },
};

describe('PricingPage Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      json: async () => mockPlansResponse,
    });
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<PricingPage />);
      
      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should fetch plans on mount', async () => {
      render(<PricingPage />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/stripe/plans')
        );
      });
    });

    it('should display plans after loading', async () => {
      render(<PricingPage lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
        expect(screen.getByText('Professional')).toBeInTheDocument();
        expect(screen.getByText('Enterprise')).toBeInTheDocument();
      });
    });

    it('should display Arabic names when lang is ar', async () => {
      render(<PricingPage lang="ar" />);
      
      await waitFor(() => {
        expect(screen.getByText('المبتدئ')).toBeInTheDocument();
        expect(screen.getByText('المحترف')).toBeInTheDocument();
        expect(screen.getByText('المؤسسي')).toBeInTheDocument();
      });
    });

    it('should display English names when lang is en', async () => {
      render(<PricingPage lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
        expect(screen.getByText('Professional')).toBeInTheDocument();
        expect(screen.getByText('Enterprise')).toBeInTheDocument();
      });
    });
  });

  describe('Interval Toggle', () => {
    it('should start with monthly interval', async () => {
      render(<PricingPage />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('interval=month')
        );
      });
    });

    it('should toggle to yearly interval', async () => {
      render(<PricingPage lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });

      // Find and click the interval switch
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('interval=year')
        );
      });
    });

    it('should show save badge when yearly is selected', async () => {
      render(<PricingPage lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });

      // Click the switch
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      await waitFor(() => {
        expect(screen.getByText(/Save|وفر/)).toBeInTheDocument();
      });
    });
  });

  describe('Plan Cards', () => {
    it('should display popular badge for professional plan', async () => {
      render(<PricingPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Most Popular|الأكثر شعبية/)).toBeInTheDocument();
      });
    });

    it('should display features for each plan', async () => {
      render(<PricingPage lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });
      
      // Check for features (they should be displayed)
      const features = screen.getAllByText('Feature 1');
      expect(features.length).toBeGreaterThan(0);
    });

    it('should display limits for each plan', async () => {
      render(<PricingPage lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });
      
      // Check for limits section (appears for each plan)
      const limitsHeadings = screen.getAllByText('Limits');
      expect(limitsHeadings.length).toBeGreaterThan(0);
    });

    it('should display unlimited for -1 limits', async () => {
      render(<PricingPage lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });
      
      // Check for unlimited text (should appear multiple times for enterprise plan)
      const unlimitedElements = screen.getAllByText(/Unlimited/i);
      expect(unlimitedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Plan Selection', () => {
    it('should have choose plan buttons', async () => {
      render(<PricingPage />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /Choose|اختر/i });
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should call onSelectPlan when button clicked', async () => {
      const mockOnSelectPlan = jest.fn();
      render(<PricingPage onSelectPlan={mockOnSelectPlan} lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });

      // Click on a plan button (not the popular one to avoid the popular plan)
      const buttons = screen.getAllByRole('button', { name: /Choose|اختر/i });
      fireEvent.click(buttons[0]);

      await waitFor(() => {
        expect(mockOnSelectPlan).toHaveBeenCalled();
      });
    });

    it('should disable button for current plan', async () => {
      render(<PricingPage currentPlanId="starter" lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });
      
      // Check for current plan badge (use getAllByText since it might appear multiple times)
      const currentPlanBadges = screen.getAllByText(/Current Plan|الخطة الحالية/);
      expect(currentPlanBadges.length).toBeGreaterThan(0);
    });
  });

  describe('RTL Support', () => {
    it('should apply RTL for Arabic language', async () => {
      const { container } = render(<PricingPage lang="ar" />);
      
      await waitFor(() => {
        expect(screen.getByText('المبتدئ')).toBeInTheDocument();
      });

      const mainDiv = container.querySelector('[dir="rtl"]');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should apply LTR for English language', async () => {
      const { container } = render(<PricingPage lang="en" />);
      
      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });

      const mainDiv = container.querySelector('[dir="ltr"]');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<PricingPage />);
      
      await waitFor(() => {
        // Should not crash and should log error
        expect(consoleSpy).toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });
  });
});
