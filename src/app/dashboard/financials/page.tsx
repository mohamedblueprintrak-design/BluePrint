'use client';

import { useApp } from '@/context/app-context';
import { BudgetsPage } from '@/components/budgets/budgets-page';
import { BOQPage } from '@/components/boq/boq-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileSpreadsheet } from 'lucide-react';

export default function FinancialsPage() {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Calculator className="w-7 h-7 text-blue-400" />
          {isRTL ? 'الميزانيات وجداول الكميات' : 'Budgets & BOQ'}
        </h1>
        <p className="text-slate-400 mt-1">{isRTL ? 'إدارة الميزانيات وجداول الكميات' : 'Manage budgets and bills of quantities'}</p>
      </div>
      <Tabs defaultValue="budgets" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-slate-800 w-full sm:w-auto">
          <TabsTrigger value="budgets" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <Calculator className="w-4 h-4" />
            {isRTL ? 'الميزانيات' : 'Budgets'}
          </TabsTrigger>
          <TabsTrigger value="boq" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            {isRTL ? 'جدول الكميات' : 'BOQ'}
          </TabsTrigger>
        </TabsList>
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
