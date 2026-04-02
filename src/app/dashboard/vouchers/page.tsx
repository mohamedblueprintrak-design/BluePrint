import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/dashboard/finance?tab=vouchers');
  return null;
}
