'use client';

import { useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { formatLiters } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface FootprintResult {
  totalPerDay: number;
  totalPerYear: number;
  nationalAvgPerDay: number;
  percentVsAvg: number;
  breakdown: { food: number; domestic: number; vehicle: number; agri: number };
  tips: string[];
}

const FOOD_OPTIONS = [
  'Rice', 'Wheat', 'Maize', 'Bajra', 'Lentils (Dal)', 'Chickpeas',
  'Potato', 'Tomato', 'Onion', 'Spinach', 'Mango', 'Banana',
  'Milk', 'Curd / Yogurt', 'Paneer', 'Chicken', 'Mutton / Goat', 'Fish', 'Eggs',
];

export default function CalculatorPage() {
  const [dietType,            setDietType]            = useState<'vegan'|'vegetarian'|'non-vegetarian'>('vegetarian');
  const [shower,              setShower]              = useState(10);
  const [baths,               setBaths]               = useState(1);
  const [laundry,             setLaundry]             = useState(2);
  const [flushes,             setFlushes]             = useState(6);
  const [dishwashing,         setDishwashing]         = useState<'hand'|'machine'>('hand');
  const [vehicle,             setVehicle]             = useState<'none'|'motorcycle'|'car'|'both'>('motorcycle');
  const [cropName,            setCropName]            = useState('');
  const [landAcres,           setLandAcres]           = useState(0);
  const [result,              setResult]              = useState<FootprintResult | null>(null);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/footprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietType,
          showerMinutesPerDay: shower,
          bathsPerWeek:        baths,
          laundryLoadsPerWeek: laundry,
          flushesPerDay:       flushes,
          dishwashingMethod:   dishwashing,
          vehicleType:         vehicle,
          cropName:            cropName || undefined,
          landAcres:           landAcres || undefined,
        }),
      });
      if (!res.ok) throw new Error('Calculation failed');
      setResult(await res.json());
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const donutData = result
    ? {
        labels: ['Food', 'Domestic', 'Vehicle', 'Agriculture'],
        datasets: [{
          data: [result.breakdown.food, result.breakdown.domestic, result.breakdown.vehicle, result.breakdown.agri],
          backgroundColor: ['#0ea5e9', '#22c55e', '#f97316', '#a855f7'],
          borderWidth: 2,
          borderColor: '#fff',
        }],
      }
    : null;

  const barData = result
    ? {
        labels: ['You', 'National Avg'],
        datasets: [{
          label: 'Water Footprint (L/day)',
          data:  [result.totalPerDay, result.nationalAvgPerDay],
          backgroundColor: [
            result.totalPerDay > result.nationalAvgPerDay ? '#ef4444' : '#22c55e',
            '#94a3b8',
          ],
          borderRadius: 6,
        }],
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Water Footprint Calculator</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Estimate your daily virtual water consumption based on diet, lifestyle, and farming activities.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Diet */}
        <section className="rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-base">🥗 Diet</h2>
          <div>
            <label className="text-sm font-medium">Diet Type</label>
            <div className="flex gap-3 mt-2">
              {(['vegan', 'vegetarian', 'non-vegetarian'] as const).map((d) => (
                <button
                  key={d} type="button"
                  onClick={() => setDietType(d)}
                  className={`px-4 py-1.5 rounded-full text-sm border font-medium transition-colors capitalize ${
                    dietType === d
                      ? 'bg-aqua-600 text-white border-aqua-600'
                      : 'border-border text-muted-foreground hover:border-aqua-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Domestic */}
        <section className="rounded-xl border p-5 space-y-5">
          <h2 className="font-semibold text-base">🚿 Domestic Usage</h2>
          <SliderField label="Shower duration" value={shower} min={0} max={60} step={1}
            unit="min/day" onChange={setShower} />
          <SliderField label="Baths per week" value={baths} min={0} max={14} step={1}
            unit="baths/wk" onChange={setBaths} />
          <SliderField label="Laundry loads per week" value={laundry} min={0} max={14} step={1}
            unit="loads/wk" onChange={setLaundry} />
          <SliderField label="Toilet flushes per day" value={flushes} min={0} max={20} step={1}
            unit="flushes" onChange={setFlushes} />
          <div>
            <label className="text-sm font-medium">Dishwashing method</label>
            <div className="flex gap-3 mt-2">
              {(['hand', 'machine'] as const).map((m) => (
                <button key={m} type="button"
                  onClick={() => setDishwashing(m)}
                  className={`px-4 py-1.5 rounded-full text-sm border capitalize font-medium transition-colors ${
                    dishwashing === m
                      ? 'bg-aqua-600 text-white border-aqua-600'
                      : 'border-border text-muted-foreground hover:border-aqua-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Vehicle */}
        <section className="rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-base">🚗 Vehicle / Mobility</h2>
          <div className="flex flex-wrap gap-3">
            {(['none', 'motorcycle', 'car', 'both'] as const).map((v) => (
              <button key={v} type="button"
                onClick={() => setVehicle(v)}
                className={`px-4 py-1.5 rounded-full text-sm border capitalize font-medium transition-colors ${
                  vehicle === v
                    ? 'bg-aqua-600 text-white border-aqua-600'
                    : 'border-border text-muted-foreground hover:border-aqua-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </section>

        {/* Agriculture (optional) */}
        <section className="rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-base">🌾 Agriculture <span className="text-muted-foreground font-normal text-sm">(optional)</span></h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Crop</label>
              <select value={cropName} onChange={(e) => setCropName(e.target.value)}
                className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="">None</option>
                {['Rice','Wheat','Sugarcane','Cotton','Maize','Soybean','Tomato','Potato','Onion','Banana','Mango','Groundnut'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Land area (acres)</label>
              <input type="number" min={0} step={0.5} value={landAcres || ''}
                onChange={(e) => setLandAcres(Number(e.target.value))}
                className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background"
                placeholder="0" />
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-aqua-600 text-white py-3 rounded-xl font-semibold hover:bg-aqua-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Calculate My Water Footprint
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Daily Footprint" value={formatLiters(result.totalPerDay)} sub="per day" />
            <StatCard label="Annual Footprint" value={formatLiters(result.totalPerYear)} sub="per year" />
            <StatCard
              label="vs National Avg"
              value={`${result.percentVsAvg}%`}
              sub={result.percentVsAvg > 100 ? '⬆ above average' : '⬇ below average'}
              highlight={result.percentVsAvg > 130 ? 'red' : result.percentVsAvg < 80 ? 'green' : 'yellow'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Breakdown by Category</h3>
              <div className="h-56">
                <Doughnut data={donutData!} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Compared to National Average</h3>
              <div className="h-56">
                <Bar data={barData!} options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, title: { display: true, text: 'Litres/day' } } },
                }} />
              </div>
            </div>
          </div>

          {result.tips.length > 0 && (
            <div className="rounded-xl border p-5 bg-aqua-50/50">
              <h3 className="font-semibold mb-3 text-aqua-800">💡 Reduction Tips</h3>
              <ul className="space-y-2">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-aqua-900">
                    <span className="mt-0.5 text-aqua-500">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SliderField({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <label className="font-medium">{label}</label>
        <span className="text-muted-foreground">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-aqua-500" />
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: {
  label: string; value: string; sub: string; highlight?: 'red'|'green'|'yellow'
}) {
  const colors = {
    red:    'border-red-200 bg-red-50',
    green:  'border-green-200 bg-green-50',
    yellow: 'border-yellow-200 bg-yellow-50',
  };
  return (
    <div className={`rounded-xl border p-4 ${highlight ? colors[highlight] : 'bg-card'}`}>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
