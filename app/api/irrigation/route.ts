import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const IrrigationSchema = z.object({
  cropName:           z.string(),
  landAcres:          z.number().positive(),
  soilType:           z.enum(['sandy', 'loamy', 'clay', 'red', 'black']),
  currentMethod:      z.enum(['flood', 'furrow', 'sprinkler', 'drip']),
  state:              z.string(),
  districtId:         z.string().optional(),
  soilMoisturePct:    z.number().min(0).max(100).optional(), // from ESP32 / sim
});

// Water efficiency per method (liters per acre per season relative to flood = 1.0)
const METHOD_EFFICIENCY: Record<string, { efficiency: number; costPerAcre: number }> = {
  flood:     { efficiency: 1.00, costPerAcre: 2000  },
  furrow:    { efficiency: 0.85, costPerAcre: 2800  },
  sprinkler: { efficiency: 0.65, costPerAcre: 8000  },
  drip:      { efficiency: 0.45, costPerAcre: 15000 },
};

function recommend(
  soilType: string,
  cropType: string,
  stressIndex: number,
  soilMoisturePct?: number,
): 'drip' | 'sprinkler' | 'furrow' | 'flood' {
  // Critical stress or low soil moisture → drip (most efficient)
  if (stressIndex > 0.75 || (soilMoisturePct !== undefined && soilMoisturePct < 25)) return 'drip';
  // Sandy soils lose water fast → drip
  if (soilType === 'sandy') return 'drip';
  // Vegetables, fruits, cash crops → sprinkler or drip
  if (['vegetable', 'fruit'].includes(cropType)) return soilMoisturePct && soilMoisturePct < 40 ? 'drip' : 'sprinkler';
  // Moderate stress → sprinkler
  if (stressIndex > 0.50) return 'sprinkler';
  // Low stress, rice/cereal in clay/loam → furrow is acceptable
  if (['clay', 'black'].includes(soilType) && cropType === 'cereal') return 'furrow';
  return 'sprinkler';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = IrrigationSchema.parse(body);

    // Fetch crop data
    const crop = await prisma.cropWaterRequirement.findFirst({
      where: { cropName: { contains: data.cropName, mode: 'insensitive' } },
    });

    // Fetch district stress index
    const district = data.districtId
      ? await prisma.district.findUnique({ where: { id: data.districtId } })
      : await prisma.district.findFirst({ where: { state: data.state } });

    const stressIndex = district?.stressIndex ?? 0.5;
    const cropType    = crop?.cropType ?? 'cereal';

    const recommendedMethod = recommend(data.soilType, cropType, stressIndex, data.soilMoisturePct);

    const currentEff = METHOD_EFFICIENCY[data.currentMethod];
    const recEff     = METHOD_EFFICIENCY[recommendedMethod];

    // Water per acre per season (base from flood)
    const baseWaterPerAcre = crop?.waterPerAcre ?? 800_000; // default 800KL/acre

    const currentWater = baseWaterPerAcre * currentEff.efficiency * data.landAcres;
    const recWater     = baseWaterPerAcre * recEff.efficiency     * data.landAcres;
    const waterSaved   = Math.max(0, currentWater - recWater);

    // Cost savings over 5-year horizon (water cost ~₹5/KL municipal)
    const waterCostSaved = (waterSaved / 1000) * 5 * 5; // 5yr × ₹5/KL

    // Capital cost for upgrade
    const upgradeCost = (recEff.costPerAcre - currentEff.costPerAcre) * data.landAcres;
    const paybackYears = upgradeCost > 0 ? upgradeCost / ((waterSaved / 1000) * 5) : 0;

    return NextResponse.json({
      recommendedMethod,
      currentMethod:   data.currentMethod,
      stressIndex,
      crop: { name: crop?.cropName ?? data.cropName, type: cropType, season: crop?.season },
      savings: {
        waterLitersPerSeason: Math.round(waterSaved),
        waterKLPerSeason:     Math.round(waterSaved / 1000),
        costINROver5Years:    Math.round(waterCostSaved),
        upgradeCostINR:       Math.max(0, Math.round(upgradeCost)),
        paybackYears:         paybackYears > 0 ? Math.round(paybackYears * 10) / 10 : 0,
      },
      soilMoistureStatus: data.soilMoisturePct !== undefined
        ? data.soilMoisturePct < 25 ? 'dry' : data.soilMoisturePct < 50 ? 'adequate' : 'moist'
        : null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
