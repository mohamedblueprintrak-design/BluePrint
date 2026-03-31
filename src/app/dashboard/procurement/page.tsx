'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { SuppliersPage } from '@/components/suppliers/suppliers-page';
import { PurchaseOrdersPage } from '@/components/purchase-orders/purchase-orders-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, ShoppingCart } from 'lucide-react';

export default function ProcurementPage() {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-blue-400" />
          {isRTL ? 'المشتريات والموردون' : 'Procurement & Suppliers'}
        </h1>
        <p className="text-slate-400 mt-1">{isRTL ? 'إدارة الموردين وطلبات الشراء' : 'Manage suppliers and purchase orders'}</p>
      </div>
      <Tabs defaultValue="suppliers" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-slate-800 w-full sm:w-auto">
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <Briefcase className="w-4 h-4" />
            {isRTL ? 'الموردون' : 'Suppliers'}
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <ShoppingCart className="w-4 h-4" />
            {isRTL ? 'طلبات الشراء' : 'Purchase Orders'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="suppliers" className="mt-4">
          <SuppliersPage />
        </TabsContent>
        <TabsContent value="purchase-orders" className="mt-4">
          <PurchaseOrdersPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
