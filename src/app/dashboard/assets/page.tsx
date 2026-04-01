'use client';

import { useApp } from '@/context/app-context';
import { InventoryPage } from '@/components/inventory/inventory-page';
import EquipmentPage from '@/components/equipment/equipment-page';
import { SuppliersPage } from '@/components/suppliers/suppliers-page';
import { PurchaseOrdersPage } from '@/components/purchase-orders/purchase-orders-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Wrench, Briefcase, ShoppingCart } from 'lucide-react';

export default function AssetsPage() {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Package className="w-7 h-7 text-blue-400" />
          {isRTL ? 'الأصول والمشتريات' : 'Assets & Procurement'}
        </h1>
        <p className="text-slate-400 mt-1">{isRTL ? 'إدارة المخزون والمعدات والموردين وطلبات الشراء' : 'Manage inventory, equipment, suppliers and purchase orders'}</p>
      </div>
      <Tabs defaultValue="inventory" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-slate-800 w-full sm:w-auto">
          <TabsTrigger value="inventory" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <Package className="w-4 h-4" />
            {isRTL ? 'المخزون' : 'Inventory'}
          </TabsTrigger>
          <TabsTrigger value="equipment" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <Wrench className="w-4 h-4" />
            {isRTL ? 'المعدات' : 'Equipment'}
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <Briefcase className="w-4 h-4" />
            {isRTL ? 'الموردون' : 'Suppliers'}
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
            <ShoppingCart className="w-4 h-4" />
            {isRTL ? 'طلبات الشراء' : 'Purchase Orders'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inventory" className="mt-4">
          <InventoryPage />
        </TabsContent>
        <TabsContent value="equipment" className="mt-4">
          <EquipmentPage />
        </TabsContent>
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
