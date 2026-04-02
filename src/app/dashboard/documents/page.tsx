'use client';

import { useApp } from '@/context/app-context';
import { DocumentsPage } from '@/components/documents/documents-page';
import { TransmittalSystem } from '@/components/transmittal/transmittal-system';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Send } from 'lucide-react';

export default function DocumentsRoute() {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-400" />
          {isRTL ? 'المستندات والمراسلات' : 'Documents & Transmittals'}
        </h1>
        <p className="text-muted-foreground mt-1">{isRTL ? 'إدارة المستندات وإرسال المراسلات الداخلية' : 'Manage documents and internal transmittals'}</p>
      </div>
      <Tabs defaultValue="documents" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-muted w-full sm:w-auto">
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground gap-2">
            <FileText className="w-4 h-4" />
            {isRTL ? 'المستندات' : 'Documents'}
          </TabsTrigger>
          <TabsTrigger value="transmittals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground gap-2">
            <Send className="w-4 h-4" />
            {isRTL ? 'المراسلات الداخلية' : 'Transmittals'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="mt-4">
          <DocumentsPage />
        </TabsContent>
        <TabsContent value="transmittals" className="mt-4">
          <div dir={isRTL ? 'rtl' : 'ltr'}>
            <TransmittalSystem lang={language as 'ar' | 'en'} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
