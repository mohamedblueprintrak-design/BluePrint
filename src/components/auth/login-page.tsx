'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export function LoginPage() {
  const { login, register, isLoading } = useAuth();
  const { language, setLanguage } = useApp();
  const { t } = useTranslation(language || 'ar');
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: '',
    role: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const result = await login({ ...loginForm, rememberMe });
      if (result.success) {
        // Use window.location for reliable redirect after login
        // This ensures the new page loads with fresh auth state from localStorage
        window.location.href = '/dashboard';
      } else {
        setError(result.error?.message || t.loginError);
      }
    } catch {
      setError(language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error occurred');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (registerForm.password.length < 8) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    try {
      const result = await register(registerForm);
      if (result.success) {
        setSuccess(language === 'ar' ? 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول' : 'Account created successfully! You can now login');
        setRegisterForm({ username: '', email: '', password: '', confirmPassword: '', fullName: '', organizationName: '', role: '', department: '' });
        // Switch to login tab after successful registration
        setTimeout(() => {
          const loginTab = document.querySelector('[value="login"]') as HTMLElement;
          if (loginTab) loginTab.click();
        }, 1500);
      } else {
        setError(result.error?.message || (language === 'ar' ? 'خطأ في التسجيل' : 'Registration failed'));
      }
    } catch {
      setError(language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo & Language Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center p-1">
              <Image src="/logo.png" alt="BluePrint" width={48} height={48} className="rounded-lg object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t.appName}</h1>
              <p className="text-sm text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="text-slate-400 hover:text-white"
          >
            {language === 'ar' ? 'EN' : 'عربي'}
          </Button>
        </div>

        {/* Demo Login Section - ABOVE the login card */}
        <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-500/30 shadow-lg shadow-blue-500/5">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              🚀 {language === 'ar' ? 'جرّب BluePrint - اختر دور للاستكشاف' : 'Try BluePrint - Pick a role to explore'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {language === 'ar' ? 'اضغط على أي دور لتسجيل الدخول تلقائياً واستكشاف النظام' : 'Click any role to auto-login and explore the system'}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { role: language === 'ar' ? 'مدير' : 'Admin', user: 'admin', pass: 'Admin@123456', color: 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400 hover:from-red-500/30', icon: '👑', desc: language === 'ar' ? 'صاحب المكتب' : 'Office Owner' },
              { role: language === 'ar' ? 'مدير مشاريع' : 'Manager', user: 'manager', pass: 'Admin@123456', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400 hover:from-amber-500/30', icon: '📋', desc: language === 'ar' ? 'إدارة المشاريع' : 'Project Mgmt' },
              { role: language === 'ar' ? 'مهندس معماري' : 'Arch. Eng', user: 'engineer', pass: 'Admin@123456', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400 hover:from-blue-500/30', icon: '🏗️', desc: language === 'ar' ? 'القسم المعماري' : 'Architecture' },
              { role: language === 'ar' ? 'مهندس إنشائي' : 'Struct. Eng', user: 'struct_eng', pass: 'Admin@123456', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400 hover:from-orange-500/30', icon: '🧱', desc: language === 'ar' ? 'القسم الإنشائي' : 'Structural' },
              { role: language === 'ar' ? 'مهندس كهربائي' : 'Elec. Eng', user: 'elec_eng', pass: 'Admin@123456', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-400 hover:from-yellow-500/30', icon: '⚡', desc: language === 'ar' ? 'القسم الكهربائي' : 'Electrical' },
              { role: language === 'ar' ? 'مهندس موقع' : 'Site Eng', user: 'site_eng', pass: 'Admin@123456', color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 hover:border-teal-400 hover:from-teal-500/30', icon: '📍', desc: language === 'ar' ? 'إدارة الموقع' : 'Site Mgmt' },
              { role: language === 'ar' ? 'مهندس ميكانيكا' : 'MEP Eng', user: 'mech_eng', pass: 'Admin@123456', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400 hover:from-cyan-500/30', icon: '🔧', desc: language === 'ar' ? 'خدمات متكاملة' : 'MEP Services' },
              { role: language === 'ar' ? 'رسام' : 'Draftsman', user: 'draftsman', pass: 'Admin@123456', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400 hover:from-purple-500/30', icon: '✏️', desc: language === 'ar' ? 'الرسم والتصميم' : 'Drafting' },
              { role: language === 'ar' ? 'محاسب' : 'Accountant', user: 'accountant', pass: 'Admin@123456', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400 hover:from-emerald-500/30', icon: '💰', desc: language === 'ar' ? 'المالية والفواتير' : 'Finance' },
              { role: language === 'ar' ? 'سكرتيرة' : 'Secretary', user: 'secretary', pass: 'Admin@123456', color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-400 hover:from-pink-500/30', icon: '📝', desc: language === 'ar' ? 'التنسيق والإدخال' : 'Coordination' },
              { role: language === 'ar' ? 'موارد بشرية' : 'HR', user: 'hr', pass: 'Admin@123456', color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 hover:border-rose-400 hover:from-rose-500/30', icon: '👥', desc: language === 'ar' ? 'إدارة الموظفين' : 'HR Mgmt' },
              { role: language === 'ar' ? 'مشاهد' : 'Viewer', user: 'viewer', pass: 'Admin@123456', color: 'from-slate-500/20 to-slate-600/10 border-slate-500/30 hover:border-slate-400 hover:from-slate-500/30', icon: '👁️', desc: language === 'ar' ? 'عرض فقط' : 'Read Only' },
            ].map((demo) => (
              <button
                key={demo.user}
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  setLoginForm({ username: demo.user, password: demo.pass });
                  const result = await login({ username: demo.user, password: demo.pass, rememberMe: false });
                  if (result.success) {
                    window.location.href = '/dashboard';
                  } else {
                    setError(result.error?.message || t.loginError);
                  }
                }}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border bg-gradient-to-br transition-all duration-200 disabled:opacity-50 ${demo.color}`}
              >
                <span className="text-lg">{demo.icon}</span>
                <span className="text-xs font-semibold text-white">{demo.role}</span>
                <span className="text-[10px] text-slate-400 leading-tight text-center">{demo.desc}</span>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Login/Register Card */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  {t.login}
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  {t.register}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/50 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="mb-4 bg-green-500/10 border-green-500/50 text-green-400">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-slate-300">
                      {t.username}
                    </Label>
                    <div className="relative">
                      <User className="absolute start-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="login-username"
                        type="text"
                        placeholder={t.username}
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        className="ps-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-slate-300">
                        {t.password}
                      </Label>
                      <button
                        type="button"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute start-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder={t.password}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="ps-10 pe-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute end-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="remember-me" className="text-sm text-slate-400 cursor-pointer">
                      {language === 'ar' ? 'تذكرني' : 'Remember me'}
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin me-2" />
                    ) : null}
                    {t.login}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-fullname" className="text-slate-300">
                      {t.fullName}
                    </Label>
                    <div className="relative">
                      <User className="absolute start-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="register-fullname"
                        type="text"
                        placeholder={t.fullName}
                        value={registerForm.fullName}
                        onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                        className="ps-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-slate-300">
                      {t.username}
                    </Label>
                    <div className="relative">
                      <User className="absolute start-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="register-username"
                        type="text"
                        placeholder={t.username}
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        className="ps-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-slate-300">
                      {t.email}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder={t.email}
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="ps-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-slate-300">
                      {t.password}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? 'text' : 'password'}
                        placeholder={t.password}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="ps-10 pe-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute end-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-slate-300">
                      {t.confirmPassword}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        id="register-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t.confirmPassword}
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="ps-10 pe-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                            {/* Organization Name */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-300">
                                {language === 'ar' ? 'اسم الشركة / المكتب' : 'Company / Office Name'}
                              </label>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                  type="text"
                                  placeholder={language === 'ar' ? 'مثال: شركة الأمل للمقاولات' : 'e.g. Al Amal Construction'}
                                  value={registerForm.organizationName || ''}
                                  onChange={(e) => setRegisterForm({ ...registerForm, organizationName: e.target.value })}
                                  className="pl-10 bg-slate-800/50 border-slate-700"
                                />
                              </div>
                              <p className="text-xs text-slate-500">
                                {language === 'ar' ? 'أول حد يسجل باسم الشركة هيبقى المدير (Admin)' : 'First person to register with company name becomes Admin'}
                              </p>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-300">
                                {language === 'ar' ? 'دورك في المكتب' : 'Your Role'}
                              </label>
                              <select
                                value={registerForm.role || ''}
                                onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">{language === 'ar' ? '-- اختر دورك --' : '-- Select your role --'}</option>
                                <option value="ADMIN">{language === 'ar' ? 'مدير / صاحب المكتب' : 'Manager / Office Owner'}</option>
                                <option value="MANAGER">{language === 'ar' ? 'مدير مشاريع' : 'Project Manager'}</option>
                                <option value="ENGINEER">{language === 'ar' ? 'مهندس' : 'Engineer'}</option>
                                <option value="DRAFTSMAN">{language === 'ar' ? 'رسام' : 'Draftsman'}</option>
                                <option value="ACCOUNTANT">{language === 'ar' ? 'محاسب' : 'Accountant'}</option>
                                <option value="HR">{language === 'ar' ? 'موارد بشرية' : 'HR'}</option>
                                <option value="SECRETARY">{language === 'ar' ? 'سكرتيرة' : 'Secretary'}</option>
                              </select>
                              <p className="text-xs text-slate-500">
                                {language === 'ar' ? 'لو مديرك هيضيفك للفريق، اختار دورك هنا' : 'If your manager will add you to the team, select your role here'}
                              </p>
                            </div>

                            {/* Department Selection - Only for Engineers */}
                            {registerForm.role === 'ENGINEER' && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                  {language === 'ar' ? 'التخصص الهندسي' : 'Engineering Department'}
                                </label>
                                <select
                                  value={registerForm.department || ''}
                                  onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">{language === 'ar' ? '-- اختر تخصصك --' : '-- Select your department --'}</option>
                                  <option value="ARCHITECTURAL">{language === 'ar' ? 'معماري' : 'Architectural'}</option>
                                  <option value="STRUCTURAL">{language === 'ar' ? 'إنشائي' : 'Structural'}</option>
                                  <option value="ELECTRICAL">{language === 'ar' ? 'كهربائي' : 'Electrical'}</option>
                                  <option value="MECHANICAL">{language === 'ar' ? 'ميكانيكي / تكييف' : 'Mechanical / HVAC'}</option>
                                  <option value="PLUMBING">{language === 'ar' ? 'سباكة / صرف' : 'Plumbing / Drainage'}</option>
                                  <option value="CIVIL">{language === 'ar' ? 'مدني' : 'Civil'}</option>
                                  <option value="MEP">{language === 'ar' ? 'MEP (خدمات متكاملة)' : 'MEP (Multi-discipline)'}</option>
                                </select>
                                <p className="text-xs text-slate-500">
                                  {language === 'ar' ? 'هيظهرلك تبس تخصصك + كل الأقسام في المصفوفة' : 'You will see your department tab + all departments in Matrix view'}
                                </p>
                              </div>
                            )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin me-2" />
                    ) : null}
                    {t.register}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
