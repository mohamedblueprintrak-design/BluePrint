'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Building2, Users, Bot, ArrowRight, ArrowLeft,
  CheckCircle2, Rocket, Briefcase, FileText,
  Settings, Sparkles, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ONBOARDING_COMPLETED_KEY = 'blueprint_onboarding_completed';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, title: { ar: 'مرحباً', en: 'Welcome' } },
  { id: 2, title: { ar: 'شركتك', en: 'Your Company' } },
  { id: 3, title: { ar: 'أول مشروع', en: 'First Project' } },
  { id: 4, title: { ar: 'أول عميل', en: 'First Client' } },
  { id: 5, title: { ar: 'جاهز!', en: "You're Ready!" } },
];

export function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const router = useRouter();
  const { language } = useApp();
  const isRTL = language === 'ar';
  
  const [currentStep, setCurrentStep] = useState(1);
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
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    onClose();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Save onboarding data and mark as completed
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      localStorage.setItem('blueprint_onboarding_data', JSON.stringify(formData));
      
      // Navigate to dashboard
      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isRTL ? 'مرحباً بك في BluePrint! 🎉' : 'Welcome to BluePrint! 🎉'}
              </h2>
              <p className="text-slate-400">
                {isRTL 
                  ? 'دعنا نساعدك على إعداد حسابك في دقائق معدودة'
                  : "Let's help you set up your account in just a few minutes"}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: Building2, label: isRTL ? 'إنشاء مشروع' : 'Create Project', delay: '0ms' },
                { icon: Users, label: isRTL ? 'إضافة عملاء' : 'Add Clients', delay: '100ms' },
                { icon: BarChart3, label: isRTL ? 'تتبع التقدم' : 'Track Progress', delay: '200ms' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center animate-fadeIn"
                  style={{ animationDelay: item.delay }}
                >
                  <item.icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <Briefcase className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {isRTL ? 'أخبرنا عن شركتك' : 'Tell us about your company'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isRTL ? 'هذه المعلومات ستساعدنا على تخصيص تجربتك' : 'This helps us personalize your experience'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName" className="text-slate-300">
                  {isRTL ? 'اسم الشركة' : 'Company Name'}
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder={isRTL ? 'مثال: شركة البناء الحديث' : 'e.g., Modern Construction Co.'}
                  className="mt-1.5 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label htmlFor="companyEmail" className="text-slate-300">
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                </Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  placeholder={isRTL ? 'info@company.com' : 'info@company.com'}
                  className="mt-1.5 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {isRTL ? 'أنشئ أول مشروع لك' : 'Create your first project'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isRTL ? 'ابدأ بتتبع مشروعك الأول' : 'Start tracking your first project'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName" className="text-slate-300">
                  {isRTL ? 'اسم المشروع' : 'Project Name'}
                </Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder={isRTL ? 'مثال: برج الأعمال' : 'e.g., Business Tower'}
                  className="mt-1.5 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-slate-300">
                  {isRTL ? 'نوع المشروع' : 'Project Type'}
                </Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  {[
                    { id: 'residential', label: isRTL ? 'سكني' : 'Residential' },
                    { id: 'commercial', label: isRTL ? 'تجاري' : 'Commercial' },
                    { id: 'industrial', label: isRTL ? 'صناعي' : 'Industrial' },
                    { id: 'infrastructure', label: isRTL ? 'بنية تحتية' : 'Infrastructure' },
                  ].map((type) => (
                    <Card
                      key={type.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all duration-200",
                        formData.projectType === type.id
                          ? "bg-blue-500/20 border-blue-500 text-white"
                          : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500"
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
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {isRTL ? 'أضف أول عميل' : 'Add your first client'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isRTL ? 'أضف عميل لربطه بالمشروع' : 'Add a client to link with your project'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName" className="text-slate-300">
                  {isRTL ? 'اسم العميل' : 'Client Name'}
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder={isRTL ? 'مثال: شركة التطوير العقاري' : 'e.g., Real Estate Development Co.'}
                  className="mt-1.5 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail" className="text-slate-300">
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="client@company.com"
                  className="mt-1.5 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isRTL ? 'أنت جاهز! 🚀' : "You're All Set! 🚀"}
              </h2>
              <p className="text-slate-400">
                {isRTL 
                  ? 'تم إعداد حسابك بنجاح. لنبدأ العمل!'
                  : 'Your account is set up. Let\'s get to work!'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[
                { icon: Target, label: isRTL ? 'تتبع المشاريع' : 'Track Projects', color: 'text-blue-400' },
                { icon: Users, label: isRTL ? 'إدارة العملاء' : 'Manage Clients', color: 'text-green-400' },
                { icon: FileText, label: isRTL ? 'إنشاء الفواتير' : 'Create Invoices', color: 'text-cyan-400' },
                { icon: Bot, label: isRTL ? 'المساعد الذكي' : 'AI Assistant', color: 'text-purple-400' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center"
                >
                  <item.icon className={cn("w-6 h-6 mx-auto mb-2", item.color)} />
                  <p className="text-sm text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              {isRTL ? `الخطوة ${currentStep} من ${STEPS.length}` : `Step ${currentStep} of ${STEPS.length}`}
            </span>
            <button 
              onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              {isRTL ? 'تخطي' : 'Skip'}
            </button>
          </div>
          <Progress value={progress} className="h-1 bg-slate-800" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentStep === step.id
                  ? "w-6 bg-blue-500"
                  : currentStep > step.id
                    ? "bg-green-500"
                    : "bg-slate-700"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mt-4">
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {isRTL ? <ArrowRight className="w-4 h-4 me-2" /> : <ArrowLeft className="w-4 h-4 me-2" />}
              {isRTL ? 'السابق' : 'Back'}
            </Button>
          ) : (
            <div />
          )}
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRTL ? 'التالي' : 'Next'}
              {isRTL ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
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
    setShouldShow(false);
  };

  return { shouldShow, isLoading, markAsCompleted, checkOnboarding };
}

// Add BarChart3 import
import { BarChart3 } from 'lucide-react';
