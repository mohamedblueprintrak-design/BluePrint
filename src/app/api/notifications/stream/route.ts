import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose'
import { getJWTSecret } from '@/app/api/utils/auth';;


// Check if user is authenticated
async function getUserFromToken(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, getJWTSecret());
    return { id: payload.userId as string };
  } catch {
    return null;
  }
}

// GET - SSE Stream for real-time notifications
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  
  // Return proper JSON error for unauthenticated requests
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'يرجى تسجيل الدخول' } },
      { status: 401 }
    );
  }

  // For demo mode or when database is not available, return a simple response
  // This prevents the continuous reconnection loop
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let isClosed = false;
      
      // Send initial connection event
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        if (isClosed) return;
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Connection closed
        }
      };

      // Send connected event
      sendEvent('connected', { 
        userId: user.id, 
        timestamp: new Date().toISOString()
      });

      // Send initial unread count
      sendEvent('unread_count', { count: 0 });

      // Keep-alive heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (isClosed) return;
        sendEvent('heartbeat', { timestamp: new Date().toISOString() });
      }, 30000);

      // Close connection after 5 minutes to prevent memory leaks
      const timeoutId = setTimeout(() => {
        isClosed = true;
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }, 5 * 60 * 1000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(heartbeatInterval);
        clearTimeout(timeoutId);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
