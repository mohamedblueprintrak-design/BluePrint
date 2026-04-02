import { redirect } from 'next/navigation';

export const metadata = {
  title: 'الأتمتة | BluePrint',
  description: 'أتمتة المهام والعمليات المتكررة',
};

export default function Automations() {
  redirect('/dashboard/settings?tab=automations');
}
