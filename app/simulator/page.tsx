'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface SimParams {
  tariff:          number; // ₹/KL
  agriSubsidy:     number; // %
  industrialCap:   number; // ML/day
  monsoonDeviation: number; // % deviation from average
}

interface ScenarioPoint {
  consumption: number; // KL/household/month
  demand:      number; // million households served
  revenue:     number; // ₹ crore/month
  equity:      number; // 0–1 (1 = perfectly equitable)
}

function computePoints(p: SimParams): ScenarioPoint[] {
  const points: ScenarioPoint[] = [];
  // Demand elasticity: price elasticity of water demand ≈ -0.4 (inelastic)
  const baseConsumption = 18; // KL/household/month at ₹5/KL
  const baseTariff      = 5;
  const elasticity      = -0.4;

  for (let tariff = 1; tariff <= 30; tariff++) {
    const pctChange      = (tariff - baseTariff) / baseTariff;
    const consumption    = Math.max(5, baseConsumption * (1 + elasticity * pctChange));
    // Monsoon affects supply: negative deviation → scarcity → reduce served households
    const supplyFactor   = 1 + (p.monsoonDeviation / 100) * 0.3;
    const demand         = Math.max(0, (1000 - tariff * 12) * supplyFactor * (1 + p.industrialCap / 200));
    const revenue        = (tariff * consumption * demand) / 100_000; // ₹ crore
    // Equity: high subsidy improves equity; high tariff reduces it
    const equity         = Math.min(1, Math.max(0, 0.7 + (p.agriSubsidy / 200) - (tariff / 60)));
    points.push({ consumption, demand, revenue, equity });
  }
  return points;
}

interface SavedScenario {
  name:   string;
  params: SimParams;
}

