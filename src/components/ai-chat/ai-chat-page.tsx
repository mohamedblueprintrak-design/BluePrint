'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import DOMPurify from 'dompurify';
import { useAIChat } from '@/hooks/api';
import { AVAILABLE_MODELS } from '@/lib/ai/model-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  Plus,
  Search,
  Sparkles,
  Code,
  FileText,
  Calculator,
  Building2,
  DollarSign,
  BookOpen,
  MoreVertical,
  Clock,
  Zap,
  MessageSquare,
  RefreshCw,
  Settings,
  PanelLeft,
  X,
  Image as ImageIcon,
  Languages,
  FileSearch,
  Brain,
  Globe,
  Wand2,
  ClipboardCheck,
  MessageSquareReply,
  Timer,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// AI Skills Configuration - FREE SKILLS
const AI_SKILLS = [
  { 
    id: 'web_search', 
    nameAr: 'بحث الإنترنت', 
    nameEn: 'Web Search',
    icon: Globe, 
    color: 'text-blue-400',
    descriptionAr: 'البحث في الإنترنت للحصول على معلومات محدثة',
    descriptionEn: 'Search the web for up-to-date information'
  },
  { 
    id: 'generate_image', 
    nameAr: 'توليد الصور', 
    nameEn: 'Image Generation',
    icon: ImageIcon, 
    color: 'text-purple-400',
    descriptionAr: 'إنشاء صور بالذكاء الاصطناعي',
    descriptionEn: 'Create AI-generated images'
  },
  { 
    id: 'translate', 
    nameAr: 'الترجمة', 
    nameEn: 'Translation',
    icon: Languages, 
    color: 'text-green-400',
    descriptionAr: 'ترجمة النصوص بين العربية والإنجليزية',
    descriptionEn: 'Translate text between Arabic and English'
  },
  { 
    id: 'explain_code', 
    nameAr: 'شرح الكود', 
    nameEn: 'Code Explanation',
    icon: Code, 
    color: 'text-cyan-400',
    descriptionAr: 'شرح وتبسيط أكواد البرمجة',
    descriptionEn: 'Explain and simplify programming code'
  },
  { 
    id: 'summarize', 
    nameAr: 'تلخيص النصوص', 
    nameEn: 'Summarization',
    icon: FileSearch, 
    color: 'text-orange-400',
    descriptionAr: 'تلخيص النصوص الطويلة بشكل مختصر',
    descriptionEn: 'Summarize long texts concisely'
  },
  { 
    id: 'sentiment', 
    nameAr: 'تحليل المشاعر', 
    nameEn: 'Sentiment Analysis',
    icon: Brain, 
    color: 'text-pink-400',
    descriptionAr: 'تحليل المشاعر والعواطف في النصوص',
    descriptionEn: 'Analyze emotions and sentiments in text'
  },
];

// Provider color mapping
const PROVIDER_COLORS: Record<string, string> = {
  google: 'bg-blue-500',
  openai: 'bg-green-500',
  anthropic: 'bg-orange-500',
  deepseek: 'bg-cyan-500',
  mistral: 'bg-purple-500',
  meta: 'bg-violet-500',
  xai: 'bg-red-500',
};

const COST_TIER_LABELS: Record<string, string> = {
  free: 'Free',
  low: 'Low Cost',
  medium: 'Standard',
  high: 'Premium',
};

// Quick Prompts - General
const QUICK_PROMPTS = [
  { id: 'calc', labelAr: 'حسابات هندسية', labelEn: 'Engineering Calculations', icon: Calculator, color: 'text-blue-400' },
  { id: 'uae', labelAr: 'أكواد الإمارات', labelEn: 'UAE Building Codes', icon: BookOpen, color: 'text-green-400' },
  { id: 'price', labelAr: 'استعلام الأسعار', labelEn: 'Price Inquiry', icon: DollarSign, color: 'text-yellow-400' },
  { id: 'design', labelAr: 'تصميم إنشائي', labelEn: 'Structural Design', icon: Building2, color: 'text-purple-400' },
];

