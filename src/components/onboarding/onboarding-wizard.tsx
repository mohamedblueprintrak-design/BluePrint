'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2, Users, Bot, ArrowRight, ArrowLeft,
  Sparkles, CheckCircle2, Rocket, ListTodo, UserPlus,
  FileText, LayoutDashboard, DollarSign, BarChart3,
  Settings, ClipboardList, Briefcase, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ONBOARDING_COMPLETED_KEY = 'blueprint_onboarding_completed';
// Backward compat: same key so old code that checks this still works
const WELCOME_MODAL_SEEN_KEY = 'blueprint_welcome_modal_seen';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, title: { ar: 'مرحباً', en: 'Welcome' } },
  { id: 2, title: { ar: 'شركتك ومشروعك', en: 'Company & Project' } },
  { id: 3, title: { ar: 'جاهز!', en: "You're Ready!" } },
];

export function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const router = useRouter();
  const { language } = useApp();
  const { user } = useAuth();
  const isRTL = language === 'ar';

  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    projectName: '',
    projectType: '',
    clientName: '',
    clientEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = (currentStep / STEPS.length) * 100;

  const markAsCompleted = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    // Also set the old key for backward compat
    localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (dontShowAgain) markAsCompleted();
    onClose();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (dontShowAgain) markAsCompleted();
      localStorage.setItem('blueprint_onboarding_data', JSON.stringify(formData));
      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = (path: string) => {
    if (dontShowAgain) markAsCompleted();
    onClose();
    router.push(path);
  };

  // Role-specific quick start options (from WelcomeModal)
  const quickStartOptions = useMemo(() => {
    const role = user?.role;

    if (role === 'ADMIN') {
      return [
        { id: 'project', icon: Building2, title: isRTL ? 'إنشاء أول مشروع' : 'Create First Project', description: isRTL ? 'ابدأ بإضافة مشروعك الأول وتتبع تقدمه' : 'Start by adding your first project and track its progress', path: '/dashboard/projects', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30 hover:border-blue-500' },
        { id: 'team', icon: UserPlus, title: isRTL ? 'دعوة أعضاء الفريق' : 'Invite Team Members', description: isRTL ? 'أضف فريقك وابدأ التعاون على المشاريع' : 'Add your team and start collaborating on projects', path: '/dashboard/team', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30 hover:border-green-500' },
        { id: 'settings', icon: Settings, title: isRTL ? 'تهيئة الإعدادات' : 'Configure Settings', description: isRTL ? 'خصص إعدادات الشركة والمظهر' : 'Customize company settings and appearance', path: '/dashboard/settings', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30 hover:border-purple-500' },
      ];
    }

    if (role === 'MANAGER') {
      return [
        { id: 'project', icon: Building2, title: isRTL ? 'إنشاء أول مشروع' : 'Create First Project', description: isRTL ? 'ابدأ بإضافة مشروعك الأول وتتبع تقدمه' : 'Start by adding your first project and track its progress', path: '/dashboard/projects', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30 hover:border-blue-500' },
        { id: 'client', icon: Users, title: isRTL ? 'إضافة عميل' : 'Add Client', description: isRTL ? 'أضف عملاءك لإدارة المشاريع والفواتير' : 'Add your clients to manage projects and invoices', path: '/dashboard/clients', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30 hover:border-green-500' },
        { id: 'ai', icon: Bot, title: isRTL ? 'اكتشف المساعد الذكي' : 'Explore AI Assistant', description: isRTL ? 'تعرف على كيف يمكن للذكاء الاصطناعي مساعدتك' : 'Learn how AI can help you manage your projects', path: '/dashboard/ai-chat', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30 hover:border-purple-500' },
      ];
    }

    if (role === 'PROJECT_MANAGER') {
      return [
        { id: 'project', icon: Building2, title: isRTL ? 'إنشاء أول مشروع' : 'Create First Project', description: isRTL ? 'ابدأ بإضافة مشروعك الأول وتتبع تقدمه' : 'Start by adding your first project and track its progress', path: '/dashboard/projects', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30 hover:border-blue-500' },
        { id: 'tasks', icon: ListTodo, title: isRTL ? 'عرض المهام' : 'View Tasks', description: isRTL ? 'تابع جميع المهام وتقدمها' : 'Track all tasks and their progress', path: '/dashboard/tasks', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30 hover:border-green-500' },
        { id: 'ai', icon: Bot, title: isRTL ? 'اكتشف المساعد الذكي' : 'Explore AI Assistant', description: isRTL ? 'تعرف على كيف يمكن للذكاء الاصطناعي مساعدتك' : 'Learn how AI can help you manage your projects', path: '/dashboard/ai-chat', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30 hover:border-purple-500' },
      ];
    }

    if (role === 'ENGINEER') {
      return [
        { id: 'tasks', icon: ListTodo, title: isRTL ? 'عرض مهامي' : 'View My Tasks', description: isRTL ? 'شاهد المهام المسندة إليك وابدأ العمل' : 'See tasks assigned to you and start working', path: '/dashboard/tasks', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30 hover:border-blue-500' },
        { id: 'projects', icon: LayoutDashboard, title: isRTL ? 'تصفح المشاريع' : 'Browse Projects', description: isRTL ? 'استكشف المشاريع النشطة والمخطط لها' : 'Explore active and planned projects', path: '/dashboard/projects', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30 hover:border-green-500' },
        { id: 'ai', icon: Bot, title: isRTL ? 'اكتشف المساعد الذكي' : 'Explore AI Assistant', description: isRTL ? 'تعرف على كيف يمكن للذكاء الاصطناعي مساعدتك' : 'Learn how AI can help you with your work', path: '/dashboard/ai-chat', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30 hover:border-purple-500' },
      ];
    }

    if (role === 'DRAFTSMAN') {
      return [
        { id: 'tasks', icon: ListTodo, title: isRTL ? 'عرض مهامي' : 'View My Tasks', description: isRTL ? 'شاهد المهام المسندة إليك وابدأ العمل' : 'See tasks assigned to you and start working', path: '/dashboard/tasks', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30 hover:border-blue-500' },
        { id: 'projects', icon: LayoutDashboard, title: isRTL ? 'تصفح المشاريع' : 'Browse Projects', description: isRTL ? 'استكشف المشاريع النشطة والمخطط لها' : 'Explore active and planned projects', path: '/dashboard/projects', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30 hover:border-green-500' },
        { id: 'boq', icon: ClipboardList, title: isRTL ? 'عرض BOQ' : 'View BOQ', description: isRTL ? 'راجع قوائم الكميات للمشاريع' : 'Review bills of quantities for projects', path: '/dashboard/finance', color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30 hover:border-orange-500' },
      ];
    }

    if (role === 'ACCOUNTANT') {
      return [
        { id: 'invoice', icon: FileText, title: isRTL ? 'إنشاء فاتورة' : 'Create Invoice', description: isRTL ? 'أنشئ فاتورتك الأولى وأرسلها للعملاء' : 'Create your first invoice and send it to clients', path: '/dashboard/finance', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30 hover:border-blue-500' },
        { id: 'budgets', icon: DollarSign, title: isRTL ? 'عرض الميزانيات' : 'View Budgets', description: isRTL ? 'تابع ميزانيات المشاريع والنفقات' : 'Track project budgets and expenses', path: '/dashboard/finance', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30 hover:border-green-500' },
        { id: 'reports', icon: BarChart3, title: isRTL ? 'التقارير المالية' : 'Financial Reports', description: isRTL ? 'عرض التقارير المالية والتحليلات' : 'View financial reports and analytics', path: '/dashboard/reports', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30 hover:border-purple-500' },
      ];
    }

    if (role === 'HR') {
      return [
        { id: 'team', icon: Users, title: isRTL ? 'إدارة الفريق' : 'Team Management', description: isRTL ? 'أضف الموظفين وأدر فرق العمل' : 'Add employees and manage teams', path: '/dashboard/team', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30 hover:border-blue-500' },
        { id: 'directory', icon: UserPlus, title: isRTL ? 'دليل الموظفين' : 'Employee Directory', description: isRTL ? 'تصفح بيانات الموظفين ومعلوماتهم' : 'Browse employee profiles and information', path: '/dashboard/hr', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30 hover:border-green-500' },
        { id: 'settings', icon: Settings, title: isRTL ? 'إعدادات الشركة' : 'Company Settings', description: isRTL ? 'أعد إعدادات الشركة والسياسات' : 'Configure company settings and policies', path: '/dashboard/settings', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30 hover:border-purple-500' },
      ];
    }

    // VIEWER (and default/fallback)
    return [
      { id: 'projects', icon: LayoutDashboard, title: isRTL ? 'تصفح المشاريع' : 'Browse Projects', description: isRTL ? 'استكشف المشاريع النشطة والمخطط لها' : 'Explore active and planned projects', path: '/dashboard/projects', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30 hover:border-blue-500' },
      { id: 'reports', icon: BarChart3, title: isRTL ? 'عرض التقارير' : 'View Reports', description: isRTL ? 'اطلع على التقارير والإحصائيات' : 'View reports and statistics', path: '/dashboard/reports', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30 hover:border-green-500' },
      { id: 'ai', icon: Bot, title: isRTL ? 'اكتشف المساعد الذكي' : 'Explore AI Assistant', description: isRTL ? 'تعرف على كيف يمكن للذكاء الاصطناعي مساعدتك' : 'Learn how AI can help you', path: '/dashboard/ai-chat', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30 hover:border-purple-500' },
    ];
  }, [user?.role, isRTL]);

  const features = [
    { icon: CheckCircle2, title: isRTL ? 'إدارة المشاريع' : 'Project Management' },
    { icon: CheckCircle2, title: isRTL ? 'الفواتير والمالية' : 'Invoices & Finance' },
    { icon: CheckCircle2, title: isRTL ? 'تقارير ذكية' : 'Smart Reports' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      // Step 1: Welcome + Quick Actions (merged from WelcomeModal)
      case 1:
        return (
          <div className="space-y-6 py-2">
            {/* Greeting */}
            <div className="text-center space-y-2">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Rocket className="w-8 h-8 text-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {isRTL ? '👋 أهلاً بك في BluePrint!' : '👋 Welcome to BluePrint!'}
              </h2>
              <p className="text-muted-foreground text-base">
                {isRTL
                  ? 'إليك كيف تبدأ رحلتك معنا'
                  : "Here's how to get started with your journey"}
              </p>
            </div>

            {/* Quick Start Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80 text-center">
                {isRTL ? '🚀 إيه رأيك نبدأ؟' : '🚀 What would you like to do?'}
              </h3>
              <div className="grid gap-3">
                {quickStartOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={cn(
                      'p-4 bg-muted border cursor-pointer transition-all duration-200',
                      option.borderColor
                    )}
                    onClick={() => handleAction(option.path)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn('p-2.5 rounded-xl', option.bgColor)}>
                        <option.icon className={cn('w-5 h-5', option.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{option.title}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {isRTL ? (
                        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Features Preview */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-foreground/80">
                  {isRTL ? 'ماذا يمكنك أن تفعل؟' : 'What can you do?'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <feature.icon className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <p className="text-xs text-foreground/80">{feature.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Don't show again */}
            <div className="flex items-center justify-center gap-2">
              <Checkbox
                id="dontShowAgain"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label
                htmlFor="dontShowAgain"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {isRTL ? 'لا تظهر هذا مجدداً' : "Don't show this again"}
              </label>
            </div>
          </div>
        );

      // Step 2: Company + Project (merged from old Steps 2+3)
      case 2:
        return (
          <div className="space-y-6 py-2">
            {/* Company Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isRTL ? 'شركتك' : 'Your Company'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'هذه المعلومات ستساعدنا على تخصيص تجربتك' : 'This helps us personalize your experience'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="companyName" className="text-foreground/80 text-sm">
                    {isRTL ? 'اسم الشركة' : 'Company Name'}
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder={isRTL ? 'مثال: شركة البناء الحديث' : 'e.g., Modern Construction Co.'}
                    className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail" className="text-foreground/80 text-sm">
                    {isRTL ? 'البريد الإلكتروني للشركة' : 'Company Email'}
                  </Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    placeholder="info@company.com"
                    className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Project Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isRTL ? 'أول مشروع' : 'First Project'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'ابدأ بتتبع مشروعك الأول' : 'Start tracking your first project'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="projectName" className="text-foreground/80 text-sm">
                    {isRTL ? 'اسم المشروع' : 'Project Name'}
                  </Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    placeholder={isRTL ? 'مثال: برج الأعمال' : 'e.g., Business Tower'}
                    className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground/80 text-sm">
                    {isRTL ? 'نوع المشروع' : 'Project Type'}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {[
                      { id: 'residential', label: isRTL ? 'سكني' : 'Residential' },
                      { id: 'commercial', label: isRTL ? 'تجاري' : 'Commercial' },
                      { id: 'industrial', label: isRTL ? 'صناعي' : 'Industrial' },
                      { id: 'infrastructure', label: isRTL ? 'بنية تحتية' : 'Infrastructure' },
                    ].map((type) => (
                      <Card
                        key={type.id}
                        className={cn(
                          'p-3 cursor-pointer transition-all duration-200',
                          formData.projectType === type.id
                            ? 'bg-blue-500/20 border-blue-500 text-foreground'
                            : 'bg-muted border-border text-foreground/80 hover:border-border'
                        )}
                        onClick={() => setFormData({ ...formData, projectType: type.id })}
                      >
                        <p className="text-sm text-center">{type.label}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // Step 3: Client + Ready (merged from old Steps 4+5)
      case 3:
        return (
          <div className="space-y-6 py-2">
            {/* Client Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isRTL ? 'أضف عميل' : 'Add a Client'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'أضف عميل لربطه بالمشروع' : 'Add a client to link with your project'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="clientName" className="text-foreground/80 text-sm">
                    {isRTL ? 'اسم العميل' : 'Client Name'}
                  </Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder={isRTL ? 'مثال: شركة التطوير العقاري' : 'e.g., Real Estate Development Co.'}
                    className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail" className="text-foreground/80 text-sm">
                    {isRTL ? 'البريد الإلكتروني' : 'Client Email'}
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="client@company.com"
                    className="mt-1.5 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* You're Ready Section */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {isRTL ? 'أنت جاهز! 🚀' : "You're All Set! 🚀"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {isRTL
                    ? 'تم إعداد حسابك بنجاح. لنبدأ العمل!'
                    : 'Your account is set up. Let\'s get to work!'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Target, label: isRTL ? 'تتبع المشاريع' : 'Track Projects', color: 'text-blue-400' },
                  { icon: Users, label: isRTL ? 'إدارة العملاء' : 'Manage Clients', color: 'text-green-400' },
                  { icon: FileText, label: isRTL ? 'إنشاء الفواتير' : 'Create Invoices', color: 'text-cyan-400' },
                  { icon: Bot, label: isRTL ? 'المساعد الذكي' : 'AI Assistant', color: 'text-purple-400' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-muted border border-border/50 text-center"
                  >
                    <item.icon className={cn('w-5 h-5 mx-auto mb-1.5', item.color)} />
                    <p className="text-xs text-foreground/80">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {isRTL ? `الخطوة ${currentStep} من ${STEPS.length}` : `Step ${currentStep} of ${STEPS.length}`}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground/80 transition-colors"
            >
              {isRTL ? 'تخطي' : 'Skip'}
            </button>
          </div>
          <Progress value={progress} className="h-1 bg-muted" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                currentStep === step.id
                  ? 'w-6 bg-blue-500'
                  : currentStep > step.id
                    ? 'bg-green-500'
                    : 'bg-secondary'
              )}
            />
          ))}
        </div>

        {/* Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border">
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {isRTL ? <ArrowRight className="w-4 h-4 me-2" /> : <ArrowLeft className="w-4 h-4 me-2" />}
              {isRTL ? 'السابق' : 'Back'}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {isRTL ? 'تخطي والاستكشاف لاحقاً' : 'Skip and explore later'}
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-foreground"
            >
              {isRTL ? 'التالي' : 'Next'}
              {isRTL ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-foreground"
            >
              {isSubmitting ? (
                <Sparkles className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4 me-2" />
              )}
              {isRTL ? 'ابدأ الآن' : 'Get Started'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboarding = () => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (!hasCompletedOnboarding) {
      setShouldShow(true);
    }
    setIsLoading(false);
  };

  const markAsCompleted = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
    setShouldShow(false);
  };

  return { shouldShow, isLoading, markAsCompleted, checkOnboarding };
}

// Backward compat hook - returns the same key as useOnboarding
export function useWelcomeModal() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkModal = () => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (!hasCompletedOnboarding) {
      setShouldShow(true);
    }
    setIsLoading(false);
  };

  const markAsSeen = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
    setShouldShow(false);
  };

  return { shouldShow, isLoading, markAsSeen, checkModal };
}
