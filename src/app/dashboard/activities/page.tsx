import { redirect } from 'next/navigation';

export default function ActivitiesRoute() {
  redirect('/dashboard/admin?tab=activities');
}
