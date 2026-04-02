'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Building2, DollarSign, Bot, Settings,
  FileText, Package, Handshake, BarChart3,
  Users, HardHat, ListTodo, Shield, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  labelEn: string;
  roles?: string[];
}

interface MoreMenuItem {
  href: string;
  icon: typeof Home;
  label: string;
  labelEn: string;
  roles?: string[];
}

const bottomNavItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'الرئيسية', labelEn: 'Home' },
  { href: '/dashboard/projects', icon: Building2, label: 'المشاريع', labelEn: 'Projects' },
  { href: '/dashboard/tasks', icon: ListTodo, label: 'المهام', labelEn: 'Tasks' },
  { href: '/dashboard/finance', icon: DollarSign, label: 'المالية', labelEn: 'Finance' },
];

const moreMenuItems: MoreMenuItem[] = [
  { href: '/dashboard/contracts', icon: Handshake, label: 'العملاء والعقود', labelEn: 'Clients & Contracts', roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'] },
  { href: '/dashboard/reports', icon: BarChart3, label: 'التقارير والاجتماعات', labelEn: 'Reports', roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'ENGINEER', 'ACCOUNTANT'] },
  { href: '/dashboard/documents', icon: FileText, label: 'المستندات', labelEn: 'Documents', roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'ENGINEER', 'DRAFTSMAN', 'ACCOUNTANT', 'SECRETARY'] },
  { href: '/dashboard/assets', icon: Package, label: 'المشتريات والمخزون', labelEn: 'Procurement', roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'ENGINEER'] },
  { href: '/dashboard/site-management', icon: HardHat, label: 'إدارة الموقع', labelEn: 'Site Mgmt', roles: ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'ENGINEER'] },
  { href: '/dashboard/hr', icon: Users, label: 'الموارد البشرية', labelEn: 'HR', roles: ['ADMIN', 'MANAGER', 'HR', 'PROJECT_MANAGER', 'SECRETARY'] },
  { href: '/dashboard/ai-chat', icon: Bot, label: 'المساعد الذكي', labelEn: 'AI Assistant' },
  { href: '/dashboard/admin', icon: Shield, label: 'لوحة الإدارة', labelEn: 'Admin Panel', roles: ['ADMIN'] },
  { href: '/dashboard/admin?tab=activities', icon: Activity, label: 'النشاطات', labelEn: 'Activities', roles: ['ADMIN'] },
  { href: '/dashboard/settings', icon: Settings, label: 'الإعدادات', labelEn: 'Settings', roles: ['ADMIN', 'MANAGER'] },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language, isRTL } = useApp();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const filteredBottomItems = bottomNavItems.filter(
    item => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const filteredMoreItems = moreMenuItems.filter(
    item => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 border-t z-40 md:hidden pb-[env(safe-area-inset-bottom)]",
          "bg-background border-border"
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-around py-2">
          {filteredBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative',
                  isActive
                    ? 'text-blue-500'
                    : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">
                  {language === 'ar' ? item.label : item.labelEn}
                </span>
                {isActive && (
                  <div className={cn(
                    "absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full",
                    "bg-blue-500"
                  )} />
                )}
              </Link>
            );
          })}

          {/* المزيد (More) - opens Sheet */}
          <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative',
                  'text-muted-foreground'
                )}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-medium">
                  {language === 'ar' ? 'المزيد' : 'More'}
                </span>
              </button>
            </SheetTrigger>
            <SheetContent
              side={isRTL ? 'right' : 'left'}
              className="w-72 p-0 bg-background border-border"
            >
              <SheetTitle className="sr-only">
                {language === 'ar' ? 'المزيد من الخيارات' : 'More Options'}
              </SheetTitle>
              <div className="flex items-center h-14 px-4 border-b border-border">
                <h3 className={cn(
                  "text-base font-semibold",
                  'text-foreground'
                )}>
                  {language === 'ar' ? 'المزيد' : 'More'}
                </h3>
              </div>
              <ScrollArea className="h-[calc(100vh-3.5rem)]">
                <div className="p-2 space-y-1">
                  {filteredMoreItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreSheetOpen(false)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">
                          {language === 'ar' ? item.label : item.labelEn}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
