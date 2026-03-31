'use client';

import { useApp } from '@/context/app-context';
import { InvoicesPage } from '@/components/invoices/invoices-page';
import { VouchersPage } from '@/components/vouchers/vouchers-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Receipt } from 'lucide-react';

export default function FinancePage() {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-blue-400" />
          {isRTL ? 'المالية والفواتير' : 'Finance & Invoices'}
        </h1>
        <p className="text-slate-400 mt-1">{isRTL ? 'إدارة الفواتير والسندات المالية' : 'Manage invoices and financial vouchers'}</p>
      </div>
      <Tabs defaultValue="invoices" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-slate-800 w-full sm:w-auto">
          <TabsTrigger value="invoices" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <DollarSign className="w-4 h-4" />
            {isRTL ? 'الفواتير' : 'Invoices'}
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <Receipt className="w-4 h-4" />
            {isRTL ? 'السندات' : 'Vouchers'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <InvoicesPage />
        </TabsContent>
        <TabsContent value="vouchers" className="mt-4">
          <VouchersPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
