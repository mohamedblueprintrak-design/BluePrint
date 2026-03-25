'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Bot, Send, Sparkles, Lightbulb, 
  FileText, BarChart3, AlertTriangle, 
  Loader2, Minimize2, Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingAIButtonProps {
  context?: string;
  entityId?: string;
  entityType?: 'project' | 'task' | 'client' | 'invoice' | 'report';
  position?: 'bottom-right' | 'bottom-left';
}

const QUICK_ACTIONS = {
  project: [
    { id: 'analyze', label: { ar: 'تحليل المشروع', en: 'Analyze Project' }, icon: BarChart3 },
    { id: 'risks', label: { ar: 'توقع المخاطر', en: 'Predict Risks' }, icon: AlertTriangle },
    { id: 'report', label: { ar: 'توليد تقرير', en: 'Generate Report' }, icon: FileText },
  ],
  task: [
    { id: 'priority', label: { ar: 'تحديد الأولوية', en: 'Set Priority' }, icon: Sparkles },
    { id: 'breakdown', label: { ar: 'تقسيم المهام', en: 'Break Down Tasks' }, icon: Lightbulb },
  ],
  client: [
    { id: 'summary', label: { ar: 'ملخص العميل', en: 'Client Summary' }, icon: FileText },
    { id: 'recommendations', label: { ar: 'توصيات', en: 'Recommendations' }, icon: Lightbulb },
  ],
  invoice: [
    { id: 'review', label: { ar: 'مراجعة الفاتورة', en: 'Review Invoice' }, icon: FileText },
  ],
  report: [
    { id: 'summary', label: { ar: 'ملخص ذكي', en: 'AI Summary' }, icon: Sparkles },
    { id: 'insights', label: { ar: 'رؤى وتحليلات', en: 'Insights' }, icon: BarChart3 },
  ],
  default: [
    { id: 'help', label: { ar: 'مساعدة', en: 'Help' }, icon: Lightbulb },
    { id: 'suggest', label: { ar: 'اقتراحات', en: 'Suggestions' }, icon: Sparkles },
  ],
};

export function FloatingAIButton({ 
  context, 
  entityId, 
  entityType = 'project',
  position = 'bottom-right' 
}: FloatingAIButtonProps) {
  const router = useRouter();
  const { language } = useApp();
  const isRTL = language === 'ar';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = QUICK_ACTIONS[entityType] || QUICK_ACTIONS.default;

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Navigate to AI chat with context
      const queryParams = new URLSearchParams({
        q: prompt,
        context: context || '',
        entityId: entityId || '',
        entityType: entityType,
      });
      
      router.push(`/dashboard/ai-chat?${queryParams}`);
      setIsOpen(false);
      setPrompt('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      setPrompt(action.label[isRTL ? 'ar' : 'en']);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div 
        className={cn(
          "fixed z-50",
          position === 'bottom-right' 
            ? "bottom-6 end-6" 
            : "bottom-6 start-6"
        )}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg shadow-purple-500/20",
            "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
            "text-white transition-all duration-300 hover:scale-110",
            isOpen && "scale-0 opacity-0"
          )}
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>

      {/* AI Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className={cn(
            "bg-slate-900 border-slate-800 text-white transition-all duration-300",
            isExpanded ? "sm:max-w-[600px]" : "sm:max-w-[400px]"
          )}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg">
                    {isRTL ? 'المساعد الذكي' : 'AI Assistant'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-sm">
                    {isRTL ? 'اسأل أي سؤال عن بياناتك' : 'Ask anything about your data'}
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-400 hover:text-white"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Badge
                  key={action.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-500/20 hover:border-purple-500 transition-colors px-3 py-1.5"
                  onClick={() => handleQuickAction(action.id)}
                >
                  <action.icon className="w-3.5 h-3.5 me-1.5" />
                  {action.label[isRTL ? 'ar' : 'en']}
                </Badge>
              ))}
            </div>

            {/* Input Area */}
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isRTL 
                  ? 'اكتب سؤالك هنا...' 
                  : 'Type your question here...'}
                className="min-h-[100px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none pr-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!prompt.trim() || isLoading}
                className="absolute bottom-2 end-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Context Info */}
            {context && (
              <div className="text-xs text-slate-500 text-center">
                {isRTL ? `السياق: ${context}` : `Context: ${context}`}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              {isRTL ? 'مدعوم بـ BluePrint AI' : 'Powered by BluePrint AI'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/ai-chat')}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              {isRTL ? 'فتح المحادثة الكاملة' : 'Open Full Chat'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
