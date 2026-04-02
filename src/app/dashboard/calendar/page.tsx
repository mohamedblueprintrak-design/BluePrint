import { redirect } from 'next/navigation';

export default function CalendarRoute() {
  redirect('/dashboard/meetings?tab=calendar');
  return null;
}
