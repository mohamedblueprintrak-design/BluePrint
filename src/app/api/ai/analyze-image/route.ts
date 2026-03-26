import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import ZAI from 'z-ai-web-dev-sdk';
import { getJWTSecret } from '../../utils/auth';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 20; // Fewer for image analysis
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

// System prompts for different task types
const SYSTEM_PROMPTS: Record<string, string> = {
  'site-photo': `أنت مهندس موقع متخصص في تقييم صور مواقع البناء.
قم بتحليل الصورة المقدمة وقدم:
1. وصف دقيق لما تراه
2. تقييم حالة العمل والتقدم
3. أي مشاكل أو مخاطر محتملة
4. توصيات للتحسين
5. نسبة التقدير للإنجاز (إن أمكن)

استخدم اللغة العربية في الرد.`,

  'blueprint-read': `أنت مهندس مدني متخصص في قراءة المخططات الهندسية.
قم بتحليل المخطط المقدم وقدم:
1. نوع المخطط (معماري/إنشائي/كهربائي/ميكانيكي)
2. الأبعاد والمساحات الرئيسية
3. التفاصيل الهندسية المهمة
4. أي ملاحظات أو مشاكل محتملة
5. المتطلبات للتنفيذ

استخدم اللغة العربية في الرد.`,

  'progress-detection': `أنت خبير تقييم تقدم مشاريع البناء.
قم بتحليل الصورة وقدم:
1. نسبة الإنجاز التقريبية
2. المرحلة الحالية للمشروع
3. جودة العمل الظاهرة
4. أي تأخيرات أو مشاكل محتملة

استخدم اللغة العربية.`,

  'safety-inspection': `أنت خبير سلامة موقع بناء معتمد.
قم بتحليل الصورة وقدم:
1. تقييم السلامة العام (1-10)
2. المخاطر المحددة
3. المخالفات إن وجدت
4. التوصيات الضرورية
5. الإجراءات المطلوبة فوراً

استخدم اللغة العربية.`,

  'damage-assessment': `أنت خبير تقييم أضرار مباني.
قم بتحليل الصورة وقدم:
1. نوع الضرر
2. شدة الضرر (بسيط/متوسط/شديد/حرج)
3. الأسباب المحتملة
4. التوصيات للإصلاح
5. التقدير الأولي للتكلفة (نطاق)

استخدم اللغة العربية.`,

  'image-analysis': `أنت محلل صور ذكي.
قم بتحليل الصورة المقدمة وقدم وصفاً تفصيلياً وتحليلاً شاملاً.
استخدم اللغة العربية في الرد.`
};

// Vision-capable models (in order of preference)
const VISION_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3.5-sonnet'
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
      image, 
      prompt = 'قم بتحليل هذه الصورة', 
      taskType = 'image-analysis',
      model: requestedModel 
    } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'الصورة مطلوبة' },
        { status: 400 }
      );
    }

    // Get system prompt for task type
    const systemPrompt = SYSTEM_PROMPTS[taskType] || SYSTEM_PROMPTS['image-analysis'];

    // Select model
    const selectedModel = requestedModel && VISION_MODELS.includes(requestedModel)
      ? requestedModel
      : VISION_MODELS[0];

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Prepare image content
    let imageContent: string | { url: string };
    if (image.startsWith('data:')) {
      // Already base64 with data URI
      imageContent = image;
    } else if (image.startsWith('http')) {
      // URL
      imageContent = { url: image };
    } else {
      // Assume raw base64
      imageContent = `data:image/jpeg;base64,${image}`;
    }

    // Build messages with image
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { 
            type: 'image_url', 
            image_url: typeof imageContent === 'string' 
              ? { url: imageContent } 
              : imageContent 
          }
        ]
      }
    ];

    // Call vision model
    const completion = await zai.chat.completions.create({
      model: selectedModel,
      messages: messages,
      temperature: 0.7,
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
          input: Math.ceil(tokens * 0.3),
          output: Math.ceil(tokens * 0.7),
          total: tokens
        }
      }
    });

  } catch (error) {
    console.error('Image Analysis Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تحليل الصورة' },
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
