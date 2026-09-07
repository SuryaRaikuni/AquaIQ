import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const state  = searchParams.get('state');
  const season = searchParams.get('season');

  const where: Record<string, unknown> = {};
  if (state) where.state = state;

  const districts = await prisma.district.findMany({
    where,
    orderBy: { stressIndex: 'desc' },
    select: {
      id: true,
      name: true,
      state: true,
      stressIndex: true,
      groundwaterLevel: true,
      rainfallAvg: true,
      dominantSource: true,
      dataQuality: true,
      geojson: true,
    },
  });

  return NextResponse.json({ districts, season });
}
