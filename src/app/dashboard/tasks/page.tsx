import { redirect } from 'next/navigation';

export default function TasksRoute() {
  redirect('/dashboard/projects?tab=tasks');
}
