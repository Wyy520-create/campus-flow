import { NextRequest } from 'next/server';
import { subscribe } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          if (heartbeat) clearInterval(heartbeat);
        }
      };
      send({ type: 'connected' });
      const unsubscribe = subscribe(send);
      heartbeat = setInterval(() => send({ type: 'ping' }), 15000);
      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
