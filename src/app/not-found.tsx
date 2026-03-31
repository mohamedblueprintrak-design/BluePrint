'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileQuestion className="w-10 h-10 text-blue-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">الصفحة غير موجودة</h2>
          
          <p className="text-gray-500 mb-8">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
            <br />
            يرجى التحقق من الرابط أو العودة للصفحة الرئيسية.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard">
                <Home className="w-4 h-4 ml-2" />
                الصفحة الرئيسية
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة للخلف
              </Link>
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-400">
              هل تحتاج مساعدة؟{' '}
              <Link href="/dashboard/help" className="text-blue-600 hover:underline">
                تواصل مع الدعم الفني
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