// Engineering Quick Prompts (Task 3)
const ENGINEERING_QUICK_PROMPTS = [
  { 
    id: 'municipality_notes', 
    labelAr: 'تحليل ملاحظات البلدية', 
    labelEn: 'Analyze Municipality Notes', 
    icon: ClipboardCheck, 
    color: 'text-cyan-400' 
  },
  { 
    id: 'contractor_response', 
    labelAr: 'اقتراح رد على المقاول', 
    labelEn: 'Suggest Contractor Response', 
    icon: MessageSquareReply, 
    color: 'text-teal-400' 
  },
  { 
    id: 'sla_review', 
    labelAr: 'مراجعة SLA', 
    labelEn: 'Review SLA Status', 
    icon: Timer, 
    color: 'text-orange-400' 
  },
  { 
    id: 'progress_report', 
    labelAr: 'تقرير تقدم المشروع', 
    labelEn: 'Project Progress Report', 
    icon: TrendingUp, 
    color: 'text-emerald-400' 
  },
  { 
    id: 'boq_analysis', 
    labelAr: 'تحليل تكاليف BOQ', 
    labelEn: 'BOQ Cost Analysis', 
    icon: BarChart3, 
    color: 'text-rose-400' 
  },
];

// Chat Message Type
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
  isLoading?: boolean;
  skill?: string;
  imageData?: string;
  searchResults?: any[];
}

// Chat History Type
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- localStorage persistence helpers ---
const STORAGE_KEYS = {
  sessions: 'bp_ai_chat_sessions',
  currentSession: 'bp_ai_chat_current_session',
} as const;

// Serialized shapes for JSON (Date → ISO string, no isLoading)
interface SerializedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  tokens?: number;
  skill?: string;
  imageData?: string;
  searchResults?: any[];
}

interface SerializedSession {
  id: string;
  title: string;
  messages: SerializedMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

/** Strip isLoading and convert Date → ISO string for a single message */
function serializeMessage(msg: ChatMessage): SerializedMessage {
  const { isLoading: _isLoading, ...rest } = msg;
  void _isLoading;
  return {
    ...rest,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date().toISOString(),
  } as SerializedMessage;
}

/** Restore a SerializedMessage back to a ChatMessage (ISO → Date) */
function deserializeMessage(raw: SerializedMessage): ChatMessage {
  return {
    ...raw,
    timestamp: new Date(raw.timestamp),
  };
}

function serializeSession(session: ChatSession): SerializedSession {
  return {
    ...session,
    messages: session.messages.map(serializeMessage),
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : new Date().toISOString(),
  };
}

function deserializeSession(raw: SerializedSession): ChatSession {
  return {
    ...raw,
    messages: raw.messages.map(deserializeMessage),
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

/** Safe JSON parse with corrupted-data fallback */
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Safe write to localStorage, gracefully handles QuotaExceeded errors */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    // localStorage full or unavailable — silently ignore
    console.warn(`[BP Chat] Failed to write localStorage key "${key}":`, err);
  }
}

/** Read from localStorage, returns null on error */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Code Block Component with Syntax Highlighting
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative my-3 rounded-lg bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-foreground/80 font-mono whitespace-pre-wrap">{code}</code>
      </pre>
    </div>
  );
}

