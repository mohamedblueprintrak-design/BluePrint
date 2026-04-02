'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';
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
  Home, Users, FileText, DollarSign,
  Package, BarChart3, Settings, 
  LogOut, Menu, Search, Moon, Sun, Globe,
  User, Bot,
  PanelLeftClose, PanelLeft,
    X, ChevronDown, ChevronUp,
    Compass, Handshake,
  UserCog, Building2, HardHat,
  ListTodo, Shield, Activity
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
  visibleRoles?: UserRole[];
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
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  !isMobile && sidebarCollapsed && "justify-center"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {(!isMobile && sidebarCollapsed ? false : true) && (
                  <>
                    <span className="flex-1 text-end">{item.label}</span>
                    {item.badge && (
                      <Badge className="bg-red-500 text-foreground text-xs px-1.5 py-0.5">
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
          className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground/80 transition-colors"
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
const getRoutes = (_language: 'ar' | 'en'): Record<string, string> => ({
  'dashboard': '/dashboard',
  'projects': '/dashboard/projects',
  'clients': '/dashboard/clients',
  'proposals': '/dashboard/contracts?tab=proposals',
  'contracts': '/dashboard/contracts',
  'finance': '/dashboard/finance',
  'assets': '/dashboard/assets',
  'tasks': '/dashboard/tasks',
  'hr': '/dashboard/hr',
  'siteManagement': '/dashboard/site-management',
  'documents': '/dashboard/documents',
  'aiChat': '/dashboard/ai-chat',
  'reports': '/dashboard/reports',
  'settings': '/dashboard/settings',
  'profile': '/dashboard/profile',
  'bidding': '/dashboard/contracts?tab=bidding',
  'notifications': '/dashboard/notifications',
  'meetings': '/dashboard/reports?tab=meetings',
  // Redirect routes for removed sidebar items (backward compatibility)
  'admin': '/dashboard/admin',
  'adminPanel': '/dashboard/admin',
  'automations': '/dashboard/settings?tab=automations',
  'pricing': '/dashboard/settings?tab=billing',
  'activities': '/dashboard/admin?tab=activities',
  // Legacy redirect routes (kept for backward compatibility)
  'operations': '/dashboard',
  'financials': '/dashboard/finance',
  'procurement': '/dashboard/assets',
  'siteVisitReports': '/dashboard/site-management?tab=visits',
  'correspondence': '/dashboard/reports?tab=meetings',
  'knowledge': '/dashboard/ai-chat',
  'help': '/dashboard/ai-chat',
  'team': '/dashboard/hr?tab=team',
  'workload': '/dashboard/hr?tab=workload',
  'calendar': '/dashboard/reports?tab=meetings',
  'invoices': '/dashboard/finance?tab=invoices',
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
    sidebarCollapsed, currentPage, setCurrentPage,
    setCommandPaletteOpen
  } = useApp();
  const { t } = useTranslation(language);

  // Memoize routes to prevent unnecessary re-renders
  const routes = useMemo(() => getRoutes(language), [language]);

  // Roles list for "all except VIEWER" shorthand
  const ALL_EXCEPT_VIEWER: UserRole[] = [
    UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER,
    UserRole.DRAFTSMAN, UserRole.ACCOUNTANT, UserRole.HR, UserRole.SECRETARY,
  ];

  // Filter items by current user role
  const filterByRole = useCallback((items: SidebarItem[]) =>
    items.filter(item => !item.visibleRoles || item.visibleRoles.includes(user?.role as UserRole)),
    [user?.role]
  );

  // ─── Main Dashboard ───
  const mainItems: SidebarItem[] = [
    { id: 'dashboard', label: t.dashboard, icon: Home, href: '/dashboard' },
  ];

  // ─── Section: المشاريع والتنفيذ (Projects & Execution) ───
  const projectExecutionItems: SidebarItem[] = [
    { id: 'projects', label: t.projects, icon: Building2, href: '/dashboard/projects' },
    { id: 'tasks', label: language === 'ar' ? 'المهام' : 'Tasks', icon: ListTodo, href: '/dashboard/tasks', visibleRoles: ALL_EXCEPT_VIEWER },
    { id: 'siteManagement', label: language === 'ar' ? 'إدارة الموقع' : 'Site Mgmt', icon: HardHat, href: '/dashboard/site-management', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER] },
    { id: 'documents', label: language === 'ar' ? 'المستندات' : 'Documents', icon: FileText, href: '/dashboard/documents', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.DRAFTSMAN, UserRole.ACCOUNTANT, UserRole.SECRETARY] },
    { id: 'assets', label: language === 'ar' ? 'المشتريات والمخزون' : 'Procurement', icon: Package, href: '/dashboard/assets', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER] },
  ];

  // ─── Section: العملاء والمالية (Clients & Finance) ───
  const clientFinanceItems: SidebarItem[] = [
    { id: 'contracts', label: language === 'ar' ? 'العملاء والعقود' : 'Clients & Contracts', icon: Handshake, href: '/dashboard/contracts', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER] },
    { id: 'finance', label: language === 'ar' ? 'الشئون المالية' : 'Finance', icon: DollarSign, href: '/dashboard/finance', visibleRoles: ALL_EXCEPT_VIEWER },
    { id: 'reports', label: language === 'ar' ? 'التقارير والاجتماعات' : 'Reports & Meetings', icon: BarChart3, href: '/dashboard/reports', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT] },
  ];

  // ─── Section: الموارد (Resources) ───
  const resourcesItems: SidebarItem[] = [
    { id: 'hr', label: language === 'ar' ? 'الموارد البشرية' : 'Human Resources', icon: Users, href: '/dashboard/hr', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.HR, UserRole.PROJECT_MANAGER, UserRole.SECRETARY] },
  ];

  // ─── Administration (ADMIN only) ───
  const adminItems: SidebarItem[] = [
    { id: 'adminPanel', label: language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel', icon: Shield, href: '/dashboard/admin', visibleRoles: [UserRole.ADMIN] },
    { id: 'activities', label: language === 'ar' ? 'النشاطات' : 'Activities', icon: Activity, href: '/dashboard/admin?tab=activities', visibleRoles: [UserRole.ADMIN] },
  ];

  // ─── System (bottom) ───
  const systemItems: SidebarItem[] = [
    { id: 'settings', label: t.settings, icon: Settings, href: '/dashboard/settings', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'aiChat', label: language === 'ar' ? 'المساعد الذكي' : 'AI Assistant', icon: Bot, href: '/dashboard/ai-chat' },
  ];

  // Sync currentPage with pathname - using memoized routes
  useEffect(() => {
    const pageId = Object.entries(routes).find(([, route]) => pathname === route)?.[0];
    if (pageId && pageId !== currentPage) {
      setCurrentPage(pageId);
    }
  }, [pathname, setCurrentPage, currentPage, routes]);

  const handleItemClick = useCallback((id: string, _href: string) => {
    setCurrentPage(id);
    if (isMobile && onClose) {
      onClose();
    }
  }, [setCurrentPage, isMobile, onClose]);

  return (
    <div className="flex flex-col h-full">
      {/* Logo Header - only show on mobile or when not collapsed on desktop */}
      {(isMobile || !sidebarCollapsed) && (
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Image src="/logo.png" alt="BluePrint" width={32} height={32} className="rounded-md object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{t.appName}</h1>
              <p className="text-xs text-muted-foreground">{t.appSubtitle}</p>
            </div>
          </div>
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
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
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground text-sm hover:bg-accent transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>{t.search}...</span>
          <kbd className="ms-auto px-2 py-0.5 text-xs bg-secondary rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-hidden px-2">
        <ScrollArea className="h-full">
          <nav className="space-y-1 pb-2 pr-2">
          {/* ─── Main Dashboard ─── */}
          <SidebarSection 
            items={filterByRole(mainItems)} 
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
          />

          {/* ─── المشاريع والتنفيذ (Projects & Execution) ─── */}
          <CollapsibleSection 
            title={language === 'ar' ? 'المشاريع والتنفيذ' : 'Projects & Execution'}
            icon={Compass}
            items={filterByRole(projectExecutionItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={true}
          />

          {/* ─── العملاء والمالية ─── */}
          {filterByRole(clientFinanceItems).length > 0 && (
          <CollapsibleSection 
            title={language === 'ar' ? 'العملاء والمالية' : 'Clients & Finance'}
            icon={Handshake}
            items={filterByRole(clientFinanceItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />
          )}

          {/* ─── الموارد (Resources) ─── */}
          {filterByRole(resourcesItems).length > 0 && (
          <CollapsibleSection 
            title={language === 'ar' ? 'الموارد' : 'Resources'}
            icon={UserCog}
            items={filterByRole(resourcesItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />
          )}

          {/* ─── الإدارة (Administration) - ADMIN only ─── */}
          {user?.role === UserRole.ADMIN && filterByRole(adminItems).length > 0 && (
          <>
            <Separator className="my-2 bg-muted" />
            <CollapsibleSection 
              title={language === 'ar' ? 'الإدارة' : 'Administration'}
              icon={Shield}
              items={filterByRole(adminItems)}
              currentPage={currentPage}
              sidebarCollapsed={sidebarCollapsed}
              isMobile={isMobile}
              isRTL={isRTL}
              onItemClick={handleItemClick}
              defaultOpen={false}
            />
          </>
          )}

          {/* ─── System ─── */}
          <Separator className="my-2 bg-muted" />
          <SidebarSection 
            items={filterByRole(systemItems)} 
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
          />
        </nav>
        </ScrollArea>
      </div>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className={cn("flex items-center gap-3", !isMobile && sidebarCollapsed && "justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-3 w-full", !isMobile && sidebarCollapsed && "justify-center")}>
                <Avatar className="w-9 h-9 border-2 border-border">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-blue-600 text-foreground">
                    {user?.fullName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {(!isMobile && sidebarCollapsed ? false : true) && (
                  <div className="flex-1 text-end">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={isRTL ? 'start' : 'end'} 
              className="w-56 bg-card border-border"
            >
              <DropdownMenuLabel className="text-foreground">
                <div className="flex flex-col">
                  <span>{user?.fullName || user?.username}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted" />
              
              {/* Theme Toggle */}
              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-foreground/80 focus:bg-muted"
              >
                {isDark ? <Sun className="w-4 h-4 me-2" /> : <Moon className="w-4 h-4 me-2" />}
                {isDark ? t.lightMode : t.darkMode}
              </DropdownMenuItem>
              
              {/* Language Toggle */}
              <DropdownMenuItem 
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="text-foreground/80 focus:bg-muted"
              >
                <Globe className="w-4 h-4 me-2" />
                {language === 'ar' ? 'English' : 'العربية'}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-muted" />
              
              <DropdownMenuItem 
                onClick={() => {
                  handleItemClick('profile', '/dashboard/profile');
                  router.push('/dashboard/profile');
                }}
                className="text-foreground/80 focus:bg-muted"
              >
                <User className="w-4 h-4 me-2" />
                {t.profile}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  handleItemClick('settings', '/dashboard/settings');
                  router.push('/dashboard/settings');
                }}
                className="text-foreground/80 focus:bg-muted"
              >
                <Settings className="w-4 h-4 me-2" />
                {t.settings}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-muted" />
              
              <DropdownMenuItem 
                onClick={logout}
                className="text-red-400 focus:bg-muted"
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
                className="bg-card border-border text-foreground hover:bg-accent"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side={isRTL ? "right" : "left"} 
              className="w-72 p-0 bg-background border-border"
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
          <div className="flex items-center gap-2 px-4 py-2 bg-card/90 rounded-full border border-border">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Image src="/logo.png" alt="BluePrint" width={28} height={28} className="rounded-md object-contain" />
            </div>
            <span className="text-sm font-bold text-foreground">BluePrint</span>
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
        "bg-background border-border",
        "transition-all duration-300 flex flex-col",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Image src="/logo.png" alt="BluePrint" width={32} height={32} className="rounded-md object-contain" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <h1 className="text-lg font-bold text-foreground whitespace-nowrap">{t.appName}</h1>
              <p className="text-xs text-muted-foreground whitespace-nowrap">{t.appSubtitle}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
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
