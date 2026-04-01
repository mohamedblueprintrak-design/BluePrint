'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, Zap, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  labelEn: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'الرئيسية', labelEn: 'Home' },
  { href: '/dashboard/projects', icon: FolderKanban, label: 'المشاريع', labelEn: 'Projects' },
  { href: '/dashboard/ai-chat', icon: Zap, label: 'الذكي', labelEn: 'AI' },
  { href: '/dashboard/notifications', icon: Bell, label: 'الإشعارات', labelEn: 'Alerts' },
  { href: '/dashboard/settings', icon: Settings, label: 'الإعدادات', labelEn: 'Settings', roles: ['ADMIN', 'MANAGER', 'HR'] },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isDark, language, isRTL } = useApp();

  const filteredItems = navItems.filter(
    item => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 border-t z-40 lg:hidden",
        isDark
          ? "bg-slate-950 border-slate-800"
          : "bg-white border-gray-200"
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-around py-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative',
                isActive
                  ? isDark ? 'text-blue-400' : 'text-blue-600'
                  : isDark ? 'text-slate-400' : 'text-gray-500'
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
                  isDark ? "bg-blue-400" : "bg-blue-600"
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
