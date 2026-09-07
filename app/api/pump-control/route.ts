import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const PumpSchema = z.object({
  device_id:          z.string(),
  pump_enabled:       z.boolean(),
  moisture_threshold: z.number().min(0).max(100).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const data = PumpSchema.parse(body);
  const userId = (session.user as { id: string }).id;

  await prisma.userSettings.upsert({
    where:  { userId },
    update: {
      pumpEnabled:       data.pump_enabled,
      ...(data.moisture_threshold !== undefined && {
        moistureThreshold: data.moisture_threshold,
      }),
    },
    create: {
      userId,
      pumpEnabled:       data.pump_enabled,
      moistureThreshold: data.moisture_threshold ?? 30,
      simMode:           true,
    },
  });

  return NextResponse.json({ status: 'ok', pump_enabled: data.pump_enabled });
}
