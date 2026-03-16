'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { useAIChat } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  ChevronDown,
  RefreshCw,
  Settings,
  PanelLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// AI Models Configuration
const AI_MODELS = [
  // Google Gemini
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', type: 'Fast', color: 'bg-blue-500' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: 'Google', type: 'Lite', color: 'bg-blue-400' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', type: 'Advanced', color: 'bg-blue-600' },
  
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', type: 'Advanced', color: 'bg-green-500' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', type: 'Fast', color: 'bg-green-400' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', type: 'Lite', color: 'bg-green-300' },
  
  // DeepSeek
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', type: 'Standard', color: 'bg-purple-500' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'DeepSeek', type: 'Reasoning', color: 'bg-purple-600' },
  { id: 'deepseek-r1-free', name: 'DeepSeek R1 Free', provider: 'DeepSeek', type: 'Free', color: 'bg-purple-400' },
  
  // Mistral
  { id: 'mistral-small', name: 'Mistral Small', provider: 'Mistral', type: 'Fast', color: 'bg-orange-400' },
  { id: 'mistral-medium', name: 'Mistral Medium', provider: 'Mistral', type: 'Standard', color: 'bg-orange-500' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', type: 'Advanced', color: 'bg-orange-600' },
  
  // Meta Llama
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'Meta', type: 'Lite', color: 'bg-yellow-500' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta', type: 'Advanced', color: 'bg-yellow-600' },
  { id: 'llama-3.2-3b', name: 'Llama 3.2 3B', provider: 'Meta', type: 'Fast', color: 'bg-yellow-400' },
  { id: 'llama-3.2-11b', name: 'Llama 3.2 11B', provider: 'Meta', type: 'Standard', color: 'bg-yellow-500' },
  
  // Google Gemma
  { id: 'gemma-2-9b', name: 'Gemma 2 9B', provider: 'Google', type: 'Standard', color: 'bg-cyan-500' },
  { id: 'gemma-2-27b', name: 'Gemma 2 27B', provider: 'Google', type: 'Advanced', color: 'bg-cyan-600' },
  
  // xAI Grok
  { id: 'grok-beta', name: 'Grok Beta', provider: 'xAI', type: 'Advanced', color: 'bg-red-500' },
  { id: 'grok-2', name: 'Grok 2', provider: 'xAI', type: 'Advanced', color: 'bg-red-600' },
  
  // Additional
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', type: 'Fast', color: 'bg-pink-500' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: 'Advanced', color: 'bg-pink-600' },
];

// Quick Prompts
const QUICK_PROMPTS = [
  { id: 'calc', labelAr: 'حسابات هندسية', labelEn: 'Engineering Calculations', icon: Calculator, color: 'text-blue-400' },
  { id: 'uae', labelAr: 'أكواد الإمارات', labelEn: 'UAE Building Codes', icon: BookOpen, color: 'text-green-400' },
  { id: 'price', labelAr: 'استعلام الأسعار', labelEn: 'Price Inquiry', icon: DollarSign, color: 'text-yellow-400' },
  { id: 'design', labelAr: 'تصميم إنشائي', labelEn: 'Structural Design', icon: Building2, color: 'text-purple-400' },
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

// Code Block Component with Syntax Highlighting
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative my-3 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-slate-400 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-slate-300 font-mono whitespace-pre-wrap">{code}</code>
      </pre>
    </div>
  );
}