export default function SimulatorPage() {
  const [params, setParams] = useState<SimParams>({
    tariff:           5,
    agriSubsidy:      30,
    industrialCap:    50,
    monsoonDeviation: 0,
  });
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const points = computePoints(params);

  // D3 chart
  useEffect(() => {
    if (!svgRef.current) return;
    const svg    = d3.select(svgRef.current);
    const width  = svgRef.current.clientWidth || 600;
    const height = 280;
    const margin = { top: 20, right: 60, bottom: 40, left: 55 };

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const xScale = d3.scaleLinear().domain([1, 30]).range([margin.left, width - margin.right]);
    const yLeft  = d3.scaleLinear()
      .domain([0, d3.max(points, (d) => d.consumption)! * 1.15])
      .range([height - margin.bottom, margin.top]);
    const yRight = d3.scaleLinear()
      .domain([0, d3.max(points, (d) => d.revenue)! * 1.15])
      .range([height - margin.bottom, margin.top]);

    // Axes
    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat((d) => `₹${d}`));
    svg.append('g').attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yLeft).ticks(5).tickFormat((d) => `${d}KL`));
    svg.append('g').attr('transform', `translate(${width - margin.right},0)`)
      .call(d3.axisRight(yRight).ticks(5).tickFormat((d) => `₹${d}Cr`));

    // Area — consumption
    const areaConsumption = d3.area<ScenarioPoint>()
      .x((_, i) => xScale(i + 1))
      .y0(height - margin.bottom)
      .y1((d) => yLeft(d.consumption))
      .curve(d3.curveCatmullRom);

    svg.append('path')
      .datum(points)
      .attr('d', areaConsumption)
      .attr('fill', '#0ea5e940')
      .attr('stroke', '#0ea5e9')
      .attr('stroke-width', 2);

    // Line — revenue
    const lineRevenue = d3.line<ScenarioPoint>()
      .x((_, i) => xScale(i + 1))
      .y((d) => yRight(d.revenue))
      .curve(d3.curveCatmullRom);

    svg.append('path')
      .datum(points)
      .attr('d', lineRevenue)
      .attr('fill', 'none')
      .attr('stroke', '#f97316')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5 3');

    // Current tariff marker
    const cx = xScale(params.tariff);
    svg.append('line')
      .attr('x1', cx).attr('x2', cx)
      .attr('y1', margin.top).attr('y2', height - margin.bottom)
      .attr('stroke', '#6366f1').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 2');

    // Legend
    const leg = svg.append('g').attr('transform', `translate(${margin.left + 10},${margin.top + 5})`);
    leg.append('rect').attr('width', 12).attr('height', 12).attr('fill', '#0ea5e940').attr('stroke', '#0ea5e9');
    leg.append('text').attr('x', 16).attr('y', 10).attr('font-size', 11).text('Consumption (KL/household/month)');
    const leg2 = svg.append('g').attr('transform', `translate(${margin.left + 10},${margin.top + 22})`);
    leg2.append('line').attr('x1', 0).attr('x2', 12).attr('y1', 6).attr('y2', 6)
      .attr('stroke', '#f97316').attr('stroke-width', 2).attr('stroke-dasharray', '5 3');
    leg2.append('text').attr('x', 16).attr('y', 10).attr('font-size', 11).text('Revenue (₹ Crore/month)');
  }, [points, params.tariff]);

  function saveScenario() {
    if (!scenarioName.trim() || scenarios.length >= 3) return;
    setScenarios((prev) => [...prev, { name: scenarioName.trim(), params: { ...params } }]);
    setScenarioName('');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Policy Economics Simulator</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Explore how water tariff, subsidies and allocations affect demand, utility revenue and equity.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders */}
        <div className="rounded-xl border p-5 space-y-6">
          <h2 className="font-semibold">Policy Parameters</h2>

          <SimSlider label="Water tariff" min={1} max={30} step={1}
            value={params.tariff} unit="₹/KL"
            onChange={(v) => setParams((p) => ({ ...p, tariff: v }))} />
          <SimSlider label="Agriculture subsidy" min={0} max={80} step={5}
            value={params.agriSubsidy} unit="%"
            onChange={(v) => setParams((p) => ({ ...p, agriSubsidy: v }))} />
          <SimSlider label="Industrial cap" min={10} max={200} step={10}
            value={params.industrialCap} unit="ML/day"
            onChange={(v) => setParams((p) => ({ ...p, industrialCap: v }))} />
          <SimSlider label="Monsoon deviation" min={-40} max={40} step={5}
            value={params.monsoonDeviation} unit="%"
            onChange={(v) => setParams((p) => ({ ...p, monsoonDeviation: v }))} />

          {/* Save scenario */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">Save scenario ({scenarios.length}/3)</p>
            <div className="flex gap-2">
              <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Scenario name" maxLength={20}
                className="flex-1 border rounded-md px-2 py-1.5 text-sm bg-background" />
              <button onClick={saveScenario} disabled={!scenarioName.trim() || scenarios.length >= 3}
                className="bg-aqua-600 text-white text-sm px-3 rounded-md disabled:opacity-50">
                Save
              </button>
            </div>
            {scenarios.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-xs bg-muted rounded px-2 py-1">
                <button onClick={() => setParams(s.params)} className="font-medium hover:underline text-aqua-700">
                  {s.name}
                </button>
                <button onClick={() => setScenarios((prev) => prev.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">Demand & Revenue Curve</h2>
          <svg ref={svgRef} className="w-full" style={{ height: 280 }} />
          <p className="text-xs text-muted-foreground text-center">
            X-axis: water tariff (₹/KL) · Blue area: household consumption · Orange dashed: utility revenue ·
            Purple line: current tariff setting
          </p>

          {/* Key metrics at current tariff */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            {[
              { label: 'Consumption', val: `${points[params.tariff - 1]?.consumption.toFixed(1)} KL/mo` },
              { label: 'Revenue',     val: `₹${points[params.tariff - 1]?.revenue.toFixed(0)}Cr/mo` },
              { label: 'Equity Index',val: `${(points[params.tariff - 1]?.equity * 100).toFixed(0)}%` },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="font-bold">{m.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimSlider({ label, min, max, step, value, unit, onChange }: {
  label: string; min: number; max: number; step: number;
  value: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-aqua-500" />
    </div>
  );
}
