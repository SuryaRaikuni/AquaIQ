import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const CreateSchema = z.object({
  type:  z.enum(['footprint', 'irrigation', 'scenario']),
  label: z.string().min(1).max(80),
  data:  z.record(z.unknown()),
});

// ── GET /api/profiles?type=footprint ─────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  const profiles = await prisma.savedProfile.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      label: true,
      data: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ profiles });
}

// ── POST /api/profiles ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);

    const profile = await prisma.savedProfile.create({
      data: {
        userId,
        type:  data.type,
        label: data.label,
        data:  data.data as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE /api/profiles?id=... ───────────────────────────────────────────────
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  // Ensure profile belongs to requesting user
  const existing = await prisma.savedProfile.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.savedProfile.delete({ where: { id } });
  return NextResponse.json({ status: 'deleted' });
}
