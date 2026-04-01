import { redirect } from 'next/navigation';

export default function TeamRoute() {
  redirect('/dashboard/hr');
  return null;
}
