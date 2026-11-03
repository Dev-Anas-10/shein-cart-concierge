import { NextRequest } from 'next/server';
import { realtimeBus, RealtimePayload } from '@/lib/realtime-events';
import { getRequestSession } from '@/lib/auth-security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const channel = searchParams.get('channel') || 'customer';

  const session = await getRequestSession(req);
  const isAdmin = session?.role === 'admin';

  // Strictly restrict the global administrative stream to verified admins
  if (channel === 'admin' && !isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin session required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event
      try {
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({ status: 'connected', channel, orderId })}\n\n`
          )
        );
      } catch {
        // Stream aborted early
        return;
      }

      // 2. Event listener: non-admins only receive updates strictly scoped to their specific order
      const onEvent = (payload: RealtimePayload) => {
        try {
          if (!isAdmin && orderId && payload.orderId && payload.orderId !== orderId) {
            return;
          }
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        } catch {
          // Stream closed
          if (cleanup) cleanup();
        }
      };

      if (isAdmin && channel === 'admin') {
        realtimeBus.on('event', onEvent);
      } else if (orderId) {
        realtimeBus.on(`order:${orderId}`, onEvent);
      }

      // 3. Keep-alive heartbeat ping every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
          if (cleanup) cleanup();
        }
      }, 15000);

      cleanup = () => {
        clearInterval(pingInterval);
        if (orderId) {
          realtimeBus.off(`order:${orderId}`, onEvent);
        }
        if (isAdmin && channel === 'admin') {
          realtimeBus.off('event', onEvent);
        }
      };
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  req.signal.addEventListener('abort', () => {
    if (cleanup) cleanup();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
