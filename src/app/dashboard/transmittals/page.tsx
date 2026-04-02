import { redirect } from 'next/navigation';

export default function TransmittalsRedirect() {
  redirect('/dashboard/documents?tab=transmittals');
  return null;
}
