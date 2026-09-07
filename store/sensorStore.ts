import { create } from 'zustand';

export interface SensorReading {
  soilMoisturePct:      number;
  tankLevelPct:         number;
  flowRateLpm:          number;
  cumulativeVolumeLiters: number;
  pumpActive:           boolean;
  recordedAt?:          string;
}

interface SensorStore {
  simMode:     boolean;
  connected:   boolean;
  reading:     SensorReading | null;
  pumpEnabled: boolean;
  threshold:   number;

  setSimMode:     (v: boolean)         => void;
  setConnected:   (v: boolean)         => void;
  setReading:     (r: SensorReading)   => void;
  setPumpEnabled: (v: boolean)         => void;
  setThreshold:   (v: number)          => void;
}

export const useSensorStore = create<SensorStore>((set) => ({
  simMode:     true,
  connected:   false,
  reading:     null,
  pumpEnabled: false,
  threshold:   30,

  setSimMode:     (v) => set({ simMode: v }),
  setConnected:   (v) => set({ connected: v }),
  setReading:     (r) => set({ reading: r }),
  setPumpEnabled: (v) => set({ pumpEnabled: v }),
  setThreshold:   (v) => set({ threshold: v }),
}));
