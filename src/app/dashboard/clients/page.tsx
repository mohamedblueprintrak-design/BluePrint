import { redirect } from 'next/navigation';

export default function ClientsRedirect() {
  redirect('/dashboard/contracts?tab=clients');
  return null;
}
