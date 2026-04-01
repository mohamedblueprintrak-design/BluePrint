'use client';

/**
 * AI Context Provider
 * مزود سياق الذكاء الاصطناعي
 * 
 * يوفر وظائف AI لجميع مكونات التطبيق
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { aiRouter, AIRequest, AIResponse } from './ai-router';
import { AITaskType, getModelInfo, ModelConfig, AVAILABLE_MODELS } from './model-config';

// حالة الـ AI
interface AIState {
  isLoading: boolean;
  lastResponse: AIResponse | null;
  error: string | null;
  preferredModel: string | null;
}

// سياق الـ AI
interface AIContextType extends AIState {
  // الوظائف الأساسية
  execute: (request: AIRequest) => Promise<AIResponse>;
  quickChat: (prompt: string, context?: string) => Promise<AIResponse>;
  
  // وظائف متخصصة
  analyzeImage: (image: string, prompt: string) => Promise<AIResponse>;
  analyzeContract: (document: string) => Promise<AIResponse>;
  summarize: (text: string) => Promise<AIResponse>;
  translate: (text: string, targetLang?: 'ar' | 'en') => Promise<AIResponse>;
  
  // إدارة النماذج
  setPreferredModel: (modelId: string) => void;
  getAvailableModels: () => ModelConfig[];
  getBestModelForTask: (task: AITaskType, hasImage?: boolean) => string;
  
  // حالة التحميل
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

// مفتاح التخزين المحلي
const PREFERRED_MODEL_KEY = 'bp_preferred_model';

export function AIProvider({ children }: { children: ReactNode }) {
  // الحالة
  const [state, setState] = useState<AIState>({
    isLoading: false,
    lastResponse: null,
    error: null,
    preferredModel: null
  });

  // Refs للتعامل مع الحالة بدون إعادة render
  const tokenRef = useRef<string | null>(null);

  // تحميل النموذج المفضل من التخزين المحلي
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PREFERRED_MODEL_KEY);
      if (saved) {
        setState(prev => ({ ...prev, preferredModel: saved }));
      }
    }
  }, []);

  // تعيين التوكن
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('bp_token');
      tokenRef.current = token;
      if (token) {
        aiRouter.setToken(token);
      }
    }
  }, []);

  // تنفيذ طلب AI
  const execute = useCallback(async (request: AIRequest): Promise<AIResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // إضافة النموذج المفضل لو موجود
      if (!request.modelOverride && state.preferredModel) {
        request.modelOverride = state.preferredModel;
      }

      const response = await aiRouter.execute(request);

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastResponse: response,
        error: response.success ? null : (response.error ?? null)
      }));

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));

      return {
        success: false,
        content: '',
        model: request.modelOverride || '',
        error: message
      };
    }
  }, [state.preferredModel]);

  // محادثة سريعة
  const quickChat = useCallback(async (prompt: string, context?: string): Promise<AIResponse> => {
    return execute({ task: 'chat', prompt, context });
  }, [execute]);

  // تحليل صورة
  const analyzeImage = useCallback(async (image: string, prompt: string): Promise<AIResponse> => {
    return execute({ task: 'image-analysis', image, prompt });
  }, [execute]);

  // تحليل عقد
  const analyzeContract = useCallback(async (document: string): Promise<AIResponse> => {
    return execute({ task: 'contract-analysis', document, prompt: 'قم بتحليل هذا العقد' });
  }, [execute]);

  // تلخيص
  const summarize = useCallback(async (text: string): Promise<AIResponse> => {
    return execute({ task: 'summarize', prompt: text });
  }, [execute]);

  // ترجمة
  const translate = useCallback(async (text: string, targetLang: 'ar' | 'en' = 'ar'): Promise<AIResponse> => {
    return execute({
      task: 'translate',
      prompt: targetLang === 'ar' ? `ترجم إلى العربية:\n\n${text}` : `Translate to English:\n\n${text}`
    });
  }, [execute]);

  // تعيين النموذج المفضل
  const setPreferredModel = useCallback((modelId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREFERRED_MODEL_KEY, modelId);
    }
    setState(prev => ({ ...prev, preferredModel: modelId }));
  }, []);

  // الحصول على النماذج المتاحة
  const getAvailableModels = useCallback(() => {
    return AVAILABLE_MODELS;
  }, []);

  // الحصول على أفضل نموذج لمهمة
  const getBestModelForTask = useCallback((task: AITaskType, hasImage: boolean = false): string => {
    // لو فيه نموذج مفضل ويدعم المهمة
    if (state.preferredModel) {
      const modelInfo = getModelInfo(state.preferredModel);
      if (modelInfo && modelInfo.bestFor.includes(task)) {
        if (hasImage && !modelInfo.capabilities.includes('vision')) {
          // النموذج المفضل لا يدعم الصور
        } else {
          return state.preferredModel;
        }
      }
    }
    
    // اختيار النموذج الأفضل
    return getBestModelForTask(task, hasImage);
  }, [state.preferredModel]);

  // تعيين حالة التحميل
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // مسح الخطأ
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <AIContext.Provider
      value={{
        ...state,
        execute,
        quickChat,
        analyzeImage,
        analyzeContract,
        summarize,
        translate,
        setPreferredModel,
        getAvailableModels,
        getBestModelForTask,
        setLoading,
        clearError
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

// Hook لاستخدام الـ AI Context
export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

// Hook مبسط للمحادثة
export function useAIChat() {
  const { quickChat, isLoading, error, clearError } = useAI();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const sendMessage = useCallback(async (prompt: string) => {
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    const response = await quickChat(prompt);
    
    if (response.success) {
      setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
    }
    
    return response;
  }, [quickChat]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearError,
    clearMessages
  };
}

// Hook لتحليل الصور
export function useImageAnalysis() {
  const { analyzeImage, isLoading, error } = useAI();
  const [lastResult, setLastResult] = useState<string | null>(null);

  const analyze = useCallback(async (image: string, prompt: string = 'قم بتحليل هذه الصورة بالتفصيل') => {
    const response = await analyzeImage(image, prompt);
    if (response.success) {
      setLastResult(response.content);
    }
    return response;
  }, [analyzeImage]);

  return {
    analyze,
    isLoading,
    error,
    lastResult
  };
}

export default AIContext;
