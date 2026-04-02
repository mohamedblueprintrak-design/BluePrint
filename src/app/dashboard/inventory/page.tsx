import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/dashboard/assets?tab=inventory');
  return null;
}
