import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import ZAI from 'z-ai-web-dev-sdk';
import { getJWTSecret } from '../utils/auth';

// API Response types (kept for documentation purposes)
// These interfaces define the expected response structure

interface CompletionChoice {
  message?: {
    content?: string;
  };
}

interface CompletionUsage {
  total_tokens?: number;
}

// Rate Limiting: In-memory store for request tracking
const aiChatRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const AI_CHAT_RATE_LIMIT_REQUESTS = 30; // requests per window for AI chat
const AI_CHAT_RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of aiChatRateLimitStore.entries()) {
    if (now > record.resetTime) {
      aiChatRateLimitStore.delete(key);
    }
  }
}, 300000);

// Get client IP from request
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

// Check rate limit for AI chat requests
function checkRateLimit(request: NextRequest, userId?: string): { allowed: boolean; remaining: number; resetTime: number } {
  // Rate limit by user ID if available, otherwise by IP
  const key = userId || getClientIP(request);
  const now = Date.now();
  const record = aiChatRateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    aiChatRateLimitStore.set(key, { count: 1, resetTime: now + AI_CHAT_RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: AI_CHAT_RATE_LIMIT_REQUESTS - 1, resetTime: now + AI_CHAT_RATE_LIMIT_WINDOW };
  }
  
  if (record.count >= AI_CHAT_RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: AI_CHAT_RATE_LIMIT_REQUESTS - record.count, resetTime: record.resetTime };
}

// Helper functions
function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, code = 'ERROR', status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

function rateLimitError(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'تم تجاوز الحد المسموح من طلبات الذكاء الاصطناعي. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.' } },
    { 
      status: 429, 
      headers: { 
        'Retry-After': retryAfter.toString(), 
        'X-RateLimit-Limit': AI_CHAT_RATE_LIMIT_REQUESTS.toString(), 
        'X-RateLimit-Remaining': '0', 
        'X-RateLimit-Reset': resetTime.toString() 
      } 
    }
  );
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function getUserFromToken(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    return {
      id: payload.userId as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

// Supported AI Models mapping
const MODEL_MAPPING: Record<string, string> = {
  // Google Gemini
  'gemini-2.0-flash': 'gemini-2.0-flash',
  'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
  'gemini-2.5-flash': 'gemini-2.5-flash',
  
  // OpenAI
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  
  // DeepSeek
  'deepseek-chat': 'deepseek-chat',
  'deepseek-reasoner': 'deepseek-reasoner',
  'deepseek-r1-free': 'deepseek-r1-free',
  
  // Mistral
  'mistral-small': 'mistral-small',
  'mistral-medium': 'mistral-medium',
  'mistral-large': 'mistral-large',
  
  // Meta Llama
  'llama-3.1-8b': 'llama-3.1-8b',
  'llama-3.1-70b': 'llama-3.1-70b',
  'llama-3.2-3b': 'llama-3.2-3b',
  'llama-3.2-11b': 'llama-3.2-11b',
  
  // Google Gemma
  'gemma-2-9b': 'gemma-2-9b',
  'gemma-2-27b': 'gemma-2-27b',
  
  // xAI Grok
  'grok-beta': 'grok-beta',
  'grok-2': 'grok-2',
  
  // Anthropic Claude
  'claude-3-haiku': 'claude-3-haiku',
  'claude-3.5-sonnet': 'claude-3.5-sonnet',
};

// System prompt for the AI assistant
const SYSTEM_PROMPT = `أنت "بلو"، مساعد ذكي متخصص في الهندسة المدنية والبناء في الإمارات العربية المتحدة.

مسؤولياتك:
- المساعدة في الحسابات الهندسية والإنشائية
- شرح متطلبات أكواد البناء الإماراتية
- تقديم معلومات عن أسعار مواد البناء في السوق الإماراتي
- المساعدة في التصميم الإنشائي والمعماري
- الإجابة على استفسارات الهندسة المدنية

إرشادات الرد:
- قدم إجابات دقيقة وواضحة باللغة العربية
- استخدم المصطلحات الفنية المناسبة
- اذكر المعايير والأكواد المعمول بها في الإمارات عند الحاجة
- إذا كان السؤال خارج تخصصك، اعتذر بلطف وقدم التوجيه المناسب
- استخدم تنسيق Markdown للجداول والقوائم والكود عند الحاجة

كن ودوداً ومحترفاً في جميع تفاعلاتك.`;

// POST handler for AI Chat
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('غير مصرح. يرجى تسجيل الدخول أولاً.', 'UNAUTHORIZED', 401);
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(request, user.id);
    if (!rateLimitResult.allowed) {
      return rateLimitError(rateLimitResult.resetTime);
    }

    // Parse request body
    const body = await request.json();
    const { message, model = 'gemini-2.0-flash', history = [] } = body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse('الرسالة مطلوبة ولا يمكن أن تكون فارغة.');
    }

    // Validate message length
    if (message.length > 10000) {
      return errorResponse('الرسالة طويلة جداً. الحد الأقصى 10,000 حرف.');
    }

    // Validate model
    const selectedModel = MODEL_MAPPING[model] || 'gemini-2.0-flash';

    // Build messages array for the LLM
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message.trim() }
    ];

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Call LLM API
    const completion = await zai.chat.completions.create({
      model: selectedModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Extract response
    const responseContent = completion.choices?.[0]?.message?.content || '';
    
    // Estimate token count (approximate)
    const tokens = completion.usage?.total_tokens || 
      Math.ceil((message.length + responseContent.length) / 4);

    return successResponse({
      response: responseContent,
      tokens: tokens,
      model: selectedModel
    });

  } catch (error: any) {
    console.error('AI Chat API Error:', error);
    
    // Handle specific errors
    if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      return errorResponse(
        'تم تجاوز حد الاستخدام للذكاء الاصطناعي. يرجى المحاولة لاحقاً.',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }
    
    if (error.message?.includes('timeout')) {
      return errorResponse(
        'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
        'TIMEOUT',
        504
      );
    }

    // Generic error
    return errorResponse(
      'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
      'SERVER_ERROR',
      500
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
