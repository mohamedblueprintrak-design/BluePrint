import { redirect } from 'next/navigation';

export default function WorkloadRoute() {
  redirect('/dashboard/hr');
  return null;
}
