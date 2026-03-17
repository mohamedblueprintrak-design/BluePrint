'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export function LoginPage() {
  const { login, register, isLoading } = useAuth();
  const { language, setLanguage } = useApp();
  const { t } = useTranslation(language || 'ar'); // Default to 'ar' if language is undefined
  const router = useRouter();
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
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
    const result = await login(loginForm);
    if (result.success) {
      // Use window.location for reliable redirect after login
      // This ensures the new page loads with fresh auth state from localStorage
      window.location.href = '/dashboard';
    } else {
      setError(result.error?.message || t.loginError);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (registerForm.password.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    const result = await register(registerForm);
    if (result.success) {
      setSuccess(t.registerSuccess);
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '', fullName: '' });
    } else {
      setError(result.error?.message || (language === 'ar' ? 'خطأ في التسجيل' : 'Registration failed'));
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">
                {language === 'ar' ? 'بيانات التجربة:' : 'Demo credentials:'}
              </p>
              <p className="text-sm font-medium text-blue-400">
                admin / admin123
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setLoginForm({ username: 'admin', password: 'admin123' });
              }}
              className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            >
              {language === 'ar' ? 'استخدام' : 'Use'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
