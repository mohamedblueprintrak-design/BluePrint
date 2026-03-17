import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import ZAI from 'z-ai-web-dev-sdk';
import { getJWTSecret } from '../utils/auth';

// API Response types
interface CompletionChoice {
  message?: {
    content?: string;
  };
}

interface CompletionUsage {
  total_tokens?: number;
}

interface SearchFunctionResultItem {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
}

// Rate Limiting: In-memory store for request tracking
const aiChatRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const AI_CHAT_RATE_LIMIT_REQUESTS = 50; // Increased for skills
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
- البحث في الإنترنت عند الحاجة لمعلومات حديثة
- توليد صور توضيحية عند الطلب

إرشادات الرد:
- قدم إجابات دقيقة وواضحة باللغة العربية
- استخدم المصطلحات الفنية المناسبة
- اذكر المعايير والأكواد المعمول بها في الإمارات عند الحاجة
- إذا كان السؤال خارج تخصصك، اعتذر بلطف وقدم التوجيه المناسب
- استخدم تنسيق Markdown للجداول والقوائم والكود عند الحاجة
- عند طلب صورة، اكتب "【صورة: وصف الصورة】" وسأقوم بتوليدها

كن ودوداً ومحترفاً في جميع تفاعلاتك.`;

// Skill: Web Search
async function performWebSearch(query: string, numResults: number = 5): Promise<SearchFunctionResultItem[]> {
  try {
    const zai = await ZAI.create();
    const searchResult = await zai.functions.invoke("web_search", {
      query: query,
      num: numResults
    });
    return searchResult as SearchFunctionResultItem[];
  } catch (error) {
    console.error('Web Search Error:', error);
    return [];
  }
}

// Skill: Image Generation
async function generateImage(prompt: string, size: string = '1024x1024'): Promise<string | null> {
  try {
    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt: prompt,
      size: size as any
    });
    return response.data?.[0]?.base64 || null;
  } catch (error) {
    console.error('Image Generation Error:', error);
    return null;
  }
}

// Skill: Translation
async function translateText(text: string, targetLang: string = 'ar'): Promise<string> {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: `You are a professional translator. Translate the following text to ${targetLang === 'ar' ? 'Arabic' : 'English'}. Only return the translation, no explanations.` },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    return completion.choices?.[0]?.message?.content || text;
  } catch (error) {
    console.error('Translation Error:', error);
    return text;
  }
}

// Skill: Code Explanation
async function explainCode(code: string, language: string = 'ar'): Promise<string> {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: `You are a code expert. Explain the following code ${language === 'ar' ? 'in Arabic' : 'in English'}. Be clear and educational.` },
        { role: 'user', content: `Explain this code:\n\n\`\`\`\n${code}\n\`\`\`` }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });
    return completion.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Code Explanation Error:', error);
    return '';
  }
}

// Skill: Summarization
async function summarizeText(text: string, language: string = 'ar'): Promise<string> {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: `You are a summarization expert. Summarize the following text ${language === 'ar' ? 'in Arabic' : 'in English'}. Be concise but comprehensive.` },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });
    return completion.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Summarization Error:', error);
    return '';
  }
}

// Skill: Sentiment Analysis
async function analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number; details: string }> {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: 'Analyze the sentiment of the text. Return JSON: {"sentiment": "positive/negative/neutral", "confidence": 0-1, "details": "brief explanation"}' },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });
    const result = completion.choices?.[0]?.message?.content || '';
    try {
      return JSON.parse(result);
    } catch {
      return { sentiment: 'neutral', confidence: 0.5, details: result };
    }
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    return { sentiment: 'neutral', confidence: 0, details: 'Error analyzing sentiment' };
  }
}

