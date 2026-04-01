'use client';

import { useApp } from '@/context/app-context';
import { AIChatPage } from '@/components/ai-chat/ai-chat-page';
import { KnowledgePage } from '@/components/knowledge/knowledge-page';
import HelpPage from '@/components/help/help-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, BookOpen, HelpCircle } from 'lucide-react';

export default function AIChatRoute() {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot className="w-7 h-7 text-violet-400" />
          {isAr ? 'المعرفة والذكاء الاصطناعي' : 'Knowledge & AI'}
        </h1>
        <p className="text-slate-400 mt-1">
          {isAr ? 'المساعد الذكي، قاعدة المعرفة، ومركز المساعدة' : 'AI assistant, knowledge base, and help center'}
        </p>
      </div>

      <Tabs defaultValue="ai-chat" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="ai-chat" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Bot className="w-4 h-4 me-2" />
            {isAr ? 'المساعد الذكي' : 'AI Chat'}
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <BookOpen className="w-4 h-4 me-2" />
            {isAr ? 'قاعدة المعرفة' : 'Knowledge Base'}
          </TabsTrigger>
          <TabsTrigger value="help" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <HelpCircle className="w-4 h-4 me-2" />
            {isAr ? 'مركز المساعدة' : 'Help Center'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-chat">
          <AIChatPage />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgePage />
        </TabsContent>

        <TabsContent value="help">
          <HelpPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
