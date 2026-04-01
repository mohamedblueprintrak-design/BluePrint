import { redirect } from 'next/navigation';

export default function HelpRoute() {
  redirect('/dashboard/ai-chat');
  return null;
}
