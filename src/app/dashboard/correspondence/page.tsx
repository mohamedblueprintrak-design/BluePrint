import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/dashboard/meetings?tab=correspondence');
  return null;
}
