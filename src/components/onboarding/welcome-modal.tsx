'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Building2, Users, Bot, ArrowRight, ArrowLeft,
  Sparkles, CheckCircle2, Rocket, ListTodo, UserPlus,
  FileText, LayoutDashboard, DollarSign, BarChart3,
  Settings, ClipboardList} from 'lucide-react';
import { cn } from '@/lib/utils';

const WELCOME_MODAL_SEEN_KEY = 'blueprint_welcome_modal_seen';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const router = useRouter();
  const { language } = useApp();
  const { user } = useAuth();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isRTL = language === 'ar';

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
    }
    onClose();
  };

  const handleAction = (path: string) => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
    }
    onClose();
    router.push(path);
  };

  // Role-specific quick start options
  const quickStartOptions = useMemo(() => {
    const role = user?.role;

    // ADMIN quick start options
    if (role === 'ADMIN') {
      return [
        {
          id: 'project',
          icon: Building2,
          title: isRTL ? 'إنشاء أول مشروع' : 'Create First Project',
          description: isRTL
            ? 'ابدأ بإضافة مشروعك الأول وتتبع تقدمه'
            : 'Start by adding your first project and track its progress',
          path: '/dashboard/projects',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30 hover:border-blue-500',
        },
        {
          id: 'team',
          icon: UserPlus,
          title: isRTL ? 'دعوة أعضاء الفريق' : 'Invite Team Members',
          description: isRTL
            ? 'أضف فريقك وابدأ التعاون على المشاريع'
            : 'Add your team and start collaborating on projects',
          path: '/dashboard/team',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30 hover:border-green-500',
        },
        {
          id: 'settings',
          icon: Settings,
          title: isRTL ? 'تهيئة الإعدادات' : 'Configure Settings',
          description: isRTL
            ? 'خصص إعدادات الشركة والمظهر'
            : 'Customize company settings and appearance',
          path: '/dashboard/settings',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30 hover:border-purple-500',
        },
      ];
    }

    // MANAGER quick start options
    if (role === 'MANAGER') {
      return [
        {
          id: 'project',
          icon: Building2,
          title: isRTL ? 'إنشاء أول مشروع' : 'Create First Project',
          description: isRTL
            ? 'ابدأ بإضافة مشروعك الأول وتتبع تقدمه'
            : 'Start by adding your first project and track its progress',
          path: '/dashboard/projects',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30 hover:border-blue-500',
        },
        {
          id: 'client',
          icon: Users,
          title: isRTL ? 'إضافة عميل' : 'Add Client',
          description: isRTL
            ? 'أضف عملاءك لإدارة المشاريع والفواتير'
            : 'Add your clients to manage projects and invoices',
          path: '/dashboard/clients',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30 hover:border-green-500',
        },
        {
          id: 'ai',
          icon: Bot,
          title: isRTL ? 'اكتشف المساعد الذكي' : 'Explore AI Assistant',
          description: isRTL
            ? 'تعرف على كيف يمكن للذكاء الاصطناعي مساعدتك'
            : 'Learn how AI can help you manage your projects',
          path: '/dashboard/ai-chat',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30 hover:border-purple-500',
        },
      ];
    }

    // PROJECT_MANAGER quick start options
    if (role === 'PROJECT_MANAGER') {
      return [
        {
          id: 'project',
          icon: Building2,
          title: isRTL ? 'إنشاء أول مشروع' : 'Create First Project',
          description: isRTL
            ? 'ابدأ بإضافة مشروعك الأول وتتبع تقدمه'
            : 'Start by adding your first project and track its progress',
          path: '/dashboard/projects',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30 hover:border-blue-500',
        },
        {
          id: 'tasks',
          icon: ListTodo,
          title: isRTL ? 'عرض المهام' : 'View Tasks',
          description: isRTL
            ? 'تابع جميع المهام وتقدمها'
            : 'Track all tasks and their progress',
          path: '/dashboard/tasks',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30 hover:border-green-500',
        },
        {
          id: 'ai',
          icon: Bot,
          title: isRTL ? 'اكتشف المساعد الذكي' : 'Explore AI Assistant',
          description: isRTL
            ? 'تعرف على كيف يمكن للذكاء الاصطناعي مساعدتك'
            : 'Learn how AI can help you manage your projects',
          path: '/dashboard/ai-chat',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30 hover:border-purple-500',
        },
      ];
    }

    // ENGINEER quick start options
    if (role === 'ENGINEER') {
      return [
        {
          id: 'tasks',
          icon: ListTodo,
          title: isRTL ? 'عرض مهامي' : 'View My Tasks',
          description: isRTL
            ? 'شاهد المهام المسندة إليك وابدأ العمل'
            : 'See tasks assigned to you and start working',
          path: '/dashboard/tasks',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30 hover:border-blue-500',
        },
        {
          id: 'projects',
          icon: LayoutDashboard,
          title: isRTL ? 'تصفح المشاريع' : 'Browse Projects',
          description: isRTL
            ? 'استكشف المشاريع النشطة والمخطط لها'
            : 'Explore active and planned projects',
          path: '/dashboard/projects',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30 hover:border-green-500',
        },
        {
          id: 'ai',
          icon: Bot,
          title: isRTL ? 'اكتشف المساعد الذكي' : 'Explore AI Assistant',
          description: isRTL
            ? 'تعرف على كيف يمكن للذكاء الاصطناعي مساعدتك'
            : 'Learn how AI can help you with your work',
          path: '/dashboard/ai-chat',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30 hover:border-purple-500',
        },
      ];
    }

    // DRAFTSMAN quick start options
    if (role === 'DRAFTSMAN') {
      return [
        {
          id: 'tasks',
          icon: ListTodo,
          title: isRTL ? 'عرض مهامي' : 'View My Tasks',
          description: isRTL
            ? 'شاهد المهام المسندة إليك وابدأ العمل'
            : 'See tasks assigned to you and start working',
          path: '/dashboard/tasks',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30 hover:border-blue-500',
        },
        {
          id: 'projects',
          icon: LayoutDashboard,
          title: isRTL ? 'تصفح المشاريع' : 'Browse Projects',
          description: isRTL
            ? 'استكشف المشاريع النشطة والمخطط لها'
            : 'Explore active and planned projects',
          path: '/dashboard/projects',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30 hover:border-green-500',
        },
        {
          id: 'boq',
          icon: ClipboardList,
          title: isRTL ? 'عرض BOQ' : 'View BOQ',
          description: isRTL
            ? 'راجع قوائم الكميات للمشاريع'
            : 'Review bills of quantities for projects',
          path: '/dashboard/financials',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/30 hover:border-orange-500',
        },
      ];
    }

    // ACCOUNTANT quick start options
    if (role === 'ACCOUNTANT') {
      return [
        {
          id: 'invoice',
          icon: FileText,
          title: isRTL ? 'إنشاء فاتورة' : 'Create Invoice',
          description: isRTL
            ? 'أنشئ فاتورتك الأولى وأرسلها للعملاء'
            : 'Create your first invoice and send it to clients',
          path: '/dashboard/finance',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30 hover:border-blue-500',
        },
        {
          id: 'budgets',
          icon: DollarSign,
          title: isRTL ? 'عرض الميزانيات' : 'View Budgets',
          description: isRTL
            ? 'تابع ميزانيات المشاريع والنفقات'
            : 'Track project budgets and expenses',
          path: '/dashboard/financials',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30 hover:border-green-500',
        },
        {
          id: 'reports',
          icon: BarChart3,
          title: isRTL ? 'التقارير المالية' : 'Financial Reports',
          description: isRTL
            ? 'عرض التقارير المالية والتحليلات'
            : 'View financial reports and analytics',
          path: '/dashboard/reports',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30 hover:border-purple-500',
        },
      ];
    }

    // HR quick start options
    if (role === 'HR') {
      return [
        {
          id: 'team',
          icon: Users,
          title: isRTL ? 'إدارة الفريق' : 'Team Management',
          description: isRTL
            ? 'أضف الموظفين وأدر فرق العمل'
            : 'Add employees and manage teams',
          path: '/dashboard/team',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30 hover:border-blue-500',
        },
        {
          id: 'directory',
          icon: UserPlus,
          title: isRTL ? 'دليل الموظفين' : 'Employee Directory',
          description: isRTL
            ? 'تصفح بيانات الموظفين ومعلوماتهم'
            : 'Browse employee profiles and information',
          path: '/dashboard/hr',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30 hover:border-green-500',
        },
        {
          id: 'settings',
          icon: Settings,
          title: isRTL ? 'إعدادات الشركة' : 'Company Settings',
          description: isRTL
            ? 'أعد إعدادات الشركة والسياسات'
            : 'Configure company settings and policies',
          path: '/dashboard/settings',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30 hover:border-purple-500',
        },
      ];
    }

    // VIEWER (and default/fallback) quick start options
    return [
      {
        id: 'projects',
        icon: LayoutDashboard,
        title: isRTL ? 'تصفح المشاريع' : 'Browse Projects',
        description: isRTL
          ? 'استكشف المشاريع النشطة والمخطط لها'
          : 'Explore active and planned projects',
        path: '/dashboard/projects',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30 hover:border-blue-500',
      },
      {
        id: 'reports',
        icon: BarChart3,
        title: isRTL ? 'عرض التقارير' : 'View Reports',
        description: isRTL
          ? 'اطلع على التقارير والإحصائيات'
          : 'View reports and statistics',
        path: '/dashboard/reports',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30 hover:border-green-500',
      },
      {
        id: 'ai',
        icon: Bot,
        title: isRTL ? 'اكتشف المساعد الذكي' : 'Explore AI Assistant',
        description: isRTL
          ? 'تعرف على كيف يمكن للذكاء الاصطناعي مساعدتك'
          : 'Learn how AI can help you',
        path: '/dashboard/ai-chat',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500/30 hover:border-purple-500',
      },
    ];
  }, [user?.role, isRTL]);

  const features = [
    {
      icon: CheckCircle2,
      title: isRTL ? 'إدارة المشاريع' : 'Project Management',
    },
    {
      icon: CheckCircle2,
      title: isRTL ? 'الفواتير والمالية' : 'Invoices & Finance',
    },
    {
      icon: CheckCircle2,
      title: isRTL ? 'تقارير ذكية' : 'Smart Reports',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {isRTL ? '👋 أهلاً بك في BluePrint!' : '👋 Welcome to BluePrint!'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-base">
            {isRTL 
              ? 'إليك كيف تبدأ رحلتك معنا'
              : "Here's how to get started with your journey"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Start Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300 text-center">
              {isRTL ? '🚀 إيه رأيك نبدأ؟' : '🚀 What would you like to do?'}
            </h3>
            <div className="grid gap-3">
              {quickStartOptions.map((option) => (
                <Card
                  key={option.id}
                  className={cn(
                    "p-4 bg-slate-800/50 border cursor-pointer transition-all duration-200",
                    option.borderColor
                  )}
                  onClick={() => handleAction(option.path)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl", option.bgColor)}>
                      <option.icon className={cn("w-5 h-5", option.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{option.title}</p>
                      <p className="text-sm text-slate-400">{option.description}</p>
                    </div>
                    {isRTL ? (
                      <ArrowLeft className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Features Preview */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">
                {isRTL ? 'ماذا يمكنك أن تفعل؟' : 'What can you do?'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <feature.icon className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-300">{feature.title}</p>
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
              className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm text-slate-400 cursor-pointer"
            >
              {isRTL ? 'لا تظهر هذا مجدداً' : "Don't show this again"}
            </label>
          </div>
        </div>

        {/* Skip Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isRTL ? 'تخطي والاستكشاف لاحقاً' : 'Skip and explore later'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if welcome modal should be shown
export function useWelcomeModal() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkModal = () => {
    // Check if user has seen the modal before
    const hasSeenModal = localStorage.getItem(WELCOME_MODAL_SEEN_KEY);
    
    if (!hasSeenModal) {
      setShouldShow(true);
    }
    setIsLoading(false);
  };

  const markAsSeen = () => {
    localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
    setShouldShow(false);
  };

  return { shouldShow, isLoading, markAsSeen, checkModal };
}
