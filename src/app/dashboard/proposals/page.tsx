import { redirect } from 'next/navigation';

export default function ProposalsRedirect() {
  redirect('/dashboard/contracts?tab=proposals');
  return null;
}
