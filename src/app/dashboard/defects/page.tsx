import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/dashboard/site-management?tab=defects');
  return null;
}
