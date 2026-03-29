'use client';

import { PricingPage } from '@/components/pricing/pricing-page';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M3 7l9-4 9 4M7 11v6M12 11v6M17 11v6" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BluePrint</h1>
              <p className="text-xs text-slate-400">Engineering Consultancy Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">
              الأسعار
            </a>
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">
              المميزات
            </a>
            <a href="https://github.com/mohamedblueprintrak-design/BluePrint" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm">
              GitHub
            </a>
            <a href="/dashboard" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              تسجيل الدخول
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            نظام إدارة متكامل
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-2">
              لمكاتب الاستشارات الهندسية
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            منصة SaaS شاملة لإدارة المشاريع والعملاء والفواتير والموارد البشرية مع مساعد ذكي متخصص في الهندسة
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="#pricing" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition-colors">
              ابدأ الآن مجاناً
            </a>
            <a href="https://github.com/mohamedblueprintrak-design/BluePrint" target="_blank" rel="noopener noreferrer" className="border border-slate-700 hover:border-slate-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              عرض المشروع
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            مميزات المنصة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">إدارة المشاريع</h3>
              <p className="text-slate-400">تتبع كامل للمشاريع مع جدول الكميات والمعالم الرئيسية وتقارير الموقع</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">المساعد الذكي</h3>
              <p className="text-slate-400">مساعد AI متخصص في الهندسة يدعم نماذج GPT-4 و Gemini و DeepSeek</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-chart-3/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-chart-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">الفواتير والعقود</h3>
              <p className="text-slate-400">نظام فوترة متكامل مع دعم الضرائب وإدارة العقود والتغييرات</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">الموارد البشرية</h3>
              <p className="text-slate-400">إدارة الحضور والإجازات والرواتب مع نظام موافقات متكامل</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">الإشراف الميداني</h3>
              <p className="text-slate-400">نظام العيوب واليوميات الميدانية مع دعم الصور والموقع الجغرافي</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-info/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">التقارير والتحليلات</h3>
              <p className="text-slate-400">تقارير PDF و Excel مع لوحات تحكم تفاعلية ومؤشرات أداء</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <PricingPage lang="ar" />
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            © 2024 BluePrint. جميع الحقوق محفوظة.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            تم التطوير بواسطة BluePrint Ultimate AI Engineering Architect
          </p>
        </div>
      </footer>
    </div>
  );
}
