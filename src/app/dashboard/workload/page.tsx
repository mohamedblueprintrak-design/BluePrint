import { redirect } from 'next/navigation';

export default function WorkloadRoute() {
  redirect('/dashboard/hr?tab=workload');
  return null;
}
