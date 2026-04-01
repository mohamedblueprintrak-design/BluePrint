import { redirect } from 'next/navigation';

export default function KnowledgeRoute() {
  redirect('/dashboard/ai-chat');
  return null;
}
