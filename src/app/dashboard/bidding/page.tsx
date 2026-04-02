import { redirect } from 'next/navigation';

export default function BiddingRedirect() {
  redirect('/dashboard/contracts?tab=bidding');
  return null;
}
