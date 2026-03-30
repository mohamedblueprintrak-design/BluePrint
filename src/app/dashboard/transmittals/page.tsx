'use client';

import { useApp } from '@/context/app-context';
import { TransmittalSystem } from '@/components/transmittal/transmittal-system';

export default function TransmittalsPage() {
  const { language } = useApp();

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <TransmittalSystem lang={language as 'ar' | 'en'} />
    </div>
  );
}
