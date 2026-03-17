import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'blueprint-demo-secret-key-for-development-minimum-32-characters');

// مدة Keep-alive للاتصال (30 ثانية)
const KEEP_ALIVE_INTERVAL = 30000;
// مهلة الاتصال (5 دقائق)
const CONNECTION_TIMEOUT = 5 * 60 * 1000;

async function getUserFromToken(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return await db.user.findUnique({ 
      where: { id: payload.userId as string }
    });
  } catch {
    return null;
  }
}

// GET - SSE Stream للإشعارات الفورية
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // إنشاء ReadableStream للـ SSE
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;
  let timeoutId: NodeJS.Timeout;
  let isClosed = false;

  const stream = new ReadableStream({
    start: async (controller) => {
      // إرسال حدث الاتصال
      const sendEvent = (event: string, data: any) => {
        if (isClosed) return;
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (e) {
          // Connection closed
        }
      };

      // إرسال حدث الاتصال الناجح
      sendEvent('connected', { 
        userId: user.id, 
        timestamp: new Date().toISOString(),
        message: 'متصل بنظام الإشعارات الفورية'
      });

      // إرسال عدد الإشعارات غير المقروءة
      const sendUnreadCount = async () => {
        if (isClosed) return;
        try {
          const count = await db.notification.count({
            where: { userId: user.id, isRead: false }
          });
          sendEvent('unread_count', { count });
        } catch (e) {
          // Demo mode - إرسال عدد افتراضي
          sendEvent('unread_count', { count: 5 });
        }
      };

      // إرسال عدد الإشعارات الأولي
      await sendUnreadCount();

      // Keep-alive heartbeat
      intervalId = setInterval(() => {
        if (isClosed) return;
        sendEvent('heartbeat', { 
          timestamp: new Date().toISOString() 
        });
      }, KEEP_ALIVE_INTERVAL);

      // إغلاق الاتصال بعد المهلة
      timeoutId = setTimeout(() => {
        if (!isClosed) {
          isClosed = true;
          clearInterval(intervalId);
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
        }
      }, CONNECTION_TIMEOUT);

      // التحقق من الإشعارات الجديدة دورياً (كل 10 ثواني)
      let lastCheck = new Date();
      const checkInterval = setInterval(async () => {
        if (isClosed) {
          clearInterval(checkInterval);
          return;
        }
        
        try {
          const newNotifications = await db.notification.findMany({
            where: { 
              userId: user.id,
              createdAt: { gt: lastCheck }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          });
          
          if (newNotifications.length > 0) {
            lastCheck = new Date();
            for (const notif of newNotifications) {
              sendEvent('notification', {
                id: notif.id,
                title: notif.title,
                message: notif.message,
                notificationType: notif.notificationType,
                priority: notif.priority,
                actionUrl: notif.actionUrl,
                createdAt: notif.createdAt.toISOString()
              });
            }
            await sendUnreadCount();
          }
        } catch (e) {
          // Demo mode - لا تفعل شيئاً
        }
      }, 10000);
    },
    
    cancel: () => {
      isClosed = true;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    }
  });

  // إرجاع استجابة SSE
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // تعطيل buffering في nginx
    },
  });
}
