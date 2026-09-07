'use client';

import { useSensorStore } from '@/store/sensorStore';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Zap, ZapOff, Droplets, Container, Activity } from 'lucide-react';

function GaugeBar({ value, max = 100, colorClass }: { value: number; max?: number; colorClass: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-700', colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function LiveLocalWidget() {
  const { reading, simMode, connected, pumpEnabled, threshold, setSimMode, setPumpEnabled, setThreshold } =
    useSensorStore();

  const moistureColor =
    !reading ? 'bg-muted'
    : reading.soilMoisturePct < 25 ? 'bg-red-500'
    : reading.soilMoisturePct < 45 ? 'bg-yellow-400'
    : 'bg-green-500';

  const tankColor =
    !reading ? 'bg-muted'
    : reading.tankLevelPct < 20 ? 'bg-red-500'
    : reading.tankLevelPct < 50 ? 'bg-yellow-400'
    : 'bg-aqua-500';

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 w-full max-w-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-aqua-500" />
          Live Local Water Status
        </h3>
        <div className="flex items-center gap-2">
          {/* Sim mode toggle */}
          <button
            onClick={() => setSimMode(!simMode)}
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium transition-colors',
              simMode
                ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                : 'bg-aqua-100 border-aqua-300 text-aqua-700'
            )}
          >
            {simMode ? '⚡ Simulated' : '📡 Live'}
          </button>
          {/* Connection indicator */}
          {connected
            ? <Wifi className="h-4 w-4 text-green-500" />
            : <WifiOff className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {reading ? (
        <>
          {/* Soil Moisture */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />Soil Moisture</span>
              <span className="font-semibold text-foreground">{reading.soilMoisturePct.toFixed(1)}%</span>
            </div>
            <GaugeBar value={reading.soilMoisturePct} colorClass={moistureColor} />
            <p className="text-[10px] text-muted-foreground">
              {reading.soilMoisturePct < 25 ? '🔴 Dry — irrigation needed'
               : reading.soilMoisturePct < 45 ? '🟡 Adequate'
               : '🟢 Well-moistured'}
            </p>
          </div>

          {/* Tank Level */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Container className="h-3.5 w-3.5" />Tank Level</span>
              <span className="font-semibold text-foreground">{reading.tankLevelPct.toFixed(1)}%</span>
            </div>
            <GaugeBar value={reading.tankLevelPct} colorClass={tankColor} />
          </div>

          {/* Flow Rate */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />Flow Rate
            </span>
            <span className="font-semibold">{reading.flowRateLpm.toFixed(1)} L/min</span>
          </div>

          {/* Cumulative volume */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Total used today</span>
            <span className="font-semibold">{reading.cumulativeVolumeLiters.toFixed(1)} L</span>
          </div>

          {/* Pump status */}
          <div className="flex items-center gap-2 rounded-lg border p-2 bg-muted/40">
            {reading.pumpActive
              ? <Zap className="h-4 w-4 text-green-500 animate-pulse" />
              : <ZapOff className="h-4 w-4 text-muted-foreground" />}
            <span className="text-xs font-medium flex-1">
              Pump {reading.pumpActive ? 'ON — irrigating' : 'OFF'}
            </span>
            <button
              onClick={() => setPumpEnabled(!pumpEnabled)}
              className={cn(
                'text-[11px] px-2 py-0.5 rounded border font-medium transition-colors',
                pumpEnabled
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              {pumpEnabled ? 'Auto ON' : 'Auto OFF'}
            </button>
          </div>

          {/* Threshold slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Trigger threshold</span>
              <span className="font-medium text-foreground">{threshold}% moisture</span>
            </div>
            <input
              type="range" min={10} max={60} step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-aqua-500"
            />
          </div>
        </>
      ) : (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {simMode ? 'Generating sensor data…' : 'Waiting for ESP32…'}
        </div>
      )}

      {reading?.recordedAt && (
        <p className="text-[10px] text-muted-foreground text-right">
          Updated {new Date(reading.recordedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
