import { redirect } from 'next/navigation';

export default function TeamRoute() {
  redirect('/dashboard/hr?tab=team');
  return null;
}
