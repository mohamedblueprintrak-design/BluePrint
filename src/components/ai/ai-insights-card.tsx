'use client';

import { useState, useCallback } from 'react';
import { useAI } from '@/lib/ai/ai-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
    TrendingUp,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AITaskType } from '@/lib/ai/model-config';

interface AIInsightsCardProps {
  title?: string;
  context: string;
  taskType?: AITaskType;
  _autoGenerate?: boolean;
  className?: string;
  compact?: boolean;
}

export function AIInsightsCard({
  title = 'رؤى ذكية',
  context,
  taskType = 'data-analysis',
  _autoGenerate = false,
  className,
  compact = false
}: AIInsightsCardProps) {
  const { execute, isLoading } = useAI();
  const [insights, setInsights] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [copied, setCopied] = useState(false);

  const generateInsights = useCallback(async () => {
    if (!context) return;

    const result = await execute({
      task: taskType,
      prompt: compact 
        ? 'قدم 3 نقاط رئيسية موجزة' 
        : 'قدم تحليلاً شاملاً مع رؤى وتوصيات',
      context
    });

    if (result.success) {
      setInsights(result.content);
    }
  }, [context, taskType, execute, compact]);

  const handleCopy = useCallback(() => {
    if (insights) {
      navigator.clipboard.writeText(insights);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [insights]);

  // Auto-generate on mount if enabled
  // Note: We skip this in this implementation to avoid useEffect

  return (
    <Card className={cn(
      "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-white text-sm font-medium">
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {insights && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-7 w-7 text-slate-400 hover:text-white"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
            {compact && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7 text-slate-400 hover:text-white"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={generateInsights}
              disabled={isLoading}
              className="h-7 w-7 text-slate-400 hover:text-white"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2">
          {!insights && !isLoading && (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">
                اضغط على زر التحديث لإنشاء رؤى ذكية
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateInsights}
                className="mt-3 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <Sparkles className="w-4 h-4 me-2" />
                توليد الرؤى
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 text-purple-500 mx-auto mb-2 animate-spin" />
              <p className="text-slate-500 text-sm">
                جاري التحليل...
              </p>
            </div>
          )}

          {insights && !isLoading && (
            <ScrollArea className={cn("w-full", compact ? "h-[150px]" : "h-[250px]")}>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300">
                {insights}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Compact version for inline use
export function AIInsightsBadge({
  context,
  taskType = 'task-suggestions',
  onGenerate
}: {
  context: string;
  taskType?: AITaskType;
  onGenerate?: (insights: string) => void;
}) {
  const { execute, isLoading } = useAI();
  const [hasInsights, setHasInsights] = useState(false);

  const handleGenerate = async () => {
    const result = await execute({
      task: taskType,
      prompt: 'قدم نقطة واحدة موجزة',
      context
    });

    if (result.success) {
      setHasInsights(true);
      onGenerate?.(result.content);
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer transition-colors",
        hasInsights 
          ? "bg-green-500/10 border-green-500/30 text-green-400"
          : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
      )}
      onClick={handleGenerate}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 me-1 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3 me-1" />
      )}
      {hasInsights ? 'تم التحليل' : 'تحليل ذكي'}
    </Badge>
  );
}

// Quick stats with AI
export function AIQuickStats({
  context,
  className
}: {
  context: string;
  className?: string;
}) {
  const { execute, isLoading } = useAI();
  const [stats, setStats] = useState<{
    risk: 'low' | 'medium' | 'high';
    trend: 'up' | 'down' | 'stable';
    score: number;
  } | null>(null);

  const analyzeStats = async () => {
    const result = await execute({
      task: 'risk-assessment',
      prompt: 'قيّم المخاطر بشكل سريع وأعطني: مستوى الخطر (low/medium/high) والتوجه (up/down/stable) ودرجة من 100. أجب بصيغة JSON فقط.',
      context
    });

    if (result.success) {
      try {
        const parsed = JSON.parse(result.content);
        setStats({
          risk: parsed.risk || 'medium',
          trend: parsed.trend || 'stable',
          score: parsed.score || 50
        });
      } catch {
        // Default values
        setStats({ risk: 'medium', trend: 'stable', score: 50 });
      }
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'high': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <TrendingUp className="w-4 h-4 text-slate-400 rotate-90" />;
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={analyzeStats}
        disabled={isLoading}
        className="text-purple-400 hover:bg-purple-500/10"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 me-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 me-2" />
        )}
        تحليل سريع
      </Button>

      {stats && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <AlertTriangle className={cn("w-4 h-4", getRiskColor(stats.risk))} />
            <span className="text-slate-400">الخطر:</span>
            <span className={getRiskColor(stats.risk)}>{stats.risk}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon(stats.trend)}
            <span className="text-slate-400">التوجه:</span>
            <span className="text-white">{stats.trend}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">الدرجة:</span>
            <span className="text-white">{stats.score}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}
