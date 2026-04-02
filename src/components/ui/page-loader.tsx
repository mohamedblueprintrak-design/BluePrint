'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message }: PageLoaderProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-muted-foreground">
            {message || 'جاري التحميل...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PageLoader;
