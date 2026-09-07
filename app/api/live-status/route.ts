import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get('device_id') ?? 'ESP32_AQUAIQ_001';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial reading immediately
      const latest = await prisma.sensorReading.findFirst({
        where:   { deviceId },
        orderBy: { recordedAt: 'desc' },
      });
      if (latest) send(latest);

      // Poll every 5 seconds
      const interval = setInterval(async () => {
        try {
          const reading = await prisma.sensorReading.findFirst({
            where:   { deviceId },
            orderBy: { recordedAt: 'desc' },
          });
          if (reading) send(reading);
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 5000);

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
