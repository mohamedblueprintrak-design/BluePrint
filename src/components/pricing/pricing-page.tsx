'use client';

/**
 * Pricing Page Component
 * صفحة خطط الأسعار
 */

import { useState, useEffect } from 'react';
import { Check, Sparkles, Building2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PlanLimit {
  projects: number;
  users: number;
  storage: number;
  invoices: number;
  aiCalls: number;
}

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  displayPrice: string;
  currency: string;
  interval: 'month' | 'year';
  stripeProductId?: string;
  stripePriceId?: string;
  features: string[];
  limits: PlanLimit;
  isActive: boolean;
  isPopular?: boolean;
}

interface PricingPageProps {
  organizationId?: string;
  currentPlanId?: string;
  onSelectPlan?: (planId: string, interval: 'month' | 'year') => void;
  lang?: 'ar' | 'en';
}

export function PricingPage({
  organizationId,
  currentPlanId,
  onSelectPlan,
  lang = 'ar',
}: PricingPageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [annualDiscount, setAnnualDiscount] = useState(20);

  const isRTL = lang === 'ar';

  // Fetch plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch(`/api/stripe/plans?interval=${interval}&lang=${lang}`);
        const data = await response.json();
        if (data.success) {
          setPlans(data.data.plans);
          setAnnualDiscount(data.data.annualDiscount);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, [interval, lang]);

  // Handle plan selection
  const handleSelectPlan = async (plan: Plan) => {
    if (!plan.stripePriceId) {
      // Show demo message if Stripe is not configured
      toast.info(lang === 'ar' 
        ? 'هذه الميزة قيد التطوير. يرجى التواصل مع الدعم للتفعيل.' 
        : 'This feature is under development. Please contact support to activate.');
      return;
    }

    setProcessingPlanId(plan.id);

    try {
      if (onSelectPlan) {
        onSelectPlan(plan.id, interval);
      } else {
        // Default behavior: create checkout session
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            interval,
            organizationId,
            email: 'demo@blueprint.ae',
            name: 'Demo Organization',
          }),
        });

        const data = await response.json();

        if (data.success && data.data.url) {
          window.location.href = data.data.url;
        } else {
          throw new Error(data.error?.message || 'Failed to create checkout session');
        }
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error(lang === 'ar' 
        ? 'حدث خطأ أثناء معالجة الطلب' 
        : 'An error occurred while processing your request');
    } finally {
      setProcessingPlanId(null);
    }
  };

  // Format limit display
  const formatLimit = (value: number, label: string): string => {
    if (value === -1) {
      return lang === 'ar' ? `${label} غير محدود` : `Unlimited ${label}`;
    }
    return lang === 'ar' ? `${value} ${label}` : `${value} ${label}`;
  };

  // Get plan icon
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Building2 className="w-6 h-6" />;
      case 'professional':
        return <Sparkles className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Building2 className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 py-12 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {lang === 'ar' ? 'اختر الخطة المناسبة لمكتبك' : 'Choose the Right Plan for Your Office'}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {lang === 'ar' 
            ? 'جميع الخطط تشمل تحديثات مجانية ودعم فني على مدار الساعة' 
            : 'All plans include free updates and 24/7 support'}
        </p>

        {/* Interval Toggle */}
        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="interval-toggle" className={`text-sm ${interval === 'month' ? 'text-foreground' : 'text-muted-foreground'}`}>
            {lang === 'ar' ? 'شهري' : 'Monthly'}
          </Label>
          <Switch
            id="interval-toggle"
            checked={interval === 'year'}
            onCheckedChange={(checked) => setInterval(checked ? 'year' : 'month')}
          />
          <Label htmlFor="interval-toggle" className={`text-sm ${interval === 'year' ? 'text-foreground' : 'text-muted-foreground'}`}>
            {lang === 'ar' ? 'سنوي' : 'Yearly'}
          </Label>
          {interval === 'year' && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              {lang === 'ar' ? `وفر ${annualDiscount}%` : `Save ${annualDiscount}%`}
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const isProcessing = processingPlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={`
                relative bg-card border-border backdrop-blur-sm
                ${plan.isPopular ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}
                ${isCurrentPlan ? 'border-green-500 ring-2 ring-green-500/20' : ''}
                hover:border-border transition-all duration-300
              `}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-foreground px-4 py-1">
                    {lang === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 text-foreground px-4 py-1">
                    {lang === 'ar' ? 'خطتك الحالية' : 'Your Current Plan'}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-2xl text-foreground">
                  {lang === 'ar' ? plan.nameAr : plan.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {lang === 'ar' ? plan.descriptionAr : plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-4">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.displayPrice}</span>
                    <span className="text-muted-foreground">
                      /{interval === 'month' 
                        ? (lang === 'ar' ? 'شهر' : 'mo') 
                        : (lang === 'ar' ? 'سنة' : 'yr')}
                    </span>
                  </div>
                  {interval === 'year' && (
                    <p className="text-sm text-green-400 mt-1">
                      {lang === 'ar' 
                        ? `${Math.round(plan.price / 12)} درهم/شهر تقريباً` 
                        : `${Math.round(plan.price / 12)} AED/mo approx`}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-foreground/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    {lang === 'ar' ? 'الحدود' : 'Limits'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted rounded px-2 py-1 text-foreground/80">
                      {formatLimit(plan.limits.projects, lang === 'ar' ? 'مشاريع' : 'projects')}
                    </div>
                    <div className="bg-muted rounded px-2 py-1 text-foreground/80">
                      {formatLimit(plan.limits.users, lang === 'ar' ? 'مستخدمين' : 'users')}
                    </div>
                    <div className="bg-muted rounded px-2 py-1 text-foreground/80">
                      {formatLimit(plan.limits.storage, 'GB')}
                    </div>
                    <div className="bg-muted rounded px-2 py-1 text-foreground/80">
                      {formatLimit(plan.limits.aiCalls, lang === 'ar' ? 'استدعاء AI' : 'AI calls')}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className={`
                    w-full
                    ${plan.isPopular 
                      ? 'bg-blue-500 hover:bg-blue-600 text-foreground' 
                      : 'bg-muted hover:bg-secondary text-foreground'}
                    ${isCurrentPlan ? 'bg-green-500 hover:bg-green-600' : ''}
                  `}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isProcessing || isCurrentPlan}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                    </div>
                  ) : isCurrentPlan ? (
                    lang === 'ar' ? 'الخطة الحالية' : 'Current Plan'
                  ) : (
                    lang === 'ar' ? 'اختر الخطة' : 'Choose Plan'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {lang === 'ar' ? 'هل لديك أسئلة؟' : 'Have Questions?'}
        </h2>
        <p className="text-muted-foreground mb-4">
          {lang === 'ar' 
            ? 'تواصل معنا على support@blueprint.ae أو اتصل على +971 50 000 0000' 
            : 'Contact us at support@blueprint.ae or call +971 50 000 0000'}
        </p>
      </div>
    </div>
  );
}
