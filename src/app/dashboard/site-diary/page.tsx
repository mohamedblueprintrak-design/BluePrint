import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/dashboard/site-management?tab=diary');
  return null;
}
