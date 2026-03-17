'use client';

import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Moon, Sun, Plus, ChevronDown, Home,
  Calendar, Search
} from 'lucide-react';
import Link from 'next/link';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

const CURRENCIES = ['AED', 'SAR', 'USD', 'EUR', 'EGP'] as const;

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  const { user: _user } = useAuth();
  const { 
    theme: _theme, setTheme, language, isDark, isRTL,
    currency, setCurrency, currentPage, 
    setCommandPaletteOpen,
    openQuickAddDialog
  } = useApp();
  const { t, formatDate } = useTranslation(language);
  
  const getPageTitle = () => {
    if (title) return title;
    return t[currentPage as keyof typeof t] || currentPage;
  };

  // Get breadcrumb items
  const getBreadcrumbs = () => {
    const breadcrumbs = [{ label: language === 'ar' ? 'الرئيسية' : 'Home', href: '/dashboard' }];
    
    if (currentPage !== 'dashboard') {
      const pageLabels: Record<string, { ar: string; en: string }> = {
        'projects': { ar: 'المشاريع', en: 'Projects' },
        'clients': { ar: 'العملاء', en: 'Clients' },
        'proposals': { ar: 'العروض', en: 'Proposals' },
        'contracts': { ar: 'العقود', en: 'Contracts' },
        'invoices': { ar: 'الفواتير', en: 'Invoices' },
        'vouchers': { ar: 'السندات', en: 'Vouchers' },
        'budgets': { ar: 'الميزانيات', en: 'Budgets' },
        'tasks': { ar: 'المهام', en: 'Tasks' },
        'hr': { ar: 'الموارد البشرية', en: 'HR' },
        'suppliers': { ar: 'الموردين', en: 'Suppliers' },
        'purchaseOrders': { ar: 'طلبات الشراء', en: 'Purchase Orders' },
        'inventory': { ar: 'المخزون', en: 'Inventory' },
        'boq': { ar: 'جدول الكميات', en: 'BOQ' },
        'siteDiary': { ar: 'يومية الموقع', en: 'Site Diary' },
        'defects': { ar: 'العيوب', en: 'Defects' },
        'documents': { ar: 'المستندات', en: 'Documents' },
        'knowledge': { ar: 'قاعدة المعرفة', en: 'Knowledge' },
        'aiChat': { ar: 'المساعد الذكي', en: 'AI Chat' },
        'reports': { ar: 'التقارير', en: 'Reports' },
        'settings': { ar: 'الإعدادات', en: 'Settings' },
        'admin': { ar: 'الإدارة', en: 'Admin' },
        'activities': { ar: 'النشاطات', en: 'Activities' },
        'profile': { ar: 'الملف الشخصي', en: 'Profile' },
      };
      
      const pageInfo = pageLabels[currentPage];
      if (pageInfo) {
        breadcrumbs.push({
          label: language === 'ar' ? pageInfo.ar : pageInfo.en,
          href: `/dashboard/${currentPage === 'profile' ? 'profile' : currentPage}`,
        });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Quick add handlers
  const handleQuickAdd = (type: 'project' | 'client' | 'invoice' | 'task') => {
    openQuickAddDialog(type);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-4 md:px-6 py-3 md:py-4 mt-14 md:mt-0">
      <div className="flex items-center justify-between gap-2">
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col gap-1">
          {/* Breadcrumbs - Desktop */}
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb.href}>
                  {index < breadcrumbs.length - 1 ? (
                    <>
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href} className="text-slate-400 hover:text-white transition-colors">
                          {index === 0 ? (
                            <Home className="w-4 h-4" />
                          ) : (
                            crumb.label
                          )}
                        </Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator className="text-slate-600" />
                    </>
                  ) : (
                    <BreadcrumbPage className="text-slate-300 font-medium">
                      {crumb.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Title */}
          <div className="flex items-center gap-2 md:gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-white truncate">
              {getPageTitle()}
            </h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(new Date())}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Search Button - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Quick Add - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 me-2" />
                {t.add}
                <ChevronDown className="w-4 h-4 ms-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="bg-slate-900 border-slate-800">
              <DropdownMenuLabel className="text-slate-300">
                {language === 'ar' ? 'إضافة جديد' : 'Add New'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem 
                className="text-slate-300 focus:bg-slate-800 cursor-pointer"
                onClick={() => handleQuickAdd('project')}
              >
                {t.newProject}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-slate-300 focus:bg-slate-800 cursor-pointer"
                onClick={() => handleQuickAdd('client')}
              >
                {t.newClient}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-slate-300 focus:bg-slate-800 cursor-pointer"
                onClick={() => handleQuickAdd('invoice')}
              >
                {t.newInvoice}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-slate-300 focus:bg-slate-800 cursor-pointer"
                onClick={() => handleQuickAdd('task')}
              >
                {t.newTask}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Add - Mobile (just icon) */}
          <Button
            variant="default"
            size="icon"
            className="md:hidden bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => openQuickAddDialog('project')}
          >
            <Plus className="w-5 h-5" />
          </Button>

          {/* Currency Selector - Desktop */}
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="hidden md:flex w-20 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c} className="text-slate-300 focus:bg-slate-800">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Theme Toggle - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="hidden md:flex text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications with Real-time Dropdown */}
          <NotificationDropdown isRTL={isRTL} />

          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}
