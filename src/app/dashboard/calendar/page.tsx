import { redirect } from 'next/navigation';

export default function CalendarRedirect() {
  redirect('/dashboard/reports?tab=meetings');
  return null;
}
