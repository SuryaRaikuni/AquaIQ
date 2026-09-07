import { MapPanel } from '@/components/dashboard/MapPanel';
import { LiveLocalWidget } from '@/components/sensor/LiveLocalWidget';
import { SensorProvider } from '@/components/sensor/SensorProvider';
import { prisma } from '@/lib/prisma';

async function getDistricts(state?: string) {
  return prisma.district.findMany({
    where: state ? { state } : undefined,
    orderBy: { stressIndex: 'desc' },
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { state?: string; season?: string };
}) {
  const districts = await getDistricts(searchParams.state);

  const stateList = [
    'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Karnataka',
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <SensorProvider />

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Water Stress Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          District-level groundwater stress index across India — based on CGWB + WRI Aqueduct data.
        </p>
      </div>

      {/* Filter bar */}
      <form className="flex flex-wrap gap-3 items-center">
        <select
          name="state"
          defaultValue={searchParams.state ?? ''}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All States</option>
          {stateList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="season"
          defaultValue={searchParams.season ?? ''}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value="">All Seasons</option>
          <option value="kharif">Kharif (Jun–Oct)</option>
          <option value="rabi">Rabi (Nov–Apr)</option>
          <option value="summer">Summer (Apr–Jun)</option>
        </select>
        <button
          type="submit"
          className="bg-aqua-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-aqua-700 transition-colors"
        >
          Apply
        </button>
        {(searchParams.state || searchParams.season) && (
          <a href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            Clear filters
          </a>
        )}
      </form>

      {/* Main layout: map + widget side-by-side on large screens */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <MapPanel districts={districts} />
        </div>
        <div className="lg:w-80 flex-shrink-0">
          <LiveLocalWidget />
        </div>
      </div>

      {/* District table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">District Stress Index — All Regions</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-medium">District</th>
                <th className="px-4 py-2.5 font-medium">State</th>
                <th className="px-4 py-2.5 font-medium">Stress</th>
                <th className="px-4 py-2.5 font-medium">GW Level (m BGL)</th>
                <th className="px-4 py-2.5 font-medium">Rainfall (mm/yr)</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {districts.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{d.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.state}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-xs font-medium"
                      style={{ background: getStressColor(d.stressIndex) }}
                    >
                      {getStressLabel(d.stressIndex)} · {d.stressIndex.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{d.groundwaterLevel}</td>
                  <td className="px-4 py-2.5">{d.rainfallAvg}</td>
                  <td className="px-4 py-2.5 capitalize">{d.dominantSource}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      d.dataQuality === 'real'         ? 'bg-green-100 text-green-700'
                      : d.dataQuality === 'interpolated' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {d.dataQuality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getStressColor(i: number) {
  if (i < 0.35) return '#22c55e';
  if (i < 0.55) return '#84cc16';
  if (i < 0.70) return '#eab308';
  if (i < 0.85) return '#f97316';
  return '#ef4444';
}
function getStressLabel(i: number) {
  if (i < 0.35) return 'Low';
  if (i < 0.55) return 'Low-Mod';
  if (i < 0.70) return 'Moderate';
  if (i < 0.85) return 'High';
  return 'Critical';
}
