'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  AlertTriangle, Receipt, X, ChevronDown, ChevronUp,
  FolderOpen, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  href: string;
  children?: SidebarItem[];
}

// Sidebar Section Component - renders a list of items
function SidebarSection({ 
  items, 
  currentPage, 
  sidebarCollapsed, 
  isMobile, 
  isRTL,
  onItemClick 
}: { 
  items: SidebarItem[];
  currentPage: string;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  isRTL: boolean;
  onItemClick: (id: string, href: string) => void;
}) {
  return (
    <>
      {items.map((item) => (
        <TooltipProvider key={item.id} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                onClick={() => onItemClick(item.id, item.href)}
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
              </Link>
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
  );
}

// Collapsible Section Component - renders a collapsible group of items
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  items, 
  currentPage, 
  sidebarCollapsed, 
  isMobile, 
  isRTL,
  onItemClick,
  defaultOpen = false 
}: { 
  title: string;
  icon: React.ElementType;
  items: SidebarItem[];
  currentPage: string;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  isRTL: boolean;
  onItemClick: (id: string, href: string) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Don't render collapsible when sidebar is collapsed
  if (!isMobile && sidebarCollapsed) {
    return (
      <SidebarSection 
        items={items} 
        currentPage={currentPage}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        isRTL={isRTL}
        onItemClick={onItemClick}
      />
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button 
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-end text-sm font-medium">{title}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 shrink-0" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        <SidebarSection 
          items={items} 
          currentPage={currentPage}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          isRTL={isRTL}
          onItemClick={onItemClick}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

// Route mapping for navigation
const getRoutes = (language: 'ar' | 'en'): Record<string, string> => ({
  'dashboard': '/dashboard',
  'projects': '/dashboard/projects',
  'clients': '/dashboard/clients',
  'proposals': '/dashboard/proposals',
  'contracts': '/dashboard/contracts',
  'invoices': '/dashboard/invoices',
  'vouchers': '/dashboard/vouchers',
  'budgets': '/dashboard/budgets',
  'tasks': '/dashboard/tasks',
  'hr': '/dashboard/hr',
  'suppliers': '/dashboard/suppliers',
  'purchaseOrders': '/dashboard/purchase-orders',
  'inventory': '/dashboard/inventory',
  'boq': '/dashboard/boq',
  'siteDiary': '/dashboard/site-diary',
  'defects': '/dashboard/defects',
  'documents': '/dashboard/documents',
  'knowledge': '/dashboard/knowledge',
  'aiChat': '/dashboard/ai-chat',
  'reports': '/dashboard/reports',
  'settings': '/dashboard/settings',
  'admin': '/dashboard/admin',
  'activities': '/dashboard/activities',
  'profile': '/dashboard/profile',
});

// Sidebar Content Component - shared between desktop and mobile
function SidebarContent({ 
  onClose, 
  isMobile = false 
}: { 
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { 
    theme, setTheme, language, setLanguage, isDark, isRTL,
    sidebarCollapsed, setSidebarCollapsed: _setSidebarCollapsed, currentPage, setCurrentPage,
    setCommandPaletteOpen, setNotificationsPanelOpen: _setNotificationsPanelOpen
  } = useApp();
  const { t } = useTranslation(language);

  // Memoize routes to prevent unnecessary re-renders
  const routes = useMemo(() => getRoutes(language), [language]);

  // Core items - always visible
  const coreItems: SidebarItem[] = [
    { id: 'dashboard', label: t.dashboard, icon: Home, href: '/dashboard' },
    { id: 'projects', label: t.projects, icon: Building2, href: '/dashboard/projects' },
    { id: 'tasks', label: t.tasks, icon: CheckSquare, badge: 3, href: '/dashboard/tasks' },
    { id: 'clients', label: t.clients, icon: Users, href: '/dashboard/clients' },
    { id: 'invoices', label: t.invoices, icon: DollarSign, href: '/dashboard/invoices' },
  ];

  // Finance items - collapsible
  const financeItems: SidebarItem[] = [
    { id: 'budgets', label: language === 'ar' ? 'الميزانيات' : 'Budgets', icon: Calculator, href: '/dashboard/budgets' },
    { id: 'vouchers', label: language === 'ar' ? 'السندات' : 'Vouchers', icon: Receipt, href: '/dashboard/vouchers' },
    { id: 'contracts', label: t.contracts, icon: FileCheck, href: '/dashboard/contracts' },
    { id: 'proposals', label: t.proposals, icon: FileText, href: '/dashboard/proposals' },
    { id: 'purchaseOrders', label: language === 'ar' ? 'طلبات الشراء' : 'Purchase Orders', icon: ShoppingCart, href: '/dashboard/purchase-orders' },
  ];

  // Operations items - collapsible
  const operationsItems: SidebarItem[] = [
    { id: 'inventory', label: t.inventory, icon: Package, href: '/dashboard/inventory' },
    { id: 'suppliers', label: t.suppliers, icon: Briefcase, href: '/dashboard/suppliers' },
    { id: 'boq', label: language === 'ar' ? 'جدول الكميات' : 'BOQ', icon: FileSpreadsheet, href: '/dashboard/boq' },
    { id: 'siteDiary', label: t.siteDiary, icon: FileSpreadsheet, href: '/dashboard/site-diary' },
    { id: 'defects', label: language === 'ar' ? 'العيوب والمخالفات' : 'Defects', icon: AlertTriangle, href: '/dashboard/defects' },
  ];

  // Management items - collapsible
  const managementItems: SidebarItem[] = [
    { id: 'reports', label: t.reports, icon: BarChart3, href: '/dashboard/reports' },
    { id: 'documents', label: t.documents, icon: FileText, href: '/dashboard/documents' },
    { id: 'knowledge', label: t.knowledge, icon: BookOpen, href: '/dashboard/knowledge' },
    { id: 'hr', label: t.hr, icon: Users, href: '/dashboard/hr' },
  ];

  // AI & Settings
  const aiItems: SidebarItem[] = [
    { id: 'aiChat', label: t.aiChat, icon: Bot, href: '/dashboard/ai-chat' },
  ];

  const settingsItems: SidebarItem[] = [
    { id: 'settings', label: t.settings, icon: Settings, href: '/dashboard/settings' },
  ];

  const adminItems: SidebarItem[] = [
    { id: 'admin', label: language === 'ar' ? 'الإدارة' : 'Admin', icon: Shield, href: '/dashboard/admin' },
    { id: 'activities', label: t.activities, icon: Zap, href: '/dashboard/activities' },
  ];

  // Sync currentPage with pathname - using memoized routes
  useEffect(() => {
    const pageId = Object.entries(routes).find(([, route]) => pathname === route)?.[0];
    if (pageId && pageId !== currentPage) {
      setCurrentPage(pageId);
    }
  }, [pathname, setCurrentPage, currentPage, routes]);

  const handleItemClick = useCallback((id: string, href: string) => {
    setCurrentPage(id);
    if (isMobile && onClose) {
      onClose();
    }
  }, [setCurrentPage, isMobile, onClose]);

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
      <div className="flex-1 overflow-hidden px-2">
        <ScrollArea className="h-full">
          <nav className="space-y-1 pb-2 pr-2">
          {/* Core Items */}
          <SidebarSection 
            items={coreItems} 
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
          />

          {/* Finance Section - Collapsible */}
          <CollapsibleSection 
            title={language === 'ar' ? 'المالية' : 'Finance'}
            icon={DollarSign}
            items={financeItems}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />

          {/* Operations Section - Collapsible */}
          <CollapsibleSection 
            title={language === 'ar' ? 'العمليات' : 'Operations'}
            icon={FolderOpen}
            items={operationsItems}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />

          {/* Management Section - Collapsible */}
          <CollapsibleSection 
            title={language === 'ar' ? 'الإدارة' : 'Management'}
            icon={Settings2}
            items={managementItems}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />

          {/* AI Section */}
          <Separator className="my-2 bg-slate-800" />
          <SidebarSection 
            items={aiItems} 
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
          />

          {/* Settings Section */}
          <SidebarSection 
            items={settingsItems} 
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
          />

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <CollapsibleSection 
              title={language === 'ar' ? 'الإدارة' : 'Admin'}
              icon={Shield}
              items={adminItems}
              currentPage={currentPage}
              sidebarCollapsed={sidebarCollapsed}
              isMobile={isMobile}
              isRTL={isRTL}
              onItemClick={handleItemClick}
              defaultOpen={false}
            />
          )}
        </nav>
        </ScrollArea>
      </div>

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
                  handleItemClick('profile', '/dashboard/profile');
                  router.push('/dashboard/profile');
                }}
                className="text-slate-300 focus:bg-slate-800"
              >
                <User className="w-4 h-4 me-2" />
                {t.profile}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  handleItemClick('settings', '/dashboard/settings');
                  router.push('/dashboard/settings');
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
  const { isRTL, sidebarCollapsed, setSidebarCollapsed, language } = useApp();
  const { t } = useTranslation(language);
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <h1 className="text-lg font-bold text-white whitespace-nowrap">{t.appName}</h1>
              <p className="text-xs text-slate-400 whitespace-nowrap">{t.appSubtitle}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
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
