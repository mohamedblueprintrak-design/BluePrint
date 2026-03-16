'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
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
  Briefcase, Package, FileCheck, BarChart3, Settings, 
  LogOut, Menu, Search, Moon, Sun, Globe,
  User, Shield, BookOpen, Bot, FileSpreadsheet,
  PanelLeftClose, PanelLeft, Zap, Calculator, ShoppingCart,
  AlertTriangle, Receipt, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  children?: SidebarItem[];
}

// Sidebar Content Component - shared between desktop and mobile
function SidebarContent({ 
  onClose, 
  isMobile = false 
}: { 
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const { user, logout } = useAuth();
  const { 
    theme, setTheme, language, setLanguage, isDark, isRTL,
    sidebarCollapsed, setSidebarCollapsed: _setSidebarCollapsed, currentPage, setCurrentPage,
    setCommandPaletteOpen, setNotificationsPanelOpen: _setNotificationsPanelOpen
  } = useApp();
  const { t } = useTranslation(language);

  const menuItems: SidebarItem[] = [
    { id: 'dashboard', label: t.dashboard, icon: Home },
    { id: 'projects', label: t.projects, icon: Building2 },
    { id: 'clients', label: t.clients, icon: Users },
    { id: 'proposals', label: t.proposals, icon: FileText },
    { id: 'contracts', label: t.contracts, icon: FileCheck },
    { id: 'invoices', label: t.invoices, icon: DollarSign },
    { id: 'vouchers', label: language === 'ar' ? 'السندات' : 'Vouchers', icon: Receipt },
    { id: 'budgets', label: language === 'ar' ? 'الميزانيات' : 'Budgets', icon: Calculator },
    { id: 'tasks', label: t.tasks, icon: CheckSquare, badge: 3 },
    { id: 'hr', label: t.hr, icon: Users },
    { id: 'suppliers', label: t.suppliers, icon: Briefcase },
    { id: 'purchaseOrders', label: language === 'ar' ? 'طلبات الشراء' : 'Purchase Orders', icon: ShoppingCart },
    { id: 'inventory', label: t.inventory, icon: Package },
    { id: 'boq', label: language === 'ar' ? 'جدول الكميات' : 'BOQ', icon: FileSpreadsheet },
    { id: 'siteDiary', label: t.siteDiary, icon: FileSpreadsheet },
    { id: 'defects', label: language === 'ar' ? 'العيوب والمخالفات' : 'Defects', icon: AlertTriangle },
    { id: 'documents', label: t.documents, icon: FileText },
    { id: 'knowledge', label: t.knowledge, icon: BookOpen },
    { id: 'aiChat', label: t.aiChat, icon: Bot },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const adminItems: SidebarItem[] = [
    { id: 'admin', label: t.admin, icon: Shield },
    { id: 'activities', label: t.activities, icon: Zap },
  ];

  const handleItemClick = (id: string) => {
    setCurrentPage(id);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo Header - only show on mobile or when not collapsed on desktop */}
      {(isMobile || !sidebarCollapsed) && (
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{t.appName}</h1>
              <p className="text-xs text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="p-4">
        <button
          onClick={() => {
            setCommandPaletteOpen(true);
            if (isMobile && onClose) onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>{t.search}...</span>
          <kbd className="ms-auto px-2 py-0.5 text-xs bg-slate-700 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <TooltipProvider key={item.id} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      currentPage === item.id 
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                      !isMobile && sidebarCollapsed && "justify-center"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {(!isMobile && sidebarCollapsed ? false : true) && (
                      <>
                        <span className="flex-1 text-end">{item.label}</span>
                        {item.badge && (
                          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {!isMobile && sidebarCollapsed && (
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
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          currentPage === item.id 
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                            : "text-slate-400 hover:bg-slate-800 hover:text-white",
                          !isMobile && sidebarCollapsed && "justify-center"
                        )}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {(!isMobile && sidebarCollapsed ? false : true) && (
                          <span className="flex-1 text-end">{item.label}</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {!isMobile && sidebarCollapsed && (
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
        <div className={cn("flex items-center gap-3", !isMobile && sidebarCollapsed && "justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-3 w-full", !isMobile && sidebarCollapsed && "justify-center")}>
                <Avatar className="w-9 h-9 border-2 border-slate-700">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user?.fullName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {(!isMobile && sidebarCollapsed ? false : true) && (
                  <div className="flex-1 text-end">
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
                onClick={() => {
                  setCurrentPage('profile');
                  if (isMobile && onClose) onClose();
                }}
                className="text-slate-300 focus:bg-slate-800"
              >
                <User className="w-4 h-4 me-2" />
                {t.profile}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  setCurrentPage('settings');
                  if (isMobile && onClose) onClose();
                }}
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
    </div>
  );
}

export function Sidebar() {
  const { isRTL, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile Sidebar - Sheet/Drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button - Fixed */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side={isRTL ? "right" : "left"} 
              className="w-72 p-0 bg-slate-950 border-slate-800"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SidebarContent 
                onClose={() => setMobileMenuOpen(false)} 
                isMobile={true} 
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Logo - Fixed */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 md:hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 rounded-full border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">BluePrint</span>
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside 
      className={cn(
        "fixed top-0 z-40 h-screen",
        "bg-slate-950 border-slate-800",
        "transition-all duration-300 flex flex-col",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{/* t.appName */}</h1>
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

      <SidebarContent isMobile={false} />
    </aside>
  );
}
