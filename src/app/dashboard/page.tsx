'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2, LayoutDashboard, FileSpreadsheet, AlertTriangle,
  ShoppingCart, BookOpen, Users, FileText, Settings, LogOut,
  Menu, X, ChevronLeft, Bell, Search
} from 'lucide-react';
import Link from 'next/link';

const MENU_ITEMS = [
  { id: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'boq', labelAr: 'جدول الكميات', labelEn: 'Bill of Quantities', icon: FileSpreadsheet, href: '/dashboard/boq' },
  { id: 'defects', labelAr: 'العيوب والمخالفات', labelEn: 'Defects', icon: AlertTriangle, href: '/dashboard/defects' },
  { id: 'purchase-orders', labelAr: 'أوامر الشراء', labelEn: 'Purchase Orders', icon: ShoppingCart, href: '/dashboard/purchase-orders' },
  { id: 'knowledge', labelAr: 'قاعدة المعرفة', labelEn: 'Knowledge Base', icon: BookOpen, href: '/dashboard/knowledge' },
  { id: 'clients', labelAr: 'العملاء', labelEn: 'Clients', icon: Users, href: '/dashboard/clients' },
  { id: 'documents', labelAr: 'المستندات', labelEn: 'Documents', icon: FileText, href: '/dashboard/documents' },
  { id: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useApp();
  const { t } = useTranslation(language);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex flex-col bg-slate-900 border-l border-slate-800 transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">{t.appName}</h1>
                <p className="text-xs text-slate-400">{t.appSubtitle}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="text-sm">{language === 'ar' ? item.labelAr : item.labelEn}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.username}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full mt-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 me-2" />
              {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
          <h1 className="text-lg font-bold text-white">{t.appName}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="text-slate-400"
          >
            {language === 'ar' ? 'EN' : 'ع'}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/95 pt-16">
          <nav className="p-4 space-y-2">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50"
              >
                <item.icon className="w-5 h-5" />
                <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
              </Link>
            ))}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full mt-4 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 me-2" />
              {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-16">
        {/* Top Bar */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                className="ps-9 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-slate-400"
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            {language === 'ar' ? 'مرحباً بك في BluePrint' : 'Welcome to BluePrint'}
          </h2>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'مشاريع نشطة' : 'Active Projects'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <FileSpreadsheet className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">847</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'بنود BOQ' : 'BOQ Items'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">23</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'عيوب مفتوحة' : 'Open Defects'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">48</p>
                    <p className="text-sm text-slate-400">{language === 'ar' ? 'عميل' : 'Clients'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <h3 className="text-lg font-semibold text-white mb-4">
            {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MENU_ITEMS.slice(1, 5).map((item) => (
              <Link key={item.id} href={item.href}>
                <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                      <item.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h4 className="text-white font-medium">
                      {language === 'ar' ? item.labelAr : item.labelEn}
                    </h4>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Recent Activity */}
          <Card className="mt-8 bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">
                {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: language === 'ar' ? 'تم إضافة بند جديد لجدول الكميات' : 'New BOQ item added', time: language === 'ar' ? 'منذ 5 دقائق' : '5 mins ago', type: 'boq' },
                  { action: language === 'ar' ? 'تم تسجيل عيب جديد في المشروع' : 'New defect reported', time: language === 'ar' ? 'منذ ساعة' : '1 hour ago', type: 'defect' },
                  { action: language === 'ar' ? 'تم إنشاء أمر شراء جديد' : 'New purchase order created', time: language === 'ar' ? 'منذ 3 ساعات' : '3 hours ago', type: 'po' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'boq' ? 'bg-green-400' : 
                      activity.type === 'defect' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`} />
                    <span className="text-slate-300 flex-1">{activity.action}</span>
                    <span className="text-slate-500 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
