'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const STATES    = ['Maharashtra','Rajasthan','Tamil Nadu','Karnataka','Gujarat','Uttar Pradesh','Andhra Pradesh','West Bengal','Kerala','Haryana'];
const USE_CASES = ['residential','commercial','industrial','agricultural'] as const;
const SOURCES   = ['borewell','tanker','municipal','surface'] as const;

interface Rule {
  id: string;
  state: string;
  useCase: string;
  sourceType: string;
  ruleText: string;
  lawReference: string;
  rwhMandatory: boolean;
  permitRequired: boolean;
  cgwaZone: string | null;
}

const ZONE_BADGE: Record<string, string> = {
  'safe':           'bg-green-100 text-green-700',
  'semi-critical':  'bg-yellow-100 text-yellow-700',
  'critical':       'bg-orange-100 text-orange-700',
  'over-exploited': 'bg-red-100 text-red-700',
};

export default function LegalPage() {
  const [state,   setState]   = useState('Maharashtra');
  const [useCase, setUseCase] = useState<typeof USE_CASES[number]>('residential');
  const [source,  setSource]  = useState<typeof SOURCES[number]>('borewell');
  const [area,    setArea]    = useState(200); // sq.m.
  const [rules,   setRules]   = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/legal/${encodeURIComponent(state)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Not found');
      // Filter by use case and source type
      const filtered = (json.rules as Rule[]).filter(
        (r) =>
          (r.useCase === useCase || r.useCase === 'all') &&
          (r.sourceType === source || r.sourceType === 'all')
      );
      setRules(filtered.length > 0 ? filtered : json.rules); // fallback: show all for state
      setSearched(true);
    } catch (e: unknown) {
      setError((e as Error).message);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  // RWH catchment calculation
  const catchmentLiters = Math.round(area * 0.8 * 0.75 * 600); // area × runoff × efficiency × avg rainfall (600mm)

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Legal Compliance Checker</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Check applicable water laws, borewell permits, and rainwater harvesting mandates for your state.
      </p>

      <form onSubmit={handleSearch} className="rounded-xl border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">State</label>
            <select value={state} onChange={(e) => setState(e.target.value)}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background">
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Use case</label>
            <select value={useCase} onChange={(e) => setUseCase(e.target.value as typeof USE_CASES[number])}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background capitalize">
              {USE_CASES.map((u) => <option key={u} className="capitalize">{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Water source</label>
            <select value={source} onChange={(e) => setSource(e.target.value as typeof SOURCES[number])}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background capitalize">
              {SOURCES.map((s) => <option key={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Plot/building area (sq.m.)</label>
            <input type="number" min={1} value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="mt-1.5 w-full border rounded-md px-3 py-2 text-sm bg-background" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-aqua-600 text-white py-3 rounded-xl font-semibold hover:bg-aqua-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Check Compliance
        </button>
      </form>

      {searched && rules.length > 0 && (
        <div className="mt-8 space-y-5">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="capitalize text-xs font-medium bg-muted px-2 py-0.5 rounded">{rule.useCase}</span>
                <span className="capitalize text-xs font-medium bg-muted px-2 py-0.5 rounded">{rule.sourceType}</span>
                {rule.cgwaZone && (
                  <span className={`capitalize text-xs font-medium px-2 py-0.5 rounded ${ZONE_BADGE[rule.cgwaZone] ?? 'bg-muted'}`}>
                    CGWA: {rule.cgwaZone}
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed">{rule.ruleText}</p>

              <p className="text-xs text-muted-foreground font-mono border-l-2 border-muted pl-2">
                📜 {rule.lawReference}
              </p>

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  {rule.rwhMandatory
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <XCircle className="h-4 w-4 text-muted-foreground" />}
                  <span>RWH {rule.rwhMandatory ? 'Mandatory' : 'Optional'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {rule.permitRequired
                    ? <AlertTriangle className="h-4 w-4 text-orange-500" />
                    : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  <span>Permit {rule.permitRequired ? 'Required' : 'Not required'}</span>
                </div>
              </div>
            </div>
          ))}

          {/* RWH Calculator */}
          <div className="rounded-xl border p-5 bg-aqua-50/50 space-y-3">
            <h3 className="font-semibold text-aqua-800">🌧 Rainwater Harvesting Potential</h3>
            <p className="text-sm text-muted-foreground">
              For a {area} sq.m. building (assuming 600mm annual rainfall, 80% roof utilisation, 75% collection efficiency):
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Catchment area</p>
                <p className="font-bold text-lg">{Math.round(area * 0.8)} m²</p>
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Annual harvest</p>
                <p className="font-bold text-lg">{(catchmentLiters / 1000).toFixed(0)} KL</p>
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Daily equivalent</p>
                <p className="font-bold text-lg">{Math.round(catchmentLiters / 365)} L</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