// Main POST handler
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
    const { 
      message, 
      model = 'gemini-2.0-flash', 
      history = [],
      skill, // Optional skill parameter
      skillParams // Parameters for the skill
    } = body;

    // Handle specific skills
    if (skill) {
      return await handleSkillRequest(skill, skillParams, user);
    }

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

    // Check if user wants to search the web
    const wantsWebSearch = message.includes('ابحث') || 
                          message.includes('بحث') || 
                          message.includes('search') ||
                          message.includes('ما هو') ||
                          message.includes('ما هي') ||
                          message.includes('كم سعر') ||
                          message.includes('أسعار') ||
                          message.includes('أخبار') ||
                          message.includes('معلومات عن');

    // Check if user wants an image
    const wantsImage = message.includes('صورة') || 
                      message.includes('ارسم') ||
                      message.includes('صمم') ||
                      message.includes('generate image') ||
                      message.includes('create image') ||
                      message.includes('【صورة:');

    let webSearchResults: SearchFunctionResultItem[] = [];
    let generatedImage: string | null = null;

    // Perform web search if needed
    if (wantsWebSearch) {
      const searchQuery = message
        .replace('ابحث عن', '')
        .replace('ابحث', '')
        .replace('بحث', '')
        .replace('search for', '')
        .replace('search', '')
        .trim();
      webSearchResults = await performWebSearch(searchQuery, 5);
    }

    // Generate image if needed
    if (wantsImage) {
      const imagePrompt = message
        .replace('صورة', '')
        .replace('ارسم', '')
        .replace('صمم', '')
        .replace('generate image', '')
        .replace('create image', '')
        .replace('【صورة:', '')
        .replace('】', '')
        .trim();
      generatedImage = await generateImage(`Professional architectural/engineering illustration: ${imagePrompt}`);
    }

    // Build context with search results
    let contextMessage = message;
    if (webSearchResults.length > 0) {
      contextMessage += '\n\nنتائج البحث من الإنترنت:\n';
      webSearchResults.forEach((result, index) => {
        contextMessage += `${index + 1}. ${result.name}\n   ${result.snippet}\n   المصدر: ${result.url}\n\n`;
      });
    }

    // Build messages array for the LLM
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: contextMessage.trim() }
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
    let responseContent = (completion as any).choices?.[0]?.message?.content || '';
    
    // Add image to response if generated
    if (generatedImage) {
      responseContent += `\n\n![صورة مولدة](data:image/png;base64,${generatedImage})`;
    }
    
    // Estimate token count (approximate)
    const tokens = (completion as any).usage?.total_tokens || 
      Math.ceil((message.length + responseContent.length) / 4);

    return successResponse({
      response: responseContent,
      tokens: tokens,
      model: selectedModel,
      webSearchResults: webSearchResults.length > 0 ? webSearchResults : undefined,
      generatedImage: generatedImage ? true : undefined
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

// Handle skill-specific requests
async function handleSkillRequest(skill: string, params: any, user: any): Promise<NextResponse> {
  switch (skill) {
    case 'web_search': {
      const { query, num = 5 } = params || {};
      if (!query) {
        return errorResponse('يرجى تحديد كلمة البحث.');
      }
      const results = await performWebSearch(query, num);
      return successResponse({ results, skill: 'web_search' });
    }
    
    case 'generate_image': {
      const { prompt, size = '1024x1024' } = params || {};
      if (!prompt) {
        return errorResponse('يرجى تحديد وصف الصورة.');
      }
      const imageBase64 = await generateImage(prompt, size);
      if (!imageBase64) {
        return errorResponse('فشل في توليد الصورة. يرجى المحاولة مرة أخرى.', 'IMAGE_ERROR', 500);
      }
      return successResponse({ image: imageBase64, skill: 'generate_image' });
    }
    
    case 'translate': {
      const { text, targetLang = 'ar' } = params || {};
      if (!text) {
        return errorResponse('يرجى تحديد النص للترجمة.');
      }
      const translation = await translateText(text, targetLang);
      return successResponse({ translation, original: text, targetLang, skill: 'translate' });
    }
    
    case 'explain_code': {
      const { code, language = 'ar' } = params || {};
      if (!code) {
        return errorResponse('يرجى تحديد الكود للشرح.');
      }
      const explanation = await explainCode(code, language);
      return successResponse({ explanation, skill: 'explain_code' });
    }
    
    case 'summarize': {
      const { text, language = 'ar' } = params || {};
      if (!text) {
        return errorResponse('يرجى تحديد النص للتلخيص.');
      }
      const summary = await summarizeText(text, language);
      return successResponse({ summary, skill: 'summarize' });
    }
    
    case 'sentiment': {
      const { text } = params || {};
      if (!text) {
        return errorResponse('يرجى تحديد النص لتحليل المشاعر.');
      }
      const analysis = await analyzeSentiment(text);
      return successResponse({ ...analysis, skill: 'sentiment' });
    }
    
    default:
      return errorResponse(`المهارة "${skill}" غير معروفة.`, 'UNKNOWN_SKILL', 400);
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
