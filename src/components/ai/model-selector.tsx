'use client';

import { useState } from 'react';
import { useAI } from '@/lib/ai/ai-context';
import { getModelInfo, AVAILABLE_MODELS, ModelConfig } from '@/lib/ai/model-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings2, 
    Eye, 
  Code,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  value?: string;
  onValueChange?: (modelId: string) => void;
  showDetails?: boolean;
  compact?: boolean;
  taskType?: string;
}

const PROVIDER_ICONS: Record<string, string> = {
  google: '🔵',
  openai: '🟢',
  anthropic: '🟣',
  deepseek: '🟠',
  mistral: '🔴',
  meta: '🟡',
  xai: '⚫',
};

const COST_TIER_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'مجاني', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  low: { label: 'رخيص', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  medium: { label: 'متوسط', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high: { label: ' premium', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

export function ModelSelector({
  value,
  onValueChange,
  showDetails = false,
  compact = false,
  taskType
}: ModelSelectorProps) {
  const { preferredModel, setPreferredModel } = useAI();
  const [selectedModel, setSelectedModel] = useState(value || preferredModel || 'gemini-2.0-flash');

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setPreferredModel(modelId);
    onValueChange?.(modelId);
  };

  const currentModel = getModelInfo(selectedModel);

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Settings2 className="w-4 h-4 me-2" />
            {currentModel?.name || selectedModel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-slate-900 border-slate-700" align="end">
          <ModelList
            selectedModel={selectedModel}
            onSelect={handleModelChange}
            taskType={taskType}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="اختر النموذج">
            {currentModel && (
              <div className="flex items-center gap-2">
                <span>{PROVIDER_ICONS[currentModel.provider]}</span>
                <span>{currentModel.name}</span>
                {currentModel.capabilities.includes('vision') && (
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[300px]">
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem
              key={model.id}
              value={model.id}
              className="focus:bg-slate-700"
            >
              <div className="flex items-center gap-2">
                <span>{PROVIDER_ICONS[model.provider]}</span>
                <span>{model.name}</span>
                <Badge 
                  variant="outline" 
                  className={cn("text-[10px] px-1.5 py-0", COST_TIER_LABELS[model.costTier].color)}
                >
                  {COST_TIER_LABELS[model.costTier].label}
                </Badge>
                {model.capabilities.includes('vision') && (
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                )}
                {model.capabilities.includes('code') && (
                  <Code className="w-3.5 h-3.5 text-green-400" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showDetails && currentModel && (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-slate-300">{currentModel.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {currentModel.maxTokens.toLocaleString()} tokens
                </Badge>
                {currentModel.capabilities.includes('vision') && (
                  <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                    <Eye className="w-3 h-3 me-1" />
                    Vision
                  </Badge>
                )}
                {currentModel.capabilities.includes('code') && (
                  <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                    <Code className="w-3 h-3 me-1" />
                    Code
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Internal model list component
function ModelList({
  selectedModel,
  onSelect,
  taskType: _taskType
}: {
  selectedModel: string;
  onSelect: (modelId: string) => void;
  taskType?: string;
}) {
  // Group models by provider
  const groupedModels = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelConfig[]>);

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 p-2">
        <div className="text-xs text-slate-500 uppercase tracking-wider px-2">
          اختر النموذج
        </div>

        {Object.entries(groupedModels).map(([provider, models]) => (
          <div key={provider}>
            <div className="text-xs text-slate-400 font-medium px-2 mb-1 capitalize">
              {PROVIDER_ICONS[provider]} {provider}
            </div>
            <div className="space-y-1">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onSelect(model.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left",
                    "hover:bg-slate-800 transition-colors",
                    selectedModel === model.id && "bg-slate-800 ring-1 ring-purple-500/30"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white truncate">{model.name}</span>
                      {selectedModel === model.id && (
                        <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] px-1 py-0", COST_TIER_LABELS[model.costTier].color)}
                      >
                        {COST_TIER_LABELS[model.costTier].label}
                      </Badge>
                      {model.capabilities.includes('vision') && (
                        <Eye className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Quick model switcher for chat
export function QuickModelSwitch() {
  const { preferredModel, setPreferredModel } = useAI();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentModel = getModelInfo(preferredModel || 'gemini-2.0-flash');

  const quickModels = [
    { id: 'gemini-2.0-flash', name: 'Flash', icon: '⚡', color: 'text-yellow-400' },
    { id: 'gpt-4o-mini', name: 'GPT Mini', icon: '🟢', color: 'text-green-400' },
    { id: 'claude-3.5-sonnet', name: 'Claude', icon: '🟣', color: 'text-purple-400' },
    { id: 'deepseek-chat', name: 'DeepSeek', icon: '🟠', color: 'text-orange-400' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/50">
      {quickModels.map((model) => (
        <button
          key={model.id}
          onClick={() => setPreferredModel(model.id)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
            preferredModel === model.id
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-700/50"
          )}
        >
          <span>{model.icon}</span>
          <span>{model.name}</span>
        </button>
      ))}
    </div>
  );
}
