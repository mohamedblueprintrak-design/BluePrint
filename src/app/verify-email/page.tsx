'use client';

/**
 * Email Verification Page
 * صفحة التحقق من البريد الإلكتروني
 * 
 * Handles email verification via token
 */

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');

  const verifyEmail = useCallback(async (verificationToken: string) => {
    setStatus('loading');

    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('تم التحقق من بريدك الإلكتروني بنجاح!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'فشل التحقق من البريد الإلكتروني');
      }
    } catch {
      setStatus('error');
      setMessage('حدث خطأ في الاتصال بالخادم');
    }
  }, [router]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('رمز التحقق غير موجود');
      return;
    }

    verifyEmail(token);
  }, [token, verifyEmail]);

  const handleResend = async () => {
    router.push('/login?action=resend-verification');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-violet-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            )}
            {status === 'idle' && (
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Mail className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'جاري التحقق...'}
            {status === 'success' && 'تم التحقق بنجاح!'}
            {status === 'error' && 'فشل التحقق'}
            {status === 'idle' && 'التحقق من البريد الإلكتروني'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'يرجى الانتظار بينما نتحقق من بريدك الإلكتروني'}
            {status === 'success' && 'سيتم تحويلك إلى صفحة تسجيل الدخول خلال لحظات'}
            {status === 'error' && 'حدث خطأ أثناء التحقق من بريدك الإلكتروني'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={status === 'success' ? 'default' : 'destructive'}>
            <AlertDescription className="text-center">
              {message}
            </AlertDescription>
          </Alert>

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                قد يكون الرابط منتهي الصلاحية أو تم استخدامه بالفعل
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResend}
              >
                إرسال رابط جديد
              </Button>
            </div>
          )}

          {status === 'success' && (
            <Button asChild className="w-full">
              <Link href="/login">
                تسجيل الدخول الآن
              </Link>
            </Button>
          )}

          {(status === 'error' || status === 'idle') && (
            <Button variant="ghost" asChild className="w-full">
              <Link href="/login">
                العودة لتسجيل الدخول
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
