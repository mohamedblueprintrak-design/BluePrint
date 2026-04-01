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
  Home, Users, FileText, DollarSign, CheckSquare, 
  Package, FileCheck, BarChart3, Settings, 
  LogOut, Menu, Search, Moon, Sun, Globe,
  User, Shield, BookOpen, Bot, FileSpreadsheet,
  PanelLeftClose, PanelLeft, Zap, ShoppingCart,
    X, ChevronDown, ChevronUp,
    Gavel, Compass, Handshake, Landmark,
  ClipboardList, Lightbulb, UserCog, Calendar, Bell, HelpCircle, Crown,
  Mail, Video, Briefcase as BriefcaseIcon, MapPin
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
const getRoutes = (_language: 'ar' | 'en'): Record<string, string> => ({
  'dashboard': '/dashboard',
  'operations': '/dashboard/operations',
  'projects': '/dashboard/projects',
  'clients': '/dashboard/clients',
  'proposals': '/dashboard/proposals',
  'contracts': '/dashboard/contracts',
  'finance': '/dashboard/finance',
  'financials': '/dashboard/financials',
  'procurement': '/dashboard/procurement',
  'assets': '/dashboard/assets',
  'tasks': '/dashboard/tasks',
  'hr': '/dashboard/hr',
  'siteManagement': '/dashboard/site-management',
  'documents': '/dashboard/documents',
  'siteVisitReports': '/dashboard/site-visit-reports',
  'knowledge': '/dashboard/knowledge',
  'aiChat': '/dashboard/ai-chat',
  'reports': '/dashboard/reports',
  'settings': '/dashboard/settings',
  'admin': '/dashboard/admin',
  'activities': '/dashboard/activities',
  'profile': '/dashboard/profile',
  'pricing': '/dashboard/pricing',
  'team': '/dashboard/team',
  'bidding': '/dashboard/bidding',
  'calendar': '/dashboard/calendar',
  'notifications': '/dashboard/notifications',
  'automations': '/dashboard/automations',
  'help': '/dashboard/help',
  'correspondence': '/dashboard/correspondence',
  'meetings': '/dashboard/meetings',
  'workload': '/dashboard/workload',
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
    { id: 'operations', label: language === 'ar' ? 'مركز العمليات' : 'Operations', icon: BarChart3, href: '/dashboard/operations', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER] },
  ];

  // ─── Section 1: التصميم والمشاريع (Design & Projects) ───
  const designItems: SidebarItem[] = [
    { id: 'projects', label: t.projects, icon: Building2, href: '/dashboard/projects' },
    { id: 'tasks', label: t.tasks, icon: CheckSquare, href: '/dashboard/tasks', visibleRoles: ALL_EXCEPT_VIEWER },
    { id: 'financials', label: language === 'ar' ? 'الميزانيات والكميات' : 'Budgets & BOQ', icon: FileSpreadsheet, href: '/dashboard/financials', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.DRAFTSMAN, UserRole.ACCOUNTANT] },
    { id: 'documents', label: language === 'ar' ? 'المستندات والمراسلات' : 'Documents', icon: FileText, href: '/dashboard/documents', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.DRAFTSMAN, UserRole.ACCOUNTANT, UserRole.SECRETARY] },
    { id: 'siteManagement', label: language === 'ar' ? 'إدارة الموقع' : 'Site Mgmt', icon: ClipboardList, href: '/dashboard/site-management', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER] },
    { id: 'assets', label: language === 'ar' ? 'الأصول والمخزون' : 'Assets', icon: Package, href: '/dashboard/assets', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER] },
    { id: 'siteVisitReports', label: language === 'ar' ? 'تقارير الموقع' : 'Site Reports', icon: MapPin, href: '/dashboard/site-visit-reports', visibleRoles: ALL_EXCEPT_VIEWER },
  ];

  // ─── Section 2: العملاء والتعاقدات (Clients & Contracts) ───
  const clientItems: SidebarItem[] = [
    { id: 'clients', label: t.clients, icon: Users, href: '/dashboard/clients', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT, UserRole.SECRETARY] },
    { id: 'proposals', label: t.proposals, icon: FileText, href: '/dashboard/proposals', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER] },
    { id: 'bidding', label: language === 'ar' ? 'العطاءات' : 'Bidding', icon: Gavel, href: '/dashboard/bidding', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER] },
    { id: 'contracts', label: t.contracts, icon: FileCheck, href: '/dashboard/contracts', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER] },
    { id: 'finance', label: language === 'ar' ? 'الفواتير والسندات' : 'Invoices', icon: DollarSign, href: '/dashboard/finance', visibleRoles: ALL_EXCEPT_VIEWER },
    { id: 'procurement', label: language === 'ar' ? 'المشتريات والموردون' : 'Procurement', icon: ShoppingCart, href: '/dashboard/procurement', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER] },
  ];

  // ─── Section 3: المحاسبة والمالية (Finance & Accounting) ───
  const financeItems: SidebarItem[] = [
    { id: 'reports', label: t.reports, icon: BarChart3, href: '/dashboard/reports', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT] },
  ];

  // ─── Section 4: السكرتارية (Secretarial) ───
  const secretarialItems: SidebarItem[] = [
    { id: 'calendar', label: language === 'ar' ? 'التقويم' : 'Calendar', icon: Calendar, href: '/dashboard/calendar', visibleRoles: ALL_EXCEPT_VIEWER },
    { id: 'meetings', label: language === 'ar' ? 'الاجتماعات' : 'Meetings', icon: Video, href: '/dashboard/meetings', visibleRoles: ALL_EXCEPT_VIEWER },
    { id: 'correspondence', label: language === 'ar' ? 'المراسلات البلدية' : 'Municipality', icon: Mail, href: '/dashboard/correspondence', visibleRoles: ALL_EXCEPT_VIEWER },
    { id: 'notifications', label: language === 'ar' ? 'الإشعارات' : 'Notifications', icon: Bell, href: '/dashboard/notifications' },
  ];

  // ─── Section 5: الموارد البشرية (Human Resources) ───
  const hrSectionItems: SidebarItem[] = [
    { id: 'hr', label: t.hr, icon: Users, href: '/dashboard/hr', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.HR, UserRole.SECRETARY] },
    { id: 'team', label: language === 'ar' ? 'الفريق' : 'Team', icon: Users, href: '/dashboard/team', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER, UserRole.SECRETARY] },
    { id: 'workload', label: language === 'ar' ? 'الأحمال والقدرات' : 'Workload', icon: BriefcaseIcon, href: '/dashboard/workload', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_MANAGER] },
  ];

  // ─── Section 6: المعرفة والذكاء الاصطناعي (Knowledge & AI) ───
  const knowledgeItems: SidebarItem[] = [
    { id: 'knowledge', label: t.knowledge, icon: BookOpen, href: '/dashboard/knowledge', visibleRoles: ALL_EXCEPT_VIEWER },
    { id: 'aiChat', label: t.aiChat, icon: Bot, href: '/dashboard/ai-chat' },
    { id: 'help', label: language === 'ar' ? 'المساعدة' : 'Help', icon: HelpCircle, href: '/dashboard/help' },
  ];

  // ─── System & Settings (bottom) ───
  const systemItems: SidebarItem[] = [
    { id: 'automations', label: language === 'ar' ? 'الأتمتة' : 'Automations', icon: Zap, href: '/dashboard/automations', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'settings', label: t.settings, icon: Settings, href: '/dashboard/settings', visibleRoles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'pricing', label: language === 'ar' ? 'الأسعار' : 'Pricing', icon: Crown, href: '/dashboard/pricing', visibleRoles: [UserRole.ADMIN] },
  ];

  const adminItems: SidebarItem[] = [
    { id: 'admin', label: language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel', icon: Shield, href: '/dashboard/admin', visibleRoles: [UserRole.ADMIN] },
    { id: 'activities', label: t.activities, icon: Zap, href: '/dashboard/activities', visibleRoles: [UserRole.ADMIN] },
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
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Image src="/logo.png" alt="BluePrint" width={32} height={32} className="rounded-md object-contain" />
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
          {/* ─── Main Dashboard ─── */}
          <SidebarSection 
            items={filterByRole(mainItems)} 
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
          />

          {/* ─── التصميم والمشاريع (Design & Projects) ─── */}
          <CollapsibleSection 
            title={language === 'ar' ? 'التصميم والمشاريع' : 'Design & Projects'}
            icon={Compass}
            items={filterByRole(designItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={true}
          />

          {/* ─── العملاء والتعاقدات (Clients & Contracts) ─── */}
          {filterByRole(clientItems).length > 0 && (
          <CollapsibleSection 
            title={language === 'ar' ? 'العملاء والتعاقدات' : 'Clients & Contracts'}
            icon={Handshake}
            items={filterByRole(clientItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />
          )}

          {/* ─── المحاسبة والمالية (Finance & Accounting) ─── */}
          {filterByRole(financeItems).length > 0 && (
          <CollapsibleSection 
            title={language === 'ar' ? 'المحاسبة والمالية' : 'Finance & Accounting'}
            icon={Landmark}
            items={filterByRole(financeItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />
          )}

          {/* ─── السكرتارية (Secretarial) ─── */}
          {filterByRole(secretarialItems).length > 0 && (
          <CollapsibleSection 
            title={language === 'ar' ? 'السكرتارية' : 'Secretarial'}
            icon={ClipboardList}
            items={filterByRole(secretarialItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />
          )}

          {/* ─── الموارد البشرية (Human Resources) ─── */}
          {filterByRole(hrSectionItems).length > 0 && (
          <CollapsibleSection 
            title={language === 'ar' ? 'الموارد البشرية' : 'Human Resources'}
            icon={UserCog}
            items={filterByRole(hrSectionItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />
          )}

          {/* ─── المعرفة والذكاء الاصطناعي (Knowledge & AI) ─── */}
          <Separator className="my-2 bg-slate-800" />
          <CollapsibleSection 
            title={language === 'ar' ? 'المعرفة والذكاء الاصطناعي' : 'Knowledge & AI'}
            icon={Lightbulb}
            items={filterByRole(knowledgeItems)}
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
            defaultOpen={false}
          />

          {/* ─── System & Settings ─── */}
          <SidebarSection 
            items={filterByRole(systemItems)} 
            currentPage={currentPage}
            sidebarCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            isRTL={isRTL}
            onItemClick={handleItemClick}
          />

          {/* ─── Admin Panel ─── */}
          {filterByRole(adminItems).length > 0 && (
            <CollapsibleSection 
              title={language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
              icon={Shield}
              items={filterByRole(adminItems)}
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
              <Image src="/logo.png" alt="BluePrint" width={28} height={28} className="rounded-md object-contain" />
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
            <Image src="/logo.png" alt="BluePrint" width={32} height={32} className="rounded-md object-contain" />
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
