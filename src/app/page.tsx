'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Menu, X, ArrowLeft, Users, FileText, Bot,
  DollarSign, HardHat, BarChart3, ChevronRight, Star,
  Shield, Zap, Globe
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PricingPage } from '@/components/pricing/pricing-page';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      title: 'إدارة المشاريع',
      description: 'تتبع كامل للمشاريع مع جدول الكميات والمعالم الرئيسية وتقارير الموقع والجداول الزمنية',
    },
    {
      icon: <Bot className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      title: 'المساعد الذكي',
      description: 'مساعد AI متخصص في الهندسة يدعم نماذج GPT-4 و Gemini و DeepSeek للتحليل والتوصيات',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      title: 'الفواتير والعقود',
      description: 'نظام فوترة متكامل مع دعم الضرائب وإدارة العقود والتغييرات وسندات القبض',
    },
    {
      icon: <Users className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-500/10',
      title: 'الموارد البشرية',
      description: 'إدارة الحضور والإجازات والرواتب مع نظام موافقات متكامل وتقييم الأداء',
    },
    {
      icon: <HardHat className="w-6 h-6" />,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-500/10',
      title: 'الإشراف الميداني',
      description: 'نظام العيوب واليوميات الميدانية مع دعم الصور والموقع الجغرافي والتقارير',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-sky-500 to-blue-500',
      bgColor: 'bg-sky-500/10',
      title: 'التقارير والتحليلات',
      description: 'تقارير PDF و Excel مع لوحات تحكم تفاعلية ومؤشرات أداء متقدمة',
    },
  ];

  const stats = [
    { value: '500+', label: 'مكتب هندسي', icon: <Globe className="w-5 h-5" /> },
    { value: '12,000+', label: 'مشروع مكتمل', icon: <FileText className="w-5 h-5" /> },
    { value: '99.9%', label: 'وقت تشغيل', icon: <Zap className="w-5 h-5" /> },
    { value: '24/7', label: 'دعم فني', icon: <Shield className="w-5 h-5" /> },
  ];

  const navLinks = [
    { label: 'المميزات', href: '#features' },
    { label: 'الأسعار', href: '#pricing' },
    { label: 'GitHub', href: 'https://github.com/mohamedblueprintrak-design/BluePrint', external: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center p-0.5 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Image src="/logo.png" alt="BluePrint" width={36} height={36} className="rounded-lg object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white leading-tight">BluePrint</h1>
              <p className="text-[11px] text-slate-400 leading-tight">نظام إدارة الاستشارات الهندسية</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-slate-800/50"
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-slate-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-slate-800/50"
                >
                  {link.label}
                </a>
              )
            ))}
          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              تسجيل الدخول
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl">
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors text-sm px-4 py-3 rounded-lg hover:bg-slate-800/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm px-4 py-3 rounded-lg hover:bg-slate-800/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              ))}
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-3 rounded-lg text-sm font-medium mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                تسجيل الدخول
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-4 py-1.5 mb-8">
            <span className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span className="text-xs text-slate-300">منصة موثوقة من أكثر من 500 مكتب هندسي</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            نظام إدارة متكامل
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
              لمكاتب الاستشارات الهندسية
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            منصة SaaS شاملة لإدارة المشاريع والعملاء والفواتير والموارد البشرية
            <br className="hidden sm:block" />
            مع مساعد ذكي متخصص في الهندسة يعزز إنتاجية فريقك
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 text-lg"
            >
              ابدأ الآن مجاناً
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 text-white px-8 py-3.5 rounded-xl font-medium transition-all text-lg"
            >
              اكتشف المميزات
            </a>
          </div>

          {/* Demo Info */}
          <p className="text-sm text-slate-500 mt-6">
            ✨ جرب الديمو مجاناً — لا حاجة لبطاقة ائتمان
          </p>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                  {stat.icon}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES SECTION ═══════════ */}
      <section id="features" className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-14">
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4">
              مميزات المنصة
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              كل ما تحتاجه مكتبك الهندسي
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> في مكان واحد</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              أدوات متكاملة مصممة خصيصاً لاحتياجات مكاتب الاستشارات الهندسية في المنطقة العربية
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />

                <div className="relative">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <div className={`bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}>
                      {feature.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING SECTION ═══════════ */}
      <section id="pricing" className="py-20 md:py-24 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-14">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-4">
              خطط الأسعار
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              اختر الخطة المناسبة
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400"> لمكتبك</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              خطط مرنة تناسب مكاتب الاستشارات بمختلف أحجامها — ابدأ مجاناً وتوسع حسب حاجتك
            </p>
          </div>

          {/* Pricing Component */}
          <PricingPage lang="ar" />
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="relative bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl p-8 md:p-12 border border-blue-500/20">
            <div className="absolute inset-0 bg-slate-950/40 rounded-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                جاهز تبدأ رحلتك؟
              </h2>
              <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
                انضم لمئات المكاتب الهندسية التي تستخدم BluePrint لتحسين إدارة مشاريعها
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-xl shadow-blue-500/25 text-lg"
                >
                  ابدأ مجاناً الآن
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
              <p className="text-sm text-slate-400 mt-6">
                🔒 لا حاجة لبطاقة ائتمان — جرّب كل المميزات في وضع الديمو
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center p-0.5">
                <Image src="/logo.png" alt="BluePrint" width={28} height={28} className="rounded-md object-contain" />
              </div>
              <span className="text-sm font-semibold text-white">BluePrint</span>
            </div>

            {/* Copyright */}
            <p className="text-slate-500 text-sm text-center">
              © {new Date().getFullYear()} BluePrint. جميع الحقوق محفوظة.
            </p>

            {/* Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/mohamedblueprintrak-design/BluePrint"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                GitHub
              </a>
              <span className="text-slate-700">|</span>
              <a href="mailto:support@blueprint.ae" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
                الدعم الفني
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
