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
  Bell, Moon, Sun, Plus, ChevronDown,
  Calendar, Search
} from 'lucide-react';

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
    setNotificationsPanelOpen, setCommandPaletteOpen,
    openQuickAddDialog
  } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { data: notificationsData } = useNotifications(true);
  
  const unreadCount = notificationsData?.data?.filter((n: any) => !n.isRead).length || 0;
  
  const getPageTitle = () => {
    if (title) return title;
    return t[currentPage as keyof typeof t] || currentPage;
  };

  // Quick add handlers
  const handleQuickAdd = (type: 'project' | 'client' | 'invoice' | 'task') => {
    openQuickAddDialog(type);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-4 md:px-6 py-3 md:py-4 mt-14 md:mt-0">
      <div className="flex items-center justify-between gap-2">
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
