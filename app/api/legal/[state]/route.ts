import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { state: string } }
) {
  const state = decodeURIComponent(params.state);

  const rules = await prisma.legalRule.findMany({
    where: { state: { equals: state, mode: 'insensitive' } },
    orderBy: [{ useCase: 'asc' }, { sourceType: 'asc' }],
  });

  if (rules.length === 0) {
    return NextResponse.json(
      { error: `No rules found for state: ${state}` },
      { status: 404 }
    );
  }

  return NextResponse.json({ state, rules });
}
