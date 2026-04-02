import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/dashboard/site-management?tab=visits');
  return null;
}
