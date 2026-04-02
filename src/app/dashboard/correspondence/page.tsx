import { redirect } from 'next/navigation';

export default function CorrespondenceRedirect() {
  redirect('/dashboard/reports?tab=meetings');
  return null;
}
