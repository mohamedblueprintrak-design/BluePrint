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
import { Building2, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff, UserCircle } from 'lucide-react';
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

      <div className="relative w-full max-w-md">
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

        {/* Demo Credentials */}
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                            <div className="space-y-2 pt-2 border-t border-slate-700/50">
                              <p className="text-xs text-slate-500 text-center">
                                {language === 'ar' ? 'تجربة سريعة - ادخل بدور مختلف' : 'Quick demo - Login as different role'}
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { role: language === 'ar' ? 'مدير' : 'Admin', user: 'admin', pass: 'Admin@123456', color: 'text-red-400 border-red-500/30 hover:bg-red-500/10' },
                                  { role: language === 'ar' ? 'مدير مشاريع' : 'Manager', user: 'manager', pass: 'Admin@123456', color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10' },
                                  { role: language === 'ar' ? 'مهندس معماري' : 'Arch. Eng', user: 'engineer', pass: 'Admin@123456', color: 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10' },
                                  { role: language === 'ar' ? 'مهندس إنشائي' : 'Struct. Eng', user: 'struct_eng', pass: 'Admin@123456', color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10' },
                                  { role: language === 'ar' ? 'مهندس كهربائي' : 'Elec. Eng', user: 'elec_eng', pass: 'Admin@123456', color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10' },
                                  { role: language === 'ar' ? 'مهندس موقع' : 'Site Eng', user: 'site_eng', pass: 'Admin@123456', color: 'text-teal-400 border-teal-500/30 hover:bg-teal-500/10' },
                                  { role: language === 'ar' ? 'مهندس ميكانيكا' : 'MEP Eng', user: 'mech_eng', pass: 'Admin@123456', color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10' },
                                  { role: language === 'ar' ? 'رسام' : 'Draftsman', user: 'draftsman', pass: 'Admin@123456', color: 'text-purple-400 border-purple-500/30 hover:bg-purple-500/10' },
                                  { role: language === 'ar' ? 'محاسب' : 'Accountant', user: 'accountant', pass: 'Admin@123456', color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
                                  { role: language === 'ar' ? 'سكرتيرة' : 'Secretary', user: 'secretary', pass: 'Admin@123456', color: 'text-pink-400 border-pink-500/30 hover:bg-pink-500/10' },
                                  { role: language === 'ar' ? 'مشاهد' : 'Viewer', user: 'viewer', pass: 'Admin@123456', color: 'text-slate-400 border-slate-500/30 hover:bg-slate-500/10' },
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
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${demo.color}`}
                                  >
                                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCircle className="h-3.5 w-3.5" />}
                                    {demo.role}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-slate-600 text-center">
                                {language === 'ar' ? 'الباسورد: Admin@123456' : 'Password: Admin@123456'}
                              </p>
                            </div>
        </div>
      </div>
    </div>
  );
}