// Markdown-like Content Renderer with XSS Protection
function MessageContent({ content }: { content: string }) {
  // SECURITY: Sanitize HTML to prevent XSS attacks
  const sanitizeHtml = (html: string): string => {
    return html
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove data: URLs (can contain malicious content)
      .replace(/data:/gi, '')
      // Escape any remaining HTML tags except allowed ones
      .replace(/<(?!\/?(strong|em|code|br|span)\b)[^>]*>/gi, '');
  };

  const renderContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    const remaining = text;
    let keyIndex = 0;
    
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
    text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-400 font-mono text-sm">$1</code>');
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
  const { language, isRTL } = useApp();
  const { user } = useAuth();
  const { t, formatDateTime } = useTranslation(language);
  const aiChatMutation = useAIChat();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Get current model info
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  
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
      const result = await aiChatMutation.mutateAsync({
        message: userMessage.content,
        model: selectedModel,
      });
      
      // Remove loading and add real response
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
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Remove loading and add error message
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
  };
  
  // Handle new chat
  const handleNewChat = () => {
    if (messages.length > 0) {
      const session: ChatSession = {
        id: Date.now().toString(),
        title: messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : ''),
        messages: messages,
        model: selectedModel,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChatSessions(prev => [session, ...prev]);
    }
    setMessages([]);
    setCurrentSessionId(null);
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
    };
    
    setInput(prompts[promptId] || '');
    inputRef.current?.focus();
  };
  
  // Filter chat sessions by search
  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat History Sidebar */}
      {sidebarOpen && (
        <Card className="w-72 bg-slate-900/50 border-slate-800 flex flex-col shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">
                {language === 'ar' ? 'المحادثات' : 'Chats'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-blue-500"
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
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 pe-3 bg-slate-800/50 border-slate-700"
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
                        setMessages(session.messages);
                        setCurrentSessionId(session.id);
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg text-start transition-colors",
                        currentSessionId === session.id
                          ? "bg-blue-500/20 border border-blue-500/30"
                          : "bg-slate-800/50 hover:bg-slate-800 border border-transparent"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{session.title}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDateTime(session.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
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
      <Card className="flex-1 bg-slate-900/50 border-slate-800 flex flex-col min-w-0">
        {/* Chat Header */}
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-400" />
                <div>
                  <CardTitle className="text-white text-lg">
                    {language === 'ar' ? 'المساعد بلو' : 'Blu Assistant'}
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    {language === 'ar' ? 'مساعدك الذكي للهندسة' : 'Your AI Engineering Assistant'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder={t.selectModel} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 max-h-80">
                  {/* Group by provider */}
                  {['Google', 'OpenAI', 'DeepSeek', 'Mistral', 'Meta', 'xAI', 'Anthropic'].map(provider => {
                    const models = AI_MODELS.filter(m => m.provider === provider);
                    if (models.length === 0) return null;
                    return (
                      <SelectGroup key={provider}>
                        <SelectLabel className="text-slate-400">{provider}</SelectLabel>
                        {models.map(model => (
                          <SelectItem 
                            key={model.id} 
                            value={model.id}
                            className="text-white focus:bg-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", model.color)} />
                              <span>{model.name}</span>
                              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                {model.type}
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
                      className="h-9 w-9 p-0 text-slate-400 hover:text-red-400"
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
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"} className="bg-slate-900 border-slate-700">
                  <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">
                    <RefreshCw className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'إعادة تحميل' : 'Refresh'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">
                    <FileText className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'تصدير المحادثة' : 'Export Chat'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">
                    <Settings className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'الإعدادات' : 'Settings'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Current Model Badge */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className={cn("gap-1.5 border-slate-700", currentModel.color.replace('bg-', 'text-').replace('-500', '-400'))}>
              <span className={cn("w-2 h-2 rounded-full", currentModel.color)} />
              {currentModel.name}
            </Badge>
            <Badge variant="outline" className="border-slate-700 text-slate-400">
              {currentModel.provider}
            </Badge>
            <Badge variant="outline" className="border-slate-700 text-slate-400">
              {currentModel.type}
            </Badge>
          </div>
        </CardHeader>
        
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {language === 'ar' ? 'مرحباً! أنا المساعد بلو' : "Hello! I'm Blu Assistant"}
                </h3>
                <p className="text-slate-400 max-w-md mb-6">
                  {language === 'ar' 
                    ? 'يمكنني مساعدتك في الحسابات الهندسية، أكواد البناء الإماراتية، واستفسارات الأسعار.'
                    : 'I can help you with engineering calculations, UAE building codes, and price inquiries.'}
                </p>
                
                {/* Quick Prompts */}
                <div className="grid grid-cols-2 gap-2 max-w-lg">
                  {QUICK_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt.id}
                      variant="outline"
                      className="h-auto py-3 px-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 justify-start"
                      onClick={() => handleQuickPrompt(prompt.id)}
                    >
                      <prompt.icon className={cn("w-4 h-4 shrink-0 me-2", prompt.color)} />
                      <span className="text-sm text-slate-300">
                        {language === 'ar' ? prompt.labelAr : prompt.labelEn}
                      </span>
                    </Button>
                  ))}
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
                      message.role === 'user' ? "bg-blue-500" : "bg-slate-700"
                    )}>
                      <AvatarFallback className={cn(
                        message.role === 'user' ? "bg-blue-500" : "bg-slate-700"
                      )}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
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
                          ? "bg-blue-500 text-white rounded-tr-md"
                          : "bg-slate-800 text-slate-200 rounded-tl-md"
                      )}>
                        {message.isLoading ? (
                          <TypingIndicator />
                        ) : (
                          <MessageContent content={message.content} />
                        )}
                      </div>
                      
                      {/* Message Meta */}
                      <div className={cn(
                        "flex items-center gap-2 mt-1 text-xs text-slate-500",
                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}>
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(message.timestamp)}</span>
                        
                        {message.model && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 py-0 px-1.5">
                              {AI_MODELS.find(m => m.id === message.model)?.name || message.model}
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
        <div className="border-t border-slate-800 p-4">
          {/* Quick Prompts (when there are messages) */}
          {messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {QUICK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="shrink-0 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
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
                placeholder={t.askBlu}
                className="min-h-[44px] max-h-32 resize-none bg-slate-800/50 border-slate-700 focus:border-blue-500 pe-12"
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
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
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