// Markdown-like Content Renderer with XSS Protection
function MessageContent({ content, imageData }: { content: string; imageData?: string }) {
  // SECURITY: Sanitize HTML to prevent XSS attacks using DOMPurify
  const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'br', 'span', 'p', 'pre', 'div'],
      ALLOWED_ATTR: ['class'],
    });
  };

  const renderContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    const remaining = text;
    let keyIndex = 0;
    
    // Check for base64 image data
    if (imageData) {
      parts.push(
        <div key={keyIndex++} className="my-3 rounded-lg overflow-hidden border border-border">
          <img 
            src={`data:image/png;base64,${imageData}`} 
            alt="AI Generated" 
            className="max-w-full h-auto"
          />
        </div>
      );
    }
    
    // Check for markdown image syntax with base64
    const base64ImageRegex = /!\[([^\]]*)\]\(data:image\/[^)]+\)/g;
    const base64Match = base64ImageRegex.exec(remaining);
    if (base64Match && !imageData) {
      parts.push(
        <div key={keyIndex++} className="my-3 rounded-lg overflow-hidden border border-border">
          <img 
            src={base64Match[0].match(/data:image\/[^)]+/)?.[0] || ''} 
            alt="AI Generated" 
            className="max-w-full h-auto"
          />
        </div>
      );
    }
    
    // Process code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(remaining)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={keyIndex++}>
            {renderInlineContent(remaining.slice(lastIndex, match.index))}
          </span>
        );
      }
      
      // Add code block
      parts.push(
        <CodeBlock key={keyIndex++} code={match[2]} language={match[1]} />
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < remaining.length) {
      parts.push(
        <span key={keyIndex++}>
          {renderInlineContent(remaining.slice(lastIndex))}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  const renderInlineContent = (text: string) => {
    // Bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-muted rounded text-cyan-400 font-mono text-sm">$1</code>');
    // Line breaks
    text = text.replace(/\n/g, '<br/>');
    
    // SECURITY: Sanitize before rendering
    const sanitizedText = sanitizeHtml(text);
    
    return <span dangerouslySetInnerHTML={{ __html: sanitizedText }} />;
  };
  
  return <div className="whitespace-pre-wrap">{renderContent(content)}</div>;
}

// Typing Indicator
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// Main AI Chat Page Component
export function AIChatPage() {
  const { language, isRTL, currentPage } = useApp();
  const pathname = usePathname();
  const { } = useAuth(); // Auth context available for future use
  const { t, formatDateTime } = useTranslation(language);
  const aiChatMutation = useAIChat();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [pendingContextType, setPendingContextType] = useState<'project' | 'mun' | 'financial' | 'overdue' | undefined>(undefined);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadedRef = useRef(false);
  
  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // --- localStorage persistence ---

  // Debounced helper: clear any pending timer, then set a new one
  const debouncedSave = useCallback((fn: () => void, delay = 300) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(fn, delay);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const rawSessions = safeGetItem(STORAGE_KEYS.sessions);
    const rawCurrentSession = safeGetItem(STORAGE_KEYS.currentSession);

    const loadedSessions: ChatSession[] = safeJsonParse<SerializedSession[]>(rawSessions, []);
    // Validate structure — filter out any corrupted entries
    const validSessions = loadedSessions
      .filter((s) => s && typeof s.id === 'string' && typeof s.title === 'string' && Array.isArray(s.messages))
      .map(deserializeSession);

    const loadedCurrentId = safeJsonParse<string | null>(rawCurrentSession, null);
    // Only restore currentSessionId if the session actually exists
    const validCurrentId = validSessions.some((s) => s.id === loadedCurrentId) ? loadedCurrentId : null;

    setChatSessions(validSessions);
    setCurrentSessionId(validCurrentId);

    // If there is an active session, restore its messages
    if (validCurrentId) {
      const activeSession = validSessions.find((s) => s.id === validCurrentId);
      if (activeSession) {
        setMessages(activeSession.messages);
      }
    }

    isLoadedRef.current = true;
  }, []);

  // Debounced save: persist chatSessions + currentSessionId whenever they change (after mount)
  useEffect(() => {
    if (!isLoadedRef.current) return;
    debouncedSave(() => {
      const serialized = chatSessions.map(serializeSession);
      safeSetItem(STORAGE_KEYS.sessions, JSON.stringify(serialized));
      safeSetItem(STORAGE_KEYS.currentSession, JSON.stringify(currentSessionId));
    });
  }, [chatSessions, currentSessionId, debouncedSave]);

  // Debounced save: update current session's messages in the sessions list
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (!currentSessionId) return;
    // Only persist messages that are not loading
    const persistableMessages = messages.filter((m) => !m.isLoading);
    if (persistableMessages.length === 0 && messages.length > 0) return; // still loading
    debouncedSave(() => {
      setChatSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === currentSessionId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          messages: persistableMessages,
          updatedAt: new Date(),
        };
        // The setChatSessions effect above will persist to localStorage
        return updated;
      });
    });
  }, [messages, currentSessionId, debouncedSave]);
  
  // Get current model info
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];
  
  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }]);
    
    try {
      // If a skill is active, use it
      if (activeSkill) {
        const result = await aiChatMutation.mutateAsync({
          message: userMessage.content,
          model: selectedModel,
          skill: activeSkill,
          skillParams: getSkillParams(activeSkill, userMessage.content)
        });
        
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: formatSkillResponse(result, activeSkill),
          timestamp: new Date(),
          model: selectedModel,
          skill: activeSkill,
          imageData: result.data?.image,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setActiveSkill(null);
      } else {
        // Regular chat — include page context and optional context type
        const pageContextStr = pathname || currentPage || 'ai-chat';
        const contextToSend = pendingContextType;
        // Clear pending context type after capturing it
        setPendingContextType(undefined);

        const result = await aiChatMutation.mutateAsync({
          message: userMessage.content,
          model: selectedModel,
          pageContext: pageContextStr,
          contextType: contextToSend,
        });
        
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: result.data?.response || language === 'ar' 
            ? 'عذراً، لم أتمكن من معالجة طلبك.' 
            : 'Sorry, I could not process your request.',
          timestamp: new Date(),
          model: selectedModel,
          tokens: result.data?.tokens,
          imageData: result.data?.generatedImage ? result.data?.image : undefined,
          searchResults: result.data?.webSearchResults,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: language === 'ar' 
          ? 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.' 
          : 'An error occurred while processing your request. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Get skill parameters based on skill type
  const getSkillParams = (skillId: string, input: string) => {
    switch (skillId) {
      case 'web_search':
        return { query: input, num: 5 };
      case 'generate_image':
        return { prompt: input, size: '1024x1024' };
      case 'translate':
        return { text: input, targetLang: language === 'ar' ? 'en' : 'ar' };
      case 'explain_code':
        return { code: input, language: language };
      case 'summarize':
        return { text: input, language: language };
      case 'sentiment':
        return { text: input };
      default:
        return { input };
    }
  };
  
  // Format skill response
  const formatSkillResponse = (result: any, skillId: string): string => {
    const data = result.data;
    switch (skillId) {
      case 'web_search':
        if (data?.results?.length > 0) {
          let response = language === 'ar' ? '🔍 نتائج البحث:\n\n' : '🔍 Search Results:\n\n';
          data.results.forEach((r: any, i: number) => {
            response += `**${i + 1}. ${r.name}**\n${r.snippet}\n🔗 ${r.url}\n\n`;
          });
          return response;
        }
        return language === 'ar' ? 'لم يتم العثور على نتائج.' : 'No results found.';
      
      case 'generate_image':
        return language === 'ar' ? '🖼️ تم توليد الصورة بنجاح!' : '🖼️ Image generated successfully!';
      
      case 'translate':
        return `**${language === 'ar' ? 'الترجمة' : 'Translation'}:**\n\n${data?.translation || ''}`;
      
      case 'explain_code':
        return `**${language === 'ar' ? 'شرح الكود' : 'Code Explanation'}:**\n\n${data?.explanation || ''}`;
      
      case 'summarize':
        return `**${language === 'ar' ? 'الملخص' : 'Summary'}:**\n\n${data?.summary || ''}`;
      
      case 'sentiment':
        const sentimentEmoji = data?.sentiment === 'positive' ? '😊' : data?.sentiment === 'negative' ? '😢' : '😐';
        return `**${language === 'ar' ? 'تحليل المشاعر' : 'Sentiment Analysis'}:** ${sentimentEmoji}\n\n` +
               `**${language === 'ar' ? 'المشاعر' : 'Sentiment'}:** ${data?.sentiment}\n` +
               `**${language === 'ar' ? 'الثقة' : 'Confidence'}:** ${Math.round((data?.confidence || 0) * 100)}%\n` +
               `**${language === 'ar' ? 'التفاصيل' : 'Details'}:** ${data?.details}`;
      
      default:
        return data?.response || '';
    }
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Handle copy message
  const handleCopyMessage = async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };
  
  // Handle clear chat
  const handleClearChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setActiveSkill(null);
    setPendingContextType(undefined);
    // Immediate persist: clear current session selection
    safeSetItem(STORAGE_KEYS.currentSession, JSON.stringify(null));
  };
  
  // Handle new chat
  const handleNewChat = () => {
    // Save current messages to existing session if one is active
    if (currentSessionId && messages.length > 0) {
      const persistableMessages = messages.filter((m) => !m.isLoading);
      setChatSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === currentSessionId);
        if (idx !== -1 && persistableMessages.length > 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], messages: persistableMessages, updatedAt: new Date() };
          return updated;
        }
        return prev;
      });
    }

    // Create a new session from current messages (if any)
    const persistableMessages = messages.filter((m) => !m.isLoading);
    if (persistableMessages.length > 0) {
      const session: ChatSession = {
        id: Date.now().toString(),
        title: persistableMessages[0].content.slice(0, 30) + (persistableMessages[0].content.length > 30 ? '...' : ''),
        messages: persistableMessages,
        model: selectedModel,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChatSessions(prev => [session, ...prev]);
    }
    setMessages([]);
    setCurrentSessionId(null);
    setActiveSkill(null);
  };
  
  // Handle quick prompt
  const handleQuickPrompt = (promptId: string) => {
    const prompts: Record<string, string> = {
      calc: language === 'ar' 
        ? 'أحتاج إلى إجراء حسابات هندسية لمشروعي. هل يمكنك مساعدتي؟' 
        : 'I need to perform engineering calculations for my project. Can you help me?',
      uae: language === 'ar' 
        ? 'ما هي متطلبات أكواد البناء الإماراتية التي يجب أن أراعيها؟' 
        : 'What are the UAE building code requirements I should consider?',
      price: language === 'ar' 
        ? 'أريد استعلام عن أسعار مواد البناء الحالية في السوق الإماراتي.' 
        : 'I want to inquire about current construction material prices in the UAE market.',
      design: language === 'ar' 
        ? 'أحتاج مساعدة في التصميم الإنشائي لمشروعي. ما هي العوامل الرئيسية؟' 
        : 'I need help with structural design for my project. What are the main factors?',
      // Engineering-specific prompts (Task 3)
      municipality_notes: language === 'ar'
        ? 'قم بتحليل ملاحظات البلدية التالية واقترح إجراءات تصحيحية مناسبة وفقاً لأكواد البناء الإماراتية. قم بترتيب الملاحظات حسب الأولوية واقترح جدول زمني للمعالجة.'
        : 'Analyze the following municipality notes and suggest appropriate corrective actions according to UAE building codes. Prioritize the notes and suggest a resolution timeline.',
      contractor_response: language === 'ar'
        ? 'اقترح رد مهني ومفصل على طلب المقاول المتعلق بالتغييرات في المخططات. يجب أن يكون الرد متوازناً بين متطلبات المشروع ومطالب المقاول مع مراعاة العقد.'
        : 'Suggest a professional and detailed response to the contractor\'s request regarding drawing changes. The response should balance project requirements and contractor demands while considering the contract terms.',
      sla_review: language === 'ar'
        ? 'قم بمراجعة حالة SLA لجميع المهام الحكومية في المشروع الحالي. حدد المهام المخالفة أو المعرضة للخطر واقترح إجراءات عاجلة. قدم ملخصاً بأرقام SLA المتبقية.'
        : 'Review the SLA status for all government tasks in the current project. Identify breached or at-risk tasks and suggest urgent actions. Provide a summary with remaining SLA numbers.',
      progress_report: language === 'ar'
        ? 'قم بإعداد تقرير تقدم شامل للمشروع يتضمن: نسبة الإنجاز الكلية، حالة كل مرحلة (معماري، إنشائي، كهرباء وميكانيك، حكومي، مقاولات)، المهام المتأخرة، والمخاطر المحتملة.'
        : 'Prepare a comprehensive project progress report including: overall completion percentage, status of each phase (Architectural, Structural, MEP, Government, Contracting), delayed tasks, and potential risks.',
      boq_analysis: language === 'ar'
        ? 'قم بتحليل تكاليف BOQ (جدول الكميات) للمشروع. حدد البنود التي تجاوزت الميزانية بنسبة أكثر من 20% واقترح إجراءات لتقليل التكاليف. قدم مقارنة بين التكاليف المخططة والفعلية.'
        : 'Analyze the BOQ (Bill of Quantities) costs for the project. Identify items exceeding budget by more than 20% and suggest cost reduction measures. Provide a comparison between planned and actual costs.',
    };
    
    // Map engineering quick prompts to their context type so the API loads relevant DB data
    const contextTypeMap: Record<string, 'project' | 'mun' | 'financial' | 'overdue'> = {
      municipality_notes: 'mun',
      contractor_response: 'project',
      sla_review: 'overdue',
      progress_report: 'project',
      boq_analysis: 'financial',
    };

    const promptText = prompts[promptId] || '';
    setInput(promptText);
    setPendingContextType(contextTypeMap[promptId]);
    inputRef.current?.focus();
  };
  
  // Handle skill selection
  const handleSkillSelect = (skillId: string) => {
    setActiveSkill(activeSkill === skillId ? null : skillId);
  };
  
  // Filter chat sessions by search
  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat History Sidebar */}
      {sidebarOpen && (
        <Card className="w-72 bg-card border-border flex flex-col shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground text-lg">
                {language === 'ar' ? 'المحادثات' : 'Chats'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 bg-muted border-border hover:bg-accent hover:border-blue-500"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'محادثة جديدة' : 'New Chat'}
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
            {/* Search */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 pe-3 bg-muted border-border"
                />
              </div>
            </div>
            
            {/* Chat List */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-2">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        // Save current messages to the active session before switching
                        if (currentSessionId && messages.length > 0) {
                          const persistableMsgs = messages.filter((m) => !m.isLoading);
                          setChatSessions((prev) => {
                            const idx = prev.findIndex((s) => s.id === currentSessionId);
                            if (idx !== -1 && persistableMsgs.length > 0) {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], messages: persistableMsgs, updatedAt: new Date() };
                              return updated;
                            }
                            return prev;
                          });
                        }
                        setMessages(session.messages);
                        setCurrentSessionId(session.id);
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg text-start transition-colors",
                        currentSessionId === session.id
                          ? "bg-blue-500/20 border border-blue-500/30"
                          : "bg-muted hover:bg-accent border border-transparent"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{session.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(session.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {language === 'ar' ? 'لا توجد محادثات سابقة' : 'No previous chats'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      {/* Main Chat Area */}
      <Card className="flex-1 bg-card border-border flex flex-col min-w-0">
        {/* Chat Header */}
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-400" />
                <div>
                  <CardTitle className="text-foreground text-lg">
                    {language === 'ar' ? 'المساعد بلو' : 'Blu Assistant'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'مساعدك الذكي للهندسة' : 'Your AI Engineering Assistant'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[200px] bg-muted border-border">
                  <SelectValue placeholder={t.selectModel} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-80">
                  {/* Group by provider */}
                  {['Google', 'OpenAI', 'DeepSeek', 'Mistral', 'Meta', 'xAI', 'Anthropic'].map(provider => {
                    const models = AVAILABLE_MODELS.filter(m => m.provider === provider);
                    if (models.length === 0) return null;
                    return (
                      <SelectGroup key={provider}>
                        <SelectLabel className="text-muted-foreground">{provider}</SelectLabel>
                        {models.map(model => (
                          <SelectItem 
                            key={model.id} 
                            value={model.id}
                            className="text-foreground focus:bg-muted"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", PROVIDER_COLORS[model.provider] || 'bg-slate-500')} />
                              <span>{model.name}</span>
                              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                {COST_TIER_LABELS[model.costTier] || model.costTier}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {/* Clear Chat */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-red-400"
                      onClick={handleClearChat}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{language === 'ar' ? 'مسح المحادثة' : 'Clear Chat'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"} className="bg-card border-border">
                  <DropdownMenuItem className="text-foreground/80 focus:bg-muted">
                    <RefreshCw className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'إعادة تحميل' : 'Refresh'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-foreground/80 focus:bg-muted">
                    <FileText className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'تصدير المحادثة' : 'Export Chat'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-secondary" />
                  <DropdownMenuItem className="text-foreground/80 focus:bg-muted">
                    <Settings className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'الإعدادات' : 'Settings'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Current Model Badge */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className={cn("gap-1.5 border-border", (PROVIDER_COLORS[currentModel.provider] || 'bg-slate-500').replace('bg-', 'text-').replace('-500', '-400'))}>
              <span className={cn("w-2 h-2 rounded-full", PROVIDER_COLORS[currentModel.provider] || 'bg-slate-500')} />
              {currentModel.name}
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {currentModel.provider}
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {COST_TIER_LABELS[currentModel.costTier] || currentModel.costTier}
            </Badge>
          </div>
          
          {/* Skills Bar */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground">{language === 'ar' ? 'المهارات:' : 'Skills:'}</span>
            {AI_SKILLS.map((skill) => (
              <Button
                key={skill.id}
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 text-xs gap-1.5 border-border",
                  activeSkill === skill.id 
                    ? "bg-blue-500/20 border-blue-500 text-blue-400" 
                    : "bg-muted hover:bg-accent text-foreground/80"
                )}
                onClick={() => handleSkillSelect(skill.id)}
              >
                <skill.icon className={cn("w-3 h-3", skill.color)} />
                {language === 'ar' ? skill.nameAr : skill.nameEn}
              </Button>
            ))}
          </div>
        </CardHeader>
        
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {language === 'ar' ? 'مرحباً! أنا المساعد بلو' : "Hello! I'm Blu Assistant"}
                </h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  {language === 'ar' 
                    ? 'يمكنني مساعدتك في الحسابات الهندسية، أكواد البناء الإماراتية، واستفسارات الأسعار.'
                    : 'I can help you with engineering calculations, UAE building codes, and price inquiries.'}
                </p>
                
                {/* Quick Prompts - General */}
                <div className="grid grid-cols-2 gap-2 max-w-lg">
                  {QUICK_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt.id}
                      variant="outline"
                      className="h-auto py-3 px-4 bg-muted border-border hover:bg-accent hover:border-border justify-start"
                      onClick={() => handleQuickPrompt(prompt.id)}
                    >
                      <prompt.icon className={cn("w-4 h-4 shrink-0 me-2", prompt.color)} />
                      <span className="text-sm text-foreground/80">
                        {language === 'ar' ? prompt.labelAr : prompt.labelEn}
                      </span>
                    </Button>
                  ))}
                </div>
                
                {/* Engineering Quick Prompts */}
                <div className="mt-6 pt-4 border-t border-border w-full max-w-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    {language === 'ar' ? '🏗️ أدوات هندسية سريعة:' : '🏗️ Engineering Quick Tools:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ENGINEERING_QUICK_PROMPTS.map((prompt) => (
                      <Button
                        key={prompt.id}
                        variant="outline"
                        className="h-auto py-3 px-4 bg-muted border-border hover:bg-accent hover:border-blue-500/50 justify-start"
                        onClick={() => handleQuickPrompt(prompt.id)}
                      >
                        <prompt.icon className={cn("w-4 h-4 shrink-0 me-2", prompt.color)} />
                        <span className="text-sm text-foreground/80">
                          {language === 'ar' ? prompt.labelAr : prompt.labelEn}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Skills Info */}
                <div className="mt-8 pt-6 border-t border-border w-full max-w-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    {language === 'ar' ? '✨ مهارات متاحة:' : '✨ Available Skills:'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_SKILLS.map((skill) => (
                      <div 
                        key={skill.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs"
                      >
                        <skill.icon className={cn("w-4 h-4", skill.color)} />
                        <span className="text-foreground/80">{language === 'ar' ? skill.nameAr : skill.nameEn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <Avatar className={cn(
                      "w-8 h-8 shrink-0",
                      message.role === 'user' ? "bg-blue-500" : "bg-secondary"
                    )}>
                      <AvatarFallback className={cn(
                        message.role === 'user' ? "bg-blue-500" : "bg-secondary"
                      )}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-foreground" />
                        ) : (
                          <Bot className="w-4 h-4 text-blue-400" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Message Bubble */}
                    <div className={cn(
                      "flex-1 max-w-[80%]",
                      message.role === 'user' ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "rounded-2xl px-4 py-3",
                        message.role === 'user'
                          ? "bg-blue-500 text-foreground rounded-tr-md"
                          : "bg-muted text-foreground rounded-tl-md"
                      )}>
                        {message.isLoading ? (
                          <TypingIndicator />
                        ) : (
                          <MessageContent content={message.content} imageData={message.imageData} />
                        )}
                      </div>
                      
                      {/* Message Meta */}
                      <div className={cn(
                        "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}>
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(message.timestamp)}</span>
                        
                        {message.model && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground py-0 px-1.5">
                              {AVAILABLE_MODELS.find(m => m.id === message.model)?.name || message.model}
                            </Badge>
                          </>
                        )}
                        
                        {message.skill && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs border-purple-700 text-purple-400 py-0 px-1.5 gap-1">
                              <Wand2 className="w-2 h-2" />
                              {AI_SKILLS.find(s => s.id === message.skill)?.nameAr || message.skill}
                            </Badge>
                          </>
                        )}
                        
                        {message.tokens && (
                          <>
                            <span>•</span>
                            <Zap className="w-3 h-3" />
                            <span>{message.tokens} {t.tokens}</span>
                          </>
                        )}
                        
                        {/* Copy Button */}
                        {!message.isLoading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopyMessage(message.id, message.content)}
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        {/* Input Area */}
        <div className="border-t border-border p-4">
          {/* Active Skill Indicator */}
          {activeSkill && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Wand2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">
                {language === 'ar' ? 'المهارة النشطة: ' : 'Active Skill: '}
                {AI_SKILLS.find(s => s.id === activeSkill)?.nameAr || activeSkill}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ms-auto text-muted-foreground hover:text-foreground"
                onClick={() => setActiveSkill(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {/* Quick Prompts (when there are messages) */}
          {messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {[...QUICK_PROMPTS, ...ENGINEERING_QUICK_PROMPTS].map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="shrink-0 bg-muted border-border hover:bg-accent hover:border-border"
                  onClick={() => handleQuickPrompt(prompt.id)}
                >
                  <prompt.icon className={cn("w-3 h-3 me-1.5", prompt.color)} />
                  <span className="text-xs">
                    {language === 'ar' ? prompt.labelAr : prompt.labelEn}
                  </span>
                </Button>
              ))}
            </div>
          )}
          
          {/* Input Field */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={activeSkill 
                  ? (language === 'ar' 
                      ? `أدخل ${AI_SKILLS.find(s => s.id === activeSkill)?.descriptionAr || 'المدخلات'}...`
                      : `Enter ${AI_SKILLS.find(s => s.id === activeSkill)?.descriptionEn || 'input'}...`)
                  : t.askBlu
                }
                className="min-h-[44px] max-h-32 resize-none bg-muted border-border focus:border-blue-500 pe-12"
                rows={1}
                disabled={isTyping}
              />
              <Button
                size="sm"
                className="absolute bottom-1.5 end-1.5 bg-blue-500 hover:bg-blue-600"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                {isTyping ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Input Footer */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {language === 'ar' 
                ? 'اضغط Enter للإرسال أو Shift+Enter لسطر جديد'
                : 'Press Enter to send or Shift+Enter for new line'}
            </span>
            <span className="flex items-center gap-1">
              <Code className="w-3 h-3" />
              {language === 'ar' ? 'يدعم Markdown' : 'Markdown supported'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
