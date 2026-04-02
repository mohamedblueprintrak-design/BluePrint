'use client';

/**
 * Two-Factor Authentication Setup Component
 * مكون إعداد المصادقة الثنائية
 * 
 * Provides complete 2FA setup flow:
 * 1. Generate QR code
 * 2. Verify code
 * 3. Show backup codes
 * 4. Disable 2FA
 */

import { useState} from 'react';
import { useApp } from '@/context/app-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Key,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSetupProps {
  onStatusChange?: (enabled: boolean) => void;
}

interface TwoFactorStatus {
  enabled: boolean;
}

interface SetupResponse {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

interface _EnableResponse {
  backupCodes: string[];
}

export function TwoFactorSetup({ onStatusChange }: TwoFactorSetupProps) {
  const { language } = useApp();
  const { toast } = useToast();

  // State
  const [status, setStatus] = useState<TwoFactorStatus>({ enabled: false });
  const [isLoading, setIsLoading] = useState(true);
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Translations
  const texts = {
    title: language === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication',
    description: language === 'ar'
      ? 'أضف طبقة أمان إضافية لحماية حسابك'
      : 'Add an extra layer of security to protect your account',
    enabled: language === 'ar' ? 'مفعلة' : 'Enabled',
    disabled: language === 'ar' ? 'غير مفعلة' : 'Disabled',
    enable: language === 'ar' ? 'تفعيل المصادقة الثنائية' : 'Enable Two-Factor Authentication',
    disable: language === 'ar' ? 'تعطيل' : 'Disable',
    setupTitle: language === 'ar' ? 'إعداد المصادقة الثنائية' : 'Setup Two-Factor Authentication',
    step1: language === 'ar' ? 'الخطوة 1: امسح الرمز' : 'Step 1: Scan the QR Code',
    step1Desc: language === 'ar'
      ? 'استخدم تطبيق المصادقة على هاتفك لمسح رمز QR'
      : 'Use your authenticator app on your phone to scan the QR code',
    step2: language === 'ar' ? 'الخطوة 2: أدخل الرمز' : 'Step 2: Enter the Code',
    step2Desc: language === 'ar'
      ? 'أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة'
      : 'Enter the 6-digit code from your authenticator app',
    verificationCode: language === 'ar' ? 'رمز التحقق' : 'Verification Code',
    verify: language === 'ar' ? 'تحقق وتفعيل' : 'Verify and Enable',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    manualEntry: language === 'ar' ? 'أو أدخل يدوياً:' : 'Or enter manually:',
    backupCodesTitle: language === 'ar' ? 'رموز الاسترداد' : 'Backup Codes',
    backupCodesDesc: language === 'ar'
      ? 'احفظ هذه الرموز في مكان آمن. يمكنك استخدامها للوصول إلى حسابك إذا فقدت الوصول إلى تطبيق المصادقة.'
      : 'Save these codes in a safe place. You can use them to access your account if you lose access to your authenticator app.',
    copyAll: language === 'ar' ? 'نسخ الكل' : 'Copy All',
    copied: language === 'ar' ? 'تم النسخ!' : 'Copied!',
    done: language === 'ar' ? 'تم' : 'Done',
    disableTitle: language === 'ar' ? 'تعطيل المصادقة الثنائية' : 'Disable Two-Factor Authentication',
    disableDesc: language === 'ar'
      ? 'أدخل كلمة المرور لتأكيد تعطيل المصادقة الثنائية'
      : 'Enter your password to confirm disabling two-factor authentication',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    confirm: language === 'ar' ? 'تأكيد التعطيل' : 'Confirm Disable',
    warning: language === 'ar'
      ? 'تحذير: سيؤدي هذا إلى إزالة طبقة الأمان الإضافية من حسابك.'
      : 'Warning: This will remove the extra security layer from your account.',
    errorFetch: language === 'ar' ? 'فشل في جلب حالة المصادقة الثنائية' : 'Failed to fetch 2FA status',
    errorSetup: language === 'ar' ? 'فشل في إنشاء إعداد المصادقة الثنائية' : 'Failed to setup 2FA',
    errorVerify: language === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid verification code',
    errorDisable: language === 'ar' ? 'فشل في تعطيل المصادقة الثنائية' : 'Failed to disable 2FA',
    successEnable: language === 'ar' ? 'تم تفعيل المصادقة الثنائية بنجاح' : 'Two-factor authentication enabled successfully',
    successDisable: language === 'ar' ? 'تم تعطيل المصادقة الثنائية' : 'Two-factor authentication disabled',
  };

  // Fetch 2FA status
  const _fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ enabled: data.data.enabled });
        onStatusChange?.(data.data.enabled);
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'setup' }),
      });
      const data = await response.json();
      if (data.success) {
        setSetupData(data.data);
      } else {
        toast({
          title: texts.errorSetup,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: texts.errorSetup,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: language === 'ar' ? 'أدخل رمز التحقق المكون من 6 أرقام' : 'Enter the 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'enable', code: verificationCode }),
      });
      const data = await response.json();
      if (data.success) {
        setBackupCodes(data.data.backupCodes || []);
        setShowBackupCodes(true);
        setStatus({ enabled: true });
        onStatusChange?.(true);
        toast({
          title: texts.successEnable,
        });
      } else {
        toast({
          title: texts.errorVerify,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: texts.errorVerify,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!disablePassword) {
      toast({
        title: language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ enabled: false });
        onStatusChange?.(false);
        setShowDisableDialog(false);
        setDisablePassword('');
        toast({
          title: texts.successDisable,
        });
      } else {
        toast({
          title: data.error?.message || texts.errorDisable,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: texts.errorDisable,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast({
      title: texts.copied,
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: texts.copied,
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  // Backup codes dialog
  if (showBackupCodes) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            {texts.backupCodesTitle}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {texts.backupCodesDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg border border-border"
              >
                <code className="text-sm font-mono text-foreground/80">{code}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyCode(code)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              {language === 'ar'
                ? 'احفظ هذه الرموز في مكان آمن! لن تتمكن من رؤيتها مرة أخرى.'
                : 'Save these codes securely! You won\'t be able to see them again.'}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCopyAllCodes}>
            <Copy className="w-4 h-4 me-2" />
            {texts.copyAll}
          </Button>
          <Button onClick={() => setShowBackupCodes(false)}>
            <Check className="w-4 h-4 me-2" />
            {texts.done}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Setup flow
  if (setupData) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            {texts.setupTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="space-y-3">
            <Label className="text-foreground/80">{texts.step1}</Label>
            <p className="text-sm text-muted-foreground">{texts.step1Desc}</p>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              {/* QR Code placeholder - in production use actual QR library */}
              <div className="w-48 h-48 bg-muted flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="w-32 h-32 text-foreground mx-auto" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{texts.manualEntry}</p>
              <code className="text-sm bg-muted px-3 py-1 rounded text-blue-400">
                {setupData.manualEntryKey}
              </code>
            </div>
          </div>

          {/* Verification Code */}
          <div className="space-y-3">
            <Label className="text-foreground/80">{texts.step2}</Label>
            <p className="text-sm text-muted-foreground">{texts.step2Desc}</p>
            <Input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="bg-muted border-border text-foreground text-center text-2xl tracking-widest"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setSetupData(null);
              setVerificationCode('');
            }}
            disabled={isProcessing}
          >
            {texts.cancel}
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isProcessing || verificationCode.length !== 6}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin me-2" />
            ) : (
              <Check className="w-4 h-4 me-2" />
            )}
            {texts.verify}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Status display
  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            {texts.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {texts.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              {status.enabled ? (
                <ShieldCheck className="w-8 h-8 text-green-500" />
              ) : (
                <ShieldOff className="w-8 h-8 text-muted-foreground" />
              )}
              <div>
                <p className="text-foreground font-medium">
                  {status.enabled ? texts.enabled : texts.disabled}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status.enabled
                    ? (language === 'ar' ? 'حسابك محمي بطبقة إضافية' : 'Your account has extra protection')
                    : (language === 'ar' ? 'حسابك غير محمي بطبقة إضافية' : 'Your account lacks extra protection')}
                </p>
              </div>
            </div>
            <Badge variant={status.enabled ? 'default' : 'secondary'} className={status.enabled ? 'bg-green-600' : ''}>
              {status.enabled ? texts.enabled : texts.disabled}
            </Badge>
          </div>
        </CardContent>
        <CardFooter>
          {status.enabled ? (
            <Button
              variant="destructive"
              onClick={() => setShowDisableDialog(true)}
              className="w-full"
            >
              <ShieldOff className="w-4 h-4 me-2" />
              {texts.disable}
            </Button>
          ) : (
            <Button onClick={handleEnable} className="w-full bg-blue-600 hover:bg-blue-700">
              <ShieldCheck className="w-4 h-4 me-2" />
              {texts.enable}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {texts.disableTitle}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {texts.disableDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-200">
                {texts.warning}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label className="text-foreground/80">{texts.password}</Label>
              <Input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false);
                setDisablePassword('');
              }}
              disabled={isProcessing}
            >
              {texts.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isProcessing || !disablePassword}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : null}
              {texts.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TwoFactorSetup;
