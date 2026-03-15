'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { useTranslation, Language } from '@/lib/translations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home, Users, Building2, FileText, DollarSign, CheckSquare, 
  Briefcase, Package, FileCheck, BarChart3, Bell, Settings, 
  LogOut, ChevronDown, Menu, Search, Moon, Sun, Globe,
  User, Shield, BookOpen, Bot, TestTube, FileSpreadsheet,
  PanelLeftClose, PanelLeft, Zap
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  children?: SidebarItem[];
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { 
    theme, setTheme, language, setLanguage, isDark, isRTL,
    sidebarCollapsed, setSidebarCollapsed, currentPage, setCurrentPage,
    setCommandPaletteOpen, setNotificationsPanelOpen
  } = useApp();
  const { t } = useTranslation(language);

  const menuItems: SidebarItem[] = [
    { id: 'dashboard', label: t.dashboard, icon: Home },
    { id: 'projects', label: t.projects, icon: Building2 },
    { id: 'clients', label: t.clients, icon: Users },
    { id: 'proposals', label: t.proposals, icon: FileText },
    { id: 'invoices', label: t.invoices, icon: DollarSign },
    { id: 'tasks', label: t.tasks, icon: CheckSquare, badge: 3 },
    { id: 'hr', label: t.hr, icon: Users },
    { id: 'suppliers', label: t.suppliers, icon: Briefcase },
    { id: 'inventory', label: t.inventory, icon: Package },
    { id: 'contracts', label: t.contracts, icon: FileCheck },
    { id: 'siteDiary', label: t.siteDiary, icon: FileSpreadsheet },
    { id: 'documents', label: t.documents, icon: FileText },
    { id: 'knowledge', label: t.knowledge, icon: BookOpen },
    { id: 'aiChat', label: t.aiChat, icon: Bot },
    { id: 'modelTest', label: t.modelTest, icon: TestTube },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const adminItems: SidebarItem[] = [
    { id: 'admin', label: t.admin, icon: Shield },
    { id: 'activities', label: t.activities, icon: Zap },
  ];

  const handleItemClick = (id: string) => {
    setCurrentPage(id);
  };

  return (
    <aside 
      className={`
        fixed top-0 ${isRTL ? 'right-0' : 'left-0'} z-40 h-screen
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        bg-slate-950 border-${isRTL ? 'l' : 'r'} border-slate-800
        transition-all duration-300 flex flex-col
      `}
    >
      {/* Logo Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{t.appName}</h1>
              <p className="text-xs text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Search */}
      {!sidebarCollapsed && (
        <div className="p-4">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>{t.search}...</span>
            <kbd className="ml-auto px-2 py-0.5 text-xs bg-slate-700 rounded">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <TooltipProvider key={item.id} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      ${currentPage === item.id 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-right">{item.label}</span>
                        {item.badge && (
                          <Badge className="bg-red-500 text-white text-xs px-1.5">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side={isRTL ? 'left' : 'right'}>
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <>
              <Separator className="my-4 bg-slate-800" />
              {adminItems.map((item) => (
                <TooltipProvider key={item.id} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleItemClick(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-200
                          ${currentPage === item.id 
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }
                          ${sidebarCollapsed ? 'justify-center' : ''}
                        `}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!sidebarCollapsed && <span className="flex-1 text-right">{item.label}</span>}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side={isRTL ? 'left' : 'right'}>
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-slate-800 p-4">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex items-center gap-3 w-full ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <Avatar className="w-9 h-9 border-2 border-slate-700">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user?.fullName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={isRTL ? 'start' : 'end'} 
              className="w-56 bg-slate-900 border-slate-800"
            >
              <DropdownMenuLabel className="text-slate-200">
                <div className="flex flex-col">
                  <span>{user?.fullName || user?.username}</span>
                  <span className="text-xs text-slate-400 font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              
              {/* Theme Toggle */}
              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-slate-300 focus:bg-slate-800"
              >
                {isDark ? <Sun className="w-4 h-4 me-2" /> : <Moon className="w-4 h-4 me-2" />}
                {isDark ? t.lightMode : t.darkMode}
              </DropdownMenuItem>
              
              {/* Language Toggle */}
              <DropdownMenuItem 
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="text-slate-300 focus:bg-slate-800"
              >
                <Globe className="w-4 h-4 me-2" />
                {language === 'ar' ? 'English' : 'العربية'}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-slate-800" />
              
              <DropdownMenuItem 
                onClick={() => setCurrentPage('profile')}
                className="text-slate-300 focus:bg-slate-800"
              >
                <User className="w-4 h-4 me-2" />
                {t.profile}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setCurrentPage('settings')}
                className="text-slate-300 focus:bg-slate-800"
              >
                <Settings className="w-4 h-4 me-2" />
                {t.settings}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-slate-800" />
              
              <DropdownMenuItem 
                onClick={logout}
                className="text-red-400 focus:bg-slate-800"
              >
                <LogOut className="w-4 h-4 me-2" />
                {t.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
