'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ApiErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ApiError({ message, onRetry }: ApiErrorProps) {
  return (
    <Card className="border-yellow-500/50 bg-yellow-500/10">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
          <p className="text-foreground/80 mb-3">
            {message || 'حدث خطأ في تحميل البيانات'}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ApiError;
