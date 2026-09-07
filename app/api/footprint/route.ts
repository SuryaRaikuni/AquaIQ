import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ─── Request schema ───────────────────────────────────────────────────────────
const FootprintSchema = z.object({
  // Diet
  dietType:        z.enum(['vegan', 'vegetarian', 'non-vegetarian']),
  foodItems: z.array(z.object({
    foodName: z.string(),
    gramsPerDay: z.number().positive(),
  })).optional(),

  // Domestic
  showerMinutesPerDay: z.number().min(0).max(120),
  bathsPerWeek:        z.number().min(0).max(14),
  laundryLoadsPerWeek: z.number().min(0).max(14),
  flushesPerDay:       z.number().min(0).max(50),
  dishwashingMethod:   z.enum(['hand', 'machine']),

  // Mobility
  vehicleType: z.enum(['none', 'motorcycle', 'car', 'both']),

  // Agriculture (optional)
  cropName:   z.string().optional(),
  landAcres:  z.number().optional(),
});

// Domestic water benchmarks (liters/unit)
const DOMESTIC = {
  showerPerMinute:    8,
  bathPerSession:     150,
  laundryPerLoad:     80,
  flushPerFlush:      6,
  dishwashingHand:    15,   // per meal
  dishwashingMachine: 10,   // per load
};

// Indirect water (virtual) in liters/day for vehicle manufacturing amortised
const VEHICLE = {
  none:       0,
  motorcycle: 55,
  car:        120,
  both:       175,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = FootprintSchema.parse(body);

    // ── 1. Food footprint ────────────────────────────────────────────────────
    let foodLitersPerDay = 0;

    if (data.foodItems && data.foodItems.length > 0) {
      // User specified individual foods
      const names = data.foodItems.map((f) => f.foodName);
      const vwcRows = await prisma.foodVwc.findMany({
        where: { foodName: { in: names } },
      });
      const vwcMap = Object.fromEntries(vwcRows.map((r) => [r.foodName, r.vwcLitersPer100g]));
      for (const item of data.foodItems) {
        const vwc = vwcMap[item.foodName] ?? 0;
        foodLitersPerDay += (item.gramsPerDay / 100) * vwc;
      }
    } else {
      // Fall back to diet-type averages (IWMI benchmarks)
      const dietDefaults: Record<string, number> = {
        vegan:          2000,
        vegetarian:     2500,
        'non-vegetarian': 4000,
      };
      foodLitersPerDay = dietDefaults[data.dietType] ?? 2500;
    }

    // ── 2. Domestic footprint ────────────────────────────────────────────────
    const showerL  = data.showerMinutesPerDay * DOMESTIC.showerPerMinute;
    const bathL    = (data.bathsPerWeek / 7) * DOMESTIC.bathPerSession;
    const laundryL = (data.laundryLoadsPerWeek / 7) * DOMESTIC.laundryPerLoad;
    const flushL   = data.flushesPerDay * DOMESTIC.flushPerFlush;
    const dishL    = data.dishwashingMethod === 'machine'
      ? (data.laundryLoadsPerWeek / 7) * DOMESTIC.dishwashingMachine * 3 // ~3 machine loads/day equiv
      : DOMESTIC.dishwashingHand * 3; // 3 meals
    const domesticLitersPerDay = showerL + bathL + laundryL + flushL + dishL;

    // ── 3. Vehicle indirect footprint ────────────────────────────────────────
    const vehicleLitersPerDay = VEHICLE[data.vehicleType];

    // ── 4. Agricultural footprint (optional) ─────────────────────────────────
    let agriLitersPerDay = 0;
    if (data.cropName && data.landAcres) {
      const crop = await prisma.cropWaterRequirement.findFirst({
        where: { cropName: { contains: data.cropName, mode: 'insensitive' } },
      });
      if (crop) {
        // Convert seasonal water per acre to daily
        const daysInSeason = crop.season === 'annual' ? 365 : 120;
        agriLitersPerDay = (data.landAcres * crop.waterPerAcre) / daysInSeason;
      }
    }

    // ── 5. Total ─────────────────────────────────────────────────────────────
    const totalPerDay = foodLitersPerDay + domesticLitersPerDay + vehicleLitersPerDay + agriLitersPerDay;
    const totalPerYear = totalPerDay * 365;

    // National average ~3,800 L/day (IWMI India estimate)
    const nationalAvgPerDay = 3800;

    return NextResponse.json({
      totalPerDay: Math.round(totalPerDay),
      totalPerYear: Math.round(totalPerYear),
      nationalAvgPerDay,
      percentVsAvg: Math.round((totalPerDay / nationalAvgPerDay) * 100),
      breakdown: {
        food:     Math.round(foodLitersPerDay),
        domestic: Math.round(domesticLitersPerDay),
        vehicle:  Math.round(vehicleLitersPerDay),
        agri:     Math.round(agriLitersPerDay),
      },
      tips: generateTips(data, { food: foodLitersPerDay, domestic: domesticLitersPerDay }),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function generateTips(
  data: z.infer<typeof FootprintSchema>,
  breakdown: { food: number; domestic: number }
): string[] {
  const tips: string[] = [];
  if (data.dietType === 'non-vegetarian') {
    tips.push('Replacing one meat meal per week with a plant-based meal can save ~500 litres/day.');
  }
  if (data.showerMinutesPerDay > 10) {
    tips.push(`Reducing your shower by 5 minutes saves ~${5 * 8} litres/day.`);
  }
  if (data.laundryLoadsPerWeek > 3) {
    tips.push('Running full laundry loads and using cold water saves water and energy.');
  }
  if (data.vehicleType !== 'none') {
    tips.push('Carpooling or using public transport reduces your indirect (virtual) water footprint.');
  }
  if (breakdown.domestic > 200) {
    tips.push('Installing low-flow fixtures (showerheads, dual-flush toilets) can cut domestic use by 30%.');
  }
  tips.push('Collecting rainwater for gardening and toilet flushing can offset 20–40% of household needs.');
  return tips;
}
