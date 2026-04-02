'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useAI } from '@/lib/ai/ai-context';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot, Send, Sparkles, Lightbulb, 
  FileText, BarChart3, AlertTriangle, 
  Loader2, Minimize2, Maximize2, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AITaskType } from '@/lib/ai/model-config';

interface FloatingAIButtonProps {
  context?: string;
  entityId?: string;
  entityType?: 'project' | 'task' | 'client' | 'invoice' | 'report' | 'contract' | 'budget';
  position?: 'bottom-right' | 'bottom-left';
  onResponse?: (response: string) => void;
}

const QUICK_ACTIONS: Record<string, Array<{ 
  id: string; 
  label: { ar: string; en: string }; 
  icon: React.ComponentType<{ className?: string }>;
  task: AITaskType;
  promptTemplate: string;
}>> = {
  project: [
    { 
      id: 'analyze', 
      label: { ar: 'تحليل المشروع', en: 'Analyze Project' }, 
      icon: BarChart3,
      task: 'data-analysis',
      promptTemplate: 'قم بتحليل هذا المشروع وتقديم رؤى وتوصيات'
    },
    { 
      id: 'risks', 
      label: { ar: 'توقع المخاطر', en: 'Predict Risks' }, 
      icon: AlertTriangle,
      task: 'risk-assessment',
      promptTemplate: 'ما هي المخاطر المحتملة لهذا المشروع وكيف يمكن تجنبها؟'
    },
    { 
      id: 'report', 
      label: { ar: 'توليد تقرير', en: 'Generate Report' }, 
      icon: FileText,
      task: 'report-generation',
      promptTemplate: 'قم بإنشاء تقرير شامل عن هذا المشروع'
    },
  ],
  task: [
    { 
      id: 'priority', 
      label: { ar: 'تحديد الأولوية', en: 'Set Priority' }, 
      icon: Sparkles,
      task: 'task-suggestions',
      promptTemplate: 'ساعدني في تحديد أولوية هذه المهمة'
    },
    { 
      id: 'breakdown', 
      label: { ar: 'تقسيم المهام', en: 'Break Down Tasks' }, 
      icon: Lightbulb,
      task: 'task-suggestions',
      promptTemplate: 'قسّم هذه المهمة إلى مهام فرعية أصغر'
    },
  ],
  client: [
    { 
      id: 'summary', 
      label: { ar: 'ملخص العميل', en: 'Client Summary' }, 
      icon: FileText,
      task: 'summarize',
      promptTemplate: 'قدم ملخصاً شاملاً عن هذا العميل'
    },
    { 
      id: 'recommendations', 
      label: { ar: 'توصيات', en: 'Recommendations' }, 
      icon: Lightbulb,
      task: 'task-suggestions',
      promptTemplate: 'ما هي التوصيات للتعامل مع هذا العميل؟'
    },
  ],
  contract: [
    { 
      id: 'analyze', 
      label: { ar: 'تحليل العقد', en: 'Analyze Contract' }, 
      icon: FileText,
      task: 'contract-analysis',
      promptTemplate: 'قم بتحليل هذا العقد وتحديد البنود الهامة والمخاطر المحتملة'
    },
    { 
      id: 'summary', 
      label: { ar: 'ملخص العقد', en: 'Contract Summary' }, 
      icon: Sparkles,
      task: 'summarize',
      promptTemplate: 'قدم ملخصاً موجزاً لهذا العقد'
    },
  ],
  invoice: [
    { 
      id: 'review', 
      label: { ar: 'مراجعة الفاتورة', en: 'Review Invoice' }, 
      icon: FileText,
      task: 'document-review',
      promptTemplate: 'راجع هذه الفاتورة وتحقق من صحتها'
    },
  ],
  budget: [
    { 
      id: 'forecast', 
      label: { ar: 'توقع الميزانية', en: 'Budget Forecast' }, 
      icon: BarChart3,
      task: 'financial-forecast',
      promptTemplate: 'قدم توقعات مالية لهذه الميزانية'
    },
    { 
      id: 'analysis', 
      label: { ar: 'تحليل الميزانية', en: 'Budget Analysis' }, 
      icon: BarChart3,
      task: 'data-analysis',
      promptTemplate: 'حلل هذه الميزانية وقدم توصيات'
    },
  ],
  report: [
    { 
      id: 'summary', 
      label: { ar: 'ملخص ذكي', en: 'AI Summary' }, 
      icon: Sparkles,
      task: 'summarize',
      promptTemplate: 'قدم ملخصاً ذكياً لهذا التقرير'
    },
    { 
      id: 'insights', 
      label: { ar: 'رؤى وتحليلات', en: 'Insights' }, 
      icon: BarChart3,
      task: 'data-analysis',
      promptTemplate: 'استخرج الرؤى والتحليلات من هذا التقرير'
    },
  ],
  default: [
    { 
      id: 'help', 
      label: { ar: 'مساعدة', en: 'Help' }, 
      icon: Lightbulb,
      task: 'chat',
      promptTemplate: 'كيف يمكنني مساعدتك؟'
    },
    { 
      id: 'suggest', 
      label: { ar: 'اقتراحات', en: 'Suggestions' }, 
      icon: Sparkles,
      task: 'task-suggestions',
      promptTemplate: 'قدم لي اقتراحات مفيدة'
    },
  ],
};

export function FloatingAIButton({ 
  context, 
  entityId: _entityId, 
  entityType = 'project',
  position = 'bottom-right',
  onResponse
}: FloatingAIButtonProps) {
  const router = useRouter();
  const { language } = useApp();
  const { execute, isLoading } = useAI();
  const isRTL = language === 'ar';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const quickActions = QUICK_ACTIONS[entityType] || QUICK_ACTIONS.default;

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;
    
    try {
      const result = await execute({
        task: 'chat',
        prompt,
        context
      });
      
      if (result.success) {
        setResponse(result.content);
        onResponse?.(result.content);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [prompt, context, execute, onResponse]);

  const handleQuickAction = useCallback(async (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (!action) return;

    setPrompt(action.promptTemplate);
    
    try {
      const result = await execute({
        task: action.task,
        prompt: action.promptTemplate,
        context
      });
      
      if (result.success) {
        setResponse(result.content);
        onResponse?.(result.content);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [quickActions, context, execute, onResponse]);

  const handleCopy = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [response]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPrompt('');
    setResponse(null);
  }, []);

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
            "text-foreground transition-all duration-300 hover:scale-110",
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
            "bg-card border-border text-foreground transition-all duration-300",
            isExpanded ? "sm:max-w-[700px]" : "sm:max-w-[450px]"
          )}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-lg">
                    {isRTL ? 'المساعد الذكي' : 'AI Assistant'}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm">
                    {isRTL ? 'اسأل أي سؤال عن بياناتك' : 'Ask anything about your data'}
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground"
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

            {/* Response Area */}
            {response && (
              <div className="relative">
                <ScrollArea className="h-[200px] w-full rounded-lg bg-muted p-4">
                  <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                    {response}
                  </div>
                </ScrollArea>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="absolute top-2 end-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Input Area */}
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isRTL 
                  ? 'اكتب سؤالك هنا...' 
                  : 'Type your question here...'}
                className="min-h-[80px] bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
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
              <div className="text-xs text-muted-foreground text-center">
                {isRTL ? `السياق: ${context}` : `Context: ${context}`}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {isRTL ? 'مدعوم بـ BluePrint AI' : 'Powered by BluePrint AI'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/ai-chat')}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                {isRTL ? 'فتح المحادثة الكاملة' : 'Open Full Chat'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
