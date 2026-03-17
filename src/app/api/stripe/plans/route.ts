/**
 * API Route: Get Pricing Plans
 * الحصول على خطط الأسعار
 */

import { NextResponse } from 'next/server';
import { 
  DEFAULT_PLANS, 
  calculateAnnualPrice, 
  formatPrice, 
  isStripeConfigured 
} from '@/lib/stripe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || 'month';
    const lang = searchParams.get('lang') || 'ar';

    // Use default plans
    const plans = DEFAULT_PLANS.map((plan) => {
      const price = interval === 'year'
        ? calculateAnnualPrice(plan.price)
        : plan.price;

      return {
        id: plan.id,
        name: lang === 'ar' ? plan.nameAr : plan.name,
        nameAr: plan.nameAr,
        description: lang === 'ar' ? plan.descriptionAr : plan.description,
        descriptionAr: plan.descriptionAr,
        price,
        displayPrice: formatPrice(price, plan.currency),
        currency: plan.currency,
        interval,
        stripeProductId: plan.stripeProductId,
        stripePriceId: plan.stripePriceId,
        features: plan.features,
        limits: plan.limits,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        plans,
        interval,
        annualDiscount: 20, // 20% discount for annual
        stripeConfigured: isStripeConfigured,
      },
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PLANS_FETCH_ERROR',
          message: 'حدث خطأ أثناء جلب الخطط',
        },
      },
      { status: 500 }
    );
  }
}
