'use client';

import { useEffect, useRef } from 'react';
import { useSensorStore } from '@/store/sensorStore';
import type { SensorReading } from '@/store/sensorStore';

/** Generates a realistic sine-wave mock sensor reading */
function mockReading(t: number): SensorReading {
  const moisture = 45 + 20 * Math.sin(t / 30) + (Math.random() - 0.5) * 4;
  const tank     = 60 + 15 * Math.cos(t / 60) + (Math.random() - 0.5) * 2;
  const flow     = Math.max(0, 1.2 + 0.5 * Math.sin(t / 20) + (Math.random() - 0.5) * 0.3);
  return {
    soilMoisturePct:        Math.min(100, Math.max(0, moisture)),
    tankLevelPct:           Math.min(100, Math.max(0, tank)),
    flowRateLpm:            Math.round(flow * 10) / 10,
    cumulativeVolumeLiters: Math.round(flow * t * 0.5),
    pumpActive:             moisture < 28,
    recordedAt:             new Date().toISOString(),
  };
}

/**
 * Invisible component that manages the SSE connection (live mode)
 * or drives the simulated sensor stream.
 * Mount this once at the dashboard/app level.
 */
export function SensorProvider({ deviceId = 'ESP32_AQUAIQ_001' }: { deviceId?: string }) {
  const { simMode, setReading, setConnected } = useSensorStore();
  const tRef  = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (simMode) {
      // Simulated mode: update every 3s with sine-wave data
      setConnected(true);
      const id = setInterval(() => {
        tRef.current += 3;
        setReading(mockReading(tRef.current));
      }, 3000);
      setReading(mockReading(0)); // immediate first reading
      return () => clearInterval(id);
    } else {
      // Live mode: SSE from /api/live-status
      setConnected(false);
      const es = new EventSource(`/api/live-status?device_id=${deviceId}`);
      esRef.current = es;

      es.onopen    = () => setConnected(true);
      es.onerror   = () => setConnected(false);
      es.onmessage = (e) => {
        try {
          const r = JSON.parse(e.data) as SensorReading;
          setReading(r);
          setConnected(true);
        } catch { /* ignore malformed frames */ }
      };

      return () => { es.close(); setConnected(false); };
    }
  }, [simMode, deviceId, setReading, setConnected]);

  return null; // renders nothing
}
