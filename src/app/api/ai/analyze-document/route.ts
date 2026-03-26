import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import ZAI from 'z-ai-web-dev-sdk';
import { getJWTSecret } from '../../utils/auth';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW = 60000;

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1 };
  }
  
  if (record.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - record.count };
}

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const { payload } = await jose.jwtVerify(authHeader.substring(7), getJWTSecret());
    return { id: payload.userId as string };
  } catch {
    return null;
  }
}

// System prompts for different document analysis types
const SYSTEM_PROMPTS: Record<string, string> = {
  'contract-analysis': `أنت مستشار قانوني متخصص في عقود المقاولات والبناء في الإمارات العربية المتحدة.

قم بتحليل العقد المقدم وقدم:

## 📋 ملخص العقد
- أطراف العقد
- موضوع العقد
- القيمة والمدة
- تاريخ التوقيع

## ⚠️ المخاطر والتحذيرات
حدد البنود التي قد تشكل مخاطر مثل:
- شروط جزائية غير متوازنة
- التزامات غير واضحة
- غرامات مالية مرتفعة
- شروط تعسفية

## ✅ البنود الإيجابية
- البنود العادلة
- الضمانات المطلوبة
- آليات تسوية النزاعات

## 📝 التوصيات
- تعديلات مقترحة
- بنود ينصح بإضافتها
- نقاط تحتاج توضيح

استخدم اللغة العربية والتنسيق الواضح.`,

  'document-review': `أنت خبير مراجعة مستندات هندسية وإدارية.
قم بمراجعة المستند المقدم وقدم:
1. ملخص المحتوى
2. الأخطاء والتناقضات إن وجدت
3. النقاط الناقصة
4. التوصيات للتحسين
5. حالة المستند (كامل/ناقص/يحتاج مراجعة)

استخدم اللغة العربية.`,

  'invoice-extraction': `أنت خبير استخراج بيانات الفواتير.
من الفاتورة المقدمة، استخرج:
1. رقم الفاتورة وتاريخها
2. اسم المورد والعميل
3. قائمة الأصناف والكميات والأسعار
4. المجموع الفرعي والضريبة والإجمالي
5. شروط الدفع

قدم البيانات بتنسيق JSON إن أمكن.`,

  'document-analysis': `أنت محلل مستندات ذكي.
قم بتحليل المستند المقدم وقدم:
1. نوع المستند
2. ملخص المحتوى
3. النقاط الرئيسية
4. التحليل والاستنتاجات

استخدم اللغة العربية.`,

  'legal-analysis': `أنت مستشار قانوني متخصص في قوانين البناء والإنشاء في الإمارات.
قم بتحليل المسألة القانونية أو المستند المقدم وقدم:
1. الإطار القانوني المطبق
2. الحقوق والالتزامات
3. المخاطر القانونية
4. التوصيات والإجراءات المطلوبة
5. المراجع القانونية ذات الصلة

استخدم اللغة العربية.`
};

// Models best for document analysis (in order of preference)
const DOCUMENT_MODELS = [
  'claude-3.5-sonnet',  // Best for long documents
  'gemini-2.5-flash',   // Large context window
  'gpt-4o',             // Good reasoning
  'deepseek-reasoner',  // Good for analysis
  'gemini-2.0-flash'    // Fast and cheap
];

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز الحد المسموح' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { 
      document, 
      prompt = 'قم بتحليل هذا المستند', 
      taskType = 'document-analysis',
      model: requestedModel 
    } = body;

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'المستند مطلوب' },
        { status: 400 }
      );
    }

    // Check document length
    if (document.length > 500000) {
      return NextResponse.json(
        { success: false, error: 'المستند طويل جداً. الحد الأقصى 500,000 حرف.' },
        { status: 400 }
      );
    }

    // Get system prompt for task type
    const systemPrompt = SYSTEM_PROMPTS[taskType] || SYSTEM_PROMPTS['document-analysis'];

    // Select model (prefer models with large context windows)
    const selectedModel = requestedModel && DOCUMENT_MODELS.includes(requestedModel)
      ? requestedModel
      : DOCUMENT_MODELS[0];

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Build messages
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `${prompt}\n\n---\n\nالمستند:\n\n${document}` 
      }
    ];

    // Call model
    const completion = await zai.chat.completions.create({
      model: selectedModel,
      messages: messages,
      temperature: 0.5, // Lower for more focused analysis
      max_tokens: 4000,
    });

    const analysis = (completion as any).choices?.[0]?.message?.content || '';
    const tokens = (completion as any).usage?.total_tokens || 0;

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        model: selectedModel,
        taskType,
        tokens: {
          input: Math.ceil(tokens * 0.7), // Usually more input
          output: Math.ceil(tokens * 0.3),
          total: tokens
        }
      }
    });

  } catch (error) {
    console.error('Document Analysis Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تحليل المستند' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
