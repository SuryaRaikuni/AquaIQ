import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SensorSchema = z.object({
  device_id:                  z.string(),
  api_key:                    z.string(),
  timestamp:                  z.string().optional(),
  soil_moisture_pct:          z.number().min(0).max(100),
  tank_level_pct:             z.number().min(0).max(100),
  flow_rate_lpm:              z.number().min(0),
  cumulative_volume_liters:   z.number().min(0),
  pump_active:                z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = SensorSchema.parse(body);

    // Validate API key
    if (data.api_key !== process.env.ESP32_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure device exists (upsert)
    await prisma.sensorDevice.upsert({
      where:  { deviceId: data.device_id },
      update: { registeredAt: new Date() },
      create: { deviceId: data.device_id, label: data.device_id },
    });

    // Insert reading
    await prisma.sensorReading.create({
      data: {
        deviceId:              data.device_id,
        soilMoisturePct:       data.soil_moisture_pct,
        tankLevelPct:          data.tank_level_pct,
        flowRateLpm:           data.flow_rate_lpm,
        cumulativeVolumeLiters: data.cumulative_volume_liters,
        pumpActive:            data.pump_active ?? false,
      },
    });

    // Read pump command from user settings (if device has an owner)
    const device = await prisma.sensorDevice.findUnique({
      where: { deviceId: data.device_id },
      include: { owner: { include: { settings: true } } },
    });

    const settings = device?.owner?.settings;

    return NextResponse.json({
      status: 'ok',
      pump_command:          settings?.pumpEnabled ?? false,
      moisture_threshold:    settings?.moistureThreshold ?? 30.0,
      pump_duration_seconds: 60,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Bad payload', details: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
