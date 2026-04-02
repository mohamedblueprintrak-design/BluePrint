'use client';

import { useApp } from '@/context/app-context';
import { InvoicesPage } from '@/components/invoices/invoices-page';
import { VouchersPage } from '@/components/vouchers/vouchers-page';
import { BudgetsPage } from '@/components/budgets/budgets-page';
import { BOQPage } from '@/components/boq/boq-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Receipt, Calculator, FileSpreadsheet } from 'lucide-react';

export default function FinancePage() {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-blue-400" />
          {isRTL ? 'المالية' : 'Finance'}
        </h1>
        <p className="text-muted-foreground mt-1">{isRTL ? 'إدارة الفواتير والسندات والميزانيات وجداول الكميات' : 'Manage invoices, vouchers, budgets, and bills of quantities'}</p>
      </div>
      <Tabs defaultValue="invoices" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-muted w-full sm:w-auto">
          <TabsTrigger value="invoices" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground gap-2">
            <DollarSign className="w-4 h-4" />
            {isRTL ? 'الفواتير' : 'Invoices'}
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground gap-2">
            <Receipt className="w-4 h-4" />
            {isRTL ? 'السندات' : 'Vouchers'}
          </TabsTrigger>
          <TabsTrigger value="budgets" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground gap-2">
            <Calculator className="w-4 h-4" />
            {isRTL ? 'الميزانيات' : 'Budgets'}
          </TabsTrigger>
          <TabsTrigger value="boq" className="data-[state=active]:bg-blue-600 data-[state=active]:text-foreground gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            {isRTL ? 'جدول الكميات' : 'BOQ'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <InvoicesPage />
        </TabsContent>
        <TabsContent value="vouchers" className="mt-4">
          <VouchersPage />
        </TabsContent>
        <TabsContent value="budgets" className="mt-4">
          <BudgetsPage />
        </TabsContent>
        <TabsContent value="boq" className="mt-4">
          <BOQPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
