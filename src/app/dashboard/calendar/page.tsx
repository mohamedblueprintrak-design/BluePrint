import { redirect } from 'next/navigation';

export default function CalendarRoute() {
  redirect('/dashboard/meetings');
  return null;
}
