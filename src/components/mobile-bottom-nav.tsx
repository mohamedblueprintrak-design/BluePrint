'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, Zap, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'الرئيسية' },
  { href: '/dashboard/projects', icon: FolderKanban, label: 'المشاريع' },
  { href: '/dashboard/ai-chat', icon: Zap, label: 'الذكي' },
  { href: '/dashboard/notifications', icon: Bell, label: 'الإشعارات', badge: 3 },
  { href: '/dashboard/settings', icon: Settings, label: 'الإعدادات' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden"
      dir="rtl"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
