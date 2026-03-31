'use client';

/**
 * Billing Page Component
 * صفحة الفوترة والدفع
 * 
 * Provides complete billing management:
 * - Current plan display
 * - Usage statistics
 * - Payment methods
 * - Payment history
 * - Plan upgrade/downgrade
 */

import { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Download,
  Check,
  AlertTriangle,
  Loader2,
  Crown,
  Calendar,
  Wallet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PricingPage } from '@/components/pricing/pricing-page';

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    projects: number;
    users: number;
    storage: number;
    invoices: number;
    aiCalls: number;
  };
}

interface Usage {
  storage: { used: number; total: number };
  projects: { used: number; total: number };
  users: { used: number; total: number };
  invoices: { used: number; total: number };
  aiCalls: { used: number; total: number };
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoice: string;
  receiptUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface BillingData {
  plan: Plan;
  usage: Usage;
  payments: Payment[];
  paymentMethods: PaymentMethod[];
  customerId?: string;
  subscriptionId?: string;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export function BillingPage() {
  const { language } = useApp();
  const { toast } = useToast();

  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [_showAddCardDialog, _setShowAddCardDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isRTL = language === 'ar';

  // Translations
  const texts = {
    currentPlan: language === 'ar' ? 'الخطة الحالية' : 'Current Plan',
    usage: language === 'ar' ? 'الاستخدام' : 'Usage',
    storage: language === 'ar' ? 'التخزين' : 'Storage',
    projects: language === 'ar' ? 'المشاريع' : 'Projects',
    users: language === 'ar' ? 'المستخدمين' : 'Users',
    invoices: language === 'ar' ? 'الفواتير' : 'Invoices',
    aiCalls: language === 'ar' ? 'استدعاءات AI' : 'AI Calls',
    unlimited: language === 'ar' ? 'غير محدود' : 'Unlimited',
    upgradePlan: language === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan',
    managePlan: language === 'ar' ? 'إدارة الخطة' : 'Manage Plan',
    cancelPlan: language === 'ar' ? 'إلغاء الخطة' : 'Cancel Plan',
    reactivatePlan: language === 'ar' ? 'إعادة تفعيل الخطة' : 'Reactivate Plan',
    paymentMethods: language === 'ar' ? 'طرق الدفع' : 'Payment Methods',
    addPaymentMethod: language === 'ar' ? 'إضافة طريقة دفع' : 'Add Payment Method',
    default: language === 'ar' ? 'افتراضي' : 'Default',
    setDefault: language === 'ar' ? 'تعيين كافتراضي' : 'Set as Default',
    remove: language === 'ar' ? 'إزالة' : 'Remove',
    cardEndsIn: language === 'ar' ? 'بطاقة تنتهي بـ' : 'Card ending in',
    expires: language === 'ar' ? 'تنتهي' : 'Expires',
    paymentHistory: language === 'ar' ? 'سجل المدفوعات' : 'Payment History',
    downloadInvoice: language === 'ar' ? 'تحميل الفاتورة' : 'Download Invoice',
    paid: language === 'ar' ? 'مدفوعة' : 'Paid',
    pending: language === 'ar' ? 'معلقة' : 'Pending',
    failed: language === 'ar' ? 'فشلت' : 'Failed',
    refunded: language === 'ar' ? 'مستردة' : 'Refunded',
    nextBilling: language === 'ar' ? 'الفوترة القادمة' : 'Next Billing',
    trialEnds: language === 'ar' ? 'نهاية الفترة التجريبية' : 'Trial Ends',
    cancelConfirm: language === 'ar' ? 'تأكيد إلغاء الخطة' : 'Confirm Plan Cancellation',
    cancelWarning: language === 'ar'
      ? 'سيتم إلغاء خطتك في نهاية فترة الفوترة الحالية. لن يتم تجديدها تلقائياً.'
      : 'Your plan will be canceled at the end of the current billing period. It will not renew automatically.',
    confirm: language === 'ar' ? 'تأكيد' : 'Confirm',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    planCanceled: language === 'ar' ? 'تم إلغاء الخطة' : 'Plan Canceled',
    planReactivated: language === 'ar' ? 'تم إعادة تفعيل الخطة' : 'Plan Reactivated',
    managePortal: language === 'ar' ? 'إدارة في Stripe' : 'Manage in Stripe',
    of: language === 'ar' ? 'من' : 'of',
    gb: language === 'ar' ? 'جيجابايت' : 'GB',
    aed: language === 'ar' ? 'درهم' : 'AED',
    perMonth: language === 'ar' ? '/شهر' : '/mo',
    perYear: language === 'ar' ? '/سنة' : '/yr',
    active: language === 'ar' ? 'نشط' : 'Active',
    canceled: language === 'ar' ? 'ملغي' : 'Canceled',
    pastDue: language === 'ar' ? 'متأخر' : 'Past Due',
    trialing: language === 'ar' ? 'تجريبي' : 'Trial',
    daysLeft: language === 'ar' ? 'أيام متبقية' : 'days left',
    noPaymentMethods: language === 'ar' ? 'لا توجد طرق دفع مسجلة' : 'No payment methods registered',
    noPayments: language === 'ar' ? 'لا يوجد سجل مدفوعات' : 'No payment history',
  };

  // Fetch billing data
  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stripe/billing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setBillingData(data.data);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      // Set demo data
      setBillingData({
        plan: {
          id: 'professional',
          name: 'Professional',
          nameAr: 'المحترف',
          price: 499,
          currency: 'AED',
          interval: 'month',
          features: [
            'Up to 25 projects',
            'Up to 10 users',
            '25GB storage',
            'AI assistant (500 calls/month)',
          ],
          limits: {
            projects: 25,
            users: 10,
            storage: 25,
            invoices: 500,
            aiCalls: 500,
          },
        },
        usage: {
          storage: { used: 12, total: 25 },
          projects: { used: 8, total: 25 },
          users: { used: 5, total: 10 },
          invoices: { used: 120, total: 500 },
          aiCalls: { used: 340, total: 500 },
        },
        payments: [
          {
            id: '1',
            date: '2024-01-01',
            amount: 499,
            status: 'paid',
            invoice: 'INV-2024-001',
          },
          {
            id: '2',
            date: '2023-12-01',
            amount: 499,
            status: 'paid',
            invoice: 'INV-2023-012',
          },
        ],
        paymentMethods: [
          {
            id: '1',
            type: 'card',
            last4: '4242',
            brand: 'Visa',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
          },
        ],
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stripe/subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cancelAtPeriodEnd: true }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: texts.planCanceled });
        fetchBillingData();
      }
    } catch {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setShowCancelDialog(false);
    }
  };

  const handleReactivatePlan = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stripe/subscriptions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cancelAtPeriodEnd: false }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: texts.planReactivated });
        fetchBillingData();
      }
    } catch {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data.url) {
        window.open(data.data.url, '_blank');
      }
    } catch {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatUsagePercent = (used: number, total: number): number => {
    if (total === -1) return 0; // Unlimited
    return Math.min(100, (used / total) * 100);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      canceled: 'bg-red-500/20 text-red-400 border-red-500/30',
      past_due: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return (
      <Badge className={styles[status] || styles.active}>
        {texts[status as keyof typeof texts] || status}
      </Badge>
    );
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'refunded':
        return <ArrowDownRight className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (showPlans && billingData) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowPlans(false)}>
          {language === 'ar' ? '← العودة للفوترة' : '← Back to Billing'}
        </Button>
        <PricingPage
          currentPlanId={billingData.plan.id}
          lang={language}
          onSelectPlan={() => {
            setShowPlans(false);
            fetchBillingData();
          }}
        />
      </div>
    );
  }

  if (!billingData) return null;

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Current Plan Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                {texts.currentPlan}
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                {billingData.plan.nameAr} - {billingData.plan.price} {texts.aed}
                {billingData.plan.interval === 'month' ? texts.perMonth : texts.perYear}
              </CardDescription>
            </div>
            {getStatusBadge(billingData.subscriptionStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Alert */}
          {billingData.cancelAtPeriodEnd && (
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                {language === 'ar'
                  ? `سيتم إلغاء خطتك في ${new Date(billingData.currentPeriodEnd!).toLocaleDateString('ar-AE')}`
                  : `Your plan will be canceled on ${new Date(billingData.currentPeriodEnd!).toLocaleDateString('en-US')}`}
              </AlertDescription>
            </Alert>
          )}

          {billingData.trialEndsAt && billingData.subscriptionStatus === 'trialing' && (
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Calendar className="w-4 h-4 text-blue-500" />
              <AlertDescription className="text-blue-200">
                {texts.trialEnds}: {new Date(billingData.trialEndsAt).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US')}
              </AlertDescription>
            </Alert>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {billingData.plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                {feature}
              </div>
            ))}
          </div>

          {/* Next Billing */}
          {billingData.currentPeriodEnd && billingData.subscriptionStatus === 'active' && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="w-4 h-4" />
              {texts.nextBilling}: {new Date(billingData.currentPeriodEnd).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US')}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowPlans(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowUpRight className="w-4 h-4 me-2" />
            {texts.upgradePlan}
          </Button>
          
          {billingData.subscriptionStatus === 'active' && !billingData.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={handleOpenPortal}
              disabled={isProcessing}
            >
              <ExternalLink className="w-4 h-4 me-2" />
              {texts.managePortal}
            </Button>
          )}

          {billingData.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={handleReactivatePlan}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {texts.reactivatePlan}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Usage Statistics */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-400" />
            {texts.usage}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { key: 'storage', label: texts.storage, unit: texts.gb },
              { key: 'projects', label: texts.projects, unit: '' },
              { key: 'users', label: texts.users, unit: '' },
              { key: 'invoices', label: texts.invoices, unit: '' },
              { key: 'aiCalls', label: texts.aiCalls, unit: '' },
            ].map((item) => {
              const usage = billingData.usage[item.key as keyof Usage];
              const percent = formatUsagePercent(usage.used, usage.total);
              const isUnlimited = usage.total === -1;
              const isNearLimit = !isUnlimited && percent > 80;

              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm text-slate-300">
                      {usage.used}
                      {!isUnlimited && ` / ${usage.total}`}
                      {isUnlimited && ` (${texts.unlimited})`}
                      {item.unit && !isUnlimited && ` ${item.unit}`}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <Progress
                      value={percent}
                      className={`h-2 ${isNearLimit ? 'bg-amber-500/20' : ''}`}
                    />
                  )}
                  {isNearLimit && (
                    <p className="text-xs text-amber-400">
                      {language === 'ar' ? 'قريب من الحد الأقصى' : 'Near limit'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              {texts.paymentMethods}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleOpenPortal}>
              <Plus className="w-4 h-4 me-2" />
              {texts.addPaymentMethod}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {billingData.paymentMethods.length === 0 ? (
            <p className="text-slate-400 text-center py-4">{texts.noPaymentMethods}</p>
          ) : (
            <div className="space-y-3">
              {billingData.paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {method.brand} {texts.cardEndsIn} {method.last4}
                      </p>
                      {method.expiryMonth && method.expiryYear && (
                        <p className="text-sm text-slate-400">
                          {texts.expires} {method.expiryMonth}/{method.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                        {texts.default}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            {texts.paymentHistory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingData.payments.length === 0 ? (
            <p className="text-slate-400 text-center py-4">{texts.noPayments}</p>
          ) : (
            <div className="space-y-3">
              {billingData.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    {getPaymentStatusIcon(payment.status)}
                    <div>
                      <p className="text-white font-medium">{payment.invoice}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(payment.date).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">
                      {payment.amount} {texts.aed}
                    </span>
                    <Badge
                      className={
                        payment.status === 'paid'
                          ? 'bg-green-500/20 text-green-400'
                          : payment.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : payment.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }
                    >
                      {texts[payment.status as keyof typeof texts]}
                    </Badge>
                    {payment.receiptUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">{texts.cancelConfirm}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {texts.cancelWarning}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              {texts.cancel}
            </Button>
            <Button variant="destructive" onClick={handleCancelPlan} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {texts.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BillingPage;
