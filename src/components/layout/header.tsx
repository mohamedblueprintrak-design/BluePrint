'use client';

import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useNotifications } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Bell, Moon, Sun, RefreshCw, Plus, Download, ChevronDown,
  Calendar, Clock, AlertTriangle, CheckCircle, Info
} from 'lucide-react';

const CURRENCIES = ['AED', 'SAR', 'USD', 'EUR', 'EGP'] as const;

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  const { user } = useAuth();
  const { 
    theme, setTheme, language, isDark, isRTL,
    currency, setCurrency, currentPage, 
    setNotificationsPanelOpen
  } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { data: notificationsData } = useNotifications(true);
  
  const unreadCount = notificationsData?.data?.filter((n: any) => !n.isRead).length || 0;
  
  const getPageTitle = () => {
    if (title) return title;
    return t[currentPage as keyof typeof t] || currentPage;
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">{getPageTitle()}</h1>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(new Date())}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Add */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 me-2" />
                {t.add}
                <ChevronDown className="w-4 h-4 ms-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="bg-slate-900 border-slate-800">
              <DropdownMenuLabel className="text-slate-300">{t.add} جديد</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">
                {t.newProject}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">
                {t.newClient}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">
                {t.newInvoice}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">
                {t.newTask}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency Selector */}
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-20 bg-slate-800 border-slate-700 text-white">
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

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsPanelOpen(true)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}
