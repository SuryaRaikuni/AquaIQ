'use client';

import { useState } from 'react';
import { useSensorStore } from '@/store/sensorStore';
import { formatLiters, formatINR } from '@/lib/utils';
import { Loader2, Droplets, Info } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CROPS    = ['Rice','Wheat','Sugarcane','Cotton','Maize','Soybean','Tomato','Potato','Onion','Banana','Mango','Groundnut'];
const SOILS    = ['loamy','sandy','clay','red','black'] as const;
const METHODS  = ['flood','furrow','sprinkler','drip'] as const;
const STATES   = ['Maharashtra','Rajasthan','Tamil Nadu','Karnataka','Gujarat','Uttar Pradesh','Andhra Pradesh','West Bengal','Kerala','Haryana'];
const SCHEMES  = [
  { name: 'PM Krishi Sinchai Yojana (PMKSY)',  url: 'https://pmksy.gov.in/',          desc: '55% subsidy on drip/sprinkler systems for small farmers' },
  { name: 'National Mission on Micro Irrigation', url: 'https://nmmi.gov.in/',          desc: 'Subsidies and technical support for micro-irrigation adoption' },
  { name: 'RKVY – Agri Infrastructure Fund',   url: 'https://rkvy.nic.in/',           desc: 'Loans at 3% for farm infrastructure including irrigation' },
];

interface IrrigationResult {
  recommendedMethod: string;
  currentMethod:     string;
  stressIndex:       number;
  crop:              { name: string; type: string; season: string };
  savings: {
    waterLitersPerSeason:  number;
    waterKLPerSeason:      number;
    costINROver5Years:     number;
    upgradeCostINR:        number;
    paybackYears:          number;
  };
  soilMoistureStatus: string | null;
}

export default function IrrigationPage() {
  const { reading, simMode } = useSensorStore();

  const [crop,    setCrop]    = useState('Rice');
  const [acres,   setAcres]   = useState(2);
  const [soil,    setSoil]    = useState<typeof SOILS[number]>('loamy');
  const [method,  setMethod]  = useState<typeof METHODS[number]>('flood');
  const [state,   setState]   = useState('Maharashtra');
  const [result,  setResult]  = useState<IrrigationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Auto-fill from sensor
  const liveMoisture = reading?.soilMoisturePct;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/irrigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName:        crop,
          landAcres:       acres,
          soilType:        soil,
          currentMethod:   method,
          state,
          soilMoisturePct: liveMoisture,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setResult(await res.json());
    } catch {
      setError('Calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const savingsBar = result
    ? {
        labels: ['Current Method', 'Recommended'],
        datasets: [{
          label: 'Water use (KL/season)',
          data: [
            Math.round((result.savings.waterKLPerSeason + result.savings.waterKLPerSeason) / (1 - (result.savings.waterLitersPerSeason / (result.savings.waterLitersPerSeason + result.savings.waterKLPerSeason * 1000)))),
            result.savings.waterKLPerSeason,
          ],
          backgroundColor: ['#f97316', '#22c55e'],
          borderRadius: 6,
        }],
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Irrigation Advisor</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Get optimised irrigation method recommendations with water and cost savings analysis.
      </p>

      {/* Live sensor badge */}
      {liveMoisture !== undefined && (
        <div className="mb-6 flex items-center gap-2 text-sm bg-aqua-50 border border-aqua-200 text-aqua-800 rounded-lg px-4 py-2.5">
          <Droplets className="h-4 w-4 text-aqua-500" />
          <span>
            {simMode ? '⚡ Simulated' : '📡 Live'} soil moisture:{' '}
            <strong>{liveMoisture.toFixed(1)}%</strong> — auto-factored into recommendation
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Crop</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background">
              {CROPS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Land area (acres)</label>
            <input type="number" min={0.1} step={0.5} value={acres}
              onChange={(e) => setAcres(Number(e.target.value))}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="text-sm font-medium">Soil type</label>
            <select value={soil} onChange={(e) => setSoil(e.target.value as typeof SOILS[number])}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background capitalize">
              {SOILS.map((s) => <option key={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Current irrigation method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof METHODS[number])}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background capitalize">
              {METHODS.map((m) => <option key={m} className="capitalize">{m}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">State</label>
            <select value={state} onChange={(e) => setState(e.target.value)}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background">
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-aqua-600 text-white py-3 rounded-xl font-semibold hover:bg-aqua-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Get Recommendation
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          {/* Recommendation card */}
          <div className="rounded-xl border-2 border-green-300 bg-green-50 p-6">
            <p className="text-sm text-green-700 font-medium mb-1">Recommended Method</p>
            <p className="text-3xl font-bold text-green-800 capitalize">{result.recommendedMethod}</p>
            {result.currentMethod === result.recommendedMethod && (
              <p className="text-sm text-green-600 mt-1">✅ You&apos;re already using the optimal method!</p>
            )}
            {result.soilMoistureStatus && (
              <p className="text-sm text-muted-foreground mt-2">
                Soil moisture status: <strong className="capitalize">{result.soilMoistureStatus}</strong>
              </p>
            )}
          </div>

          {/* Savings cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SavCard label="Water saved/season" value={formatLiters(result.savings.waterLitersPerSeason)} />
            <SavCard label="Cost saved (5yr)"   value={formatINR(result.savings.costINROver5Years)} />
            <SavCard label="Upgrade cost"        value={formatINR(result.savings.upgradeCostINR)} />
            <SavCard label="Payback period"      value={result.savings.paybackYears > 0 ? `${result.savings.paybackYears} yrs` : 'Immediate'} />
          </div>

          {/* Gov schemes */}
          <div className="rounded-xl border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-aqua-500" /> Applicable Subsidy Schemes
            </h3>
            <div className="space-y-3">
              {SCHEMES.map((s) => (
                <div key={s.name} className="text-sm">
                  <a href={s.url} target="_blank" rel="noreferrer"
                    className="font-medium text-aqua-700 hover:underline">{s.name}</a>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SavCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4 bg-card text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
