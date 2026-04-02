'use client';

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';

const ContractsPage = lazy(() =>
  import('@/components/contracts/contracts-page').then((m) => ({
    default: m.ContractsPage,
  }))
);
const ClientsPage = lazy(() =>
  import('@/components/clients/clients-page').then((m) => ({
    default: m.ClientsPage,
  }))
);
const ProposalsPage = lazy(() =>
  import('@/components/proposals/proposals-page').then((m) => ({
    default: m.ProposalsPage,
  }))
);
const BiddingPage = lazy(() =>
  import('@/components/bidding/bidding-page').then((m) => ({
    default: m.BiddingPage,
  }))
);

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function ContractsTabContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { language } = useApp();
  const { t } = useTranslation(language);

  const validTabs = ['contracts', 'clients', 'proposals', 'bidding'];
  const resolvedTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'contracts';
  const defaultTab = resolvedTab;

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="contracts">{t.contracts}</TabsTrigger>
        <TabsTrigger value="clients">{t.clients}</TabsTrigger>
        <TabsTrigger value="proposals">{t.proposals}</TabsTrigger>
        <TabsTrigger value="bidding">
          {language === 'ar' ? 'المناقصات' : 'Bidding'}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="contracts">
        <Suspense fallback={<LoadingSpinner />}>
          <ContractsPage />
        </Suspense>
      </TabsContent>
      <TabsContent value="clients">
        <Suspense fallback={<LoadingSpinner />}>
          <ClientsPage />
        </Suspense>
      </TabsContent>
      <TabsContent value="proposals">
        <Suspense fallback={<LoadingSpinner />}>
          <ProposalsPage />
        </Suspense>
      </TabsContent>
      <TabsContent value="bidding">
        <Suspense fallback={<LoadingSpinner />}>
          <BiddingPage />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

export default function ContractsRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ContractsTabContent />
    </Suspense>
  );
}
