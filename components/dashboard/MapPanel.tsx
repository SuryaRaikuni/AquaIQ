'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { stressColor, stressLabel } from '@/lib/utils';

// Leaflet must be loaded client-side only
const MapContainer   = dynamic(() => import('react-leaflet').then((m) => m.MapContainer),   { ssr: false });
const TileLayer      = dynamic(() => import('react-leaflet').then((m) => m.TileLayer),      { ssr: false });
const GeoJSON        = dynamic(() => import('react-leaflet').then((m) => m.GeoJSON),        { ssr: false });
const Tooltip        = dynamic(() => import('react-leaflet').then((m) => m.Tooltip),        { ssr: false });

export interface DistrictData {
  id:               string;
  name:             string;
  state:            string;
  stressIndex:      number;
  groundwaterLevel: number;
  rainfallAvg:      number;
  dominantSource:   string;
  dataQuality:      string;
  geojson:          unknown;
}

interface MapPanelProps {
  districts: DistrictData[];
}

// Fallback: render districts as circle markers if no GeoJSON polygon available
const CircleMarker = dynamic(() => import('react-leaflet').then((m) => m.CircleMarker), { ssr: false });

// Approximate centroids for districts without GeoJSON (lat/lon)
const CENTROIDS: Record<string, [number, number]> = {
  'Pune':        [18.52, 73.86],
  'Nashik':      [20.00, 73.79],
  'Aurangabad':  [19.88, 75.34],
  'Latur':       [18.40, 76.56],
  'Jaipur':      [26.91, 75.79],
  'Jodhpur':     [26.29, 73.02],
  'Bikaner':     [28.02, 73.31],
  'Kota':        [25.18, 75.84],
  'Chennai':     [13.08, 80.27],
  'Coimbatore':  [11.01, 76.96],
  'Madurai':     [ 9.93, 78.12],
  'Bengaluru':   [12.97, 77.59],
  'Mysuru':      [12.30, 76.65],
  'Kalaburagi':  [17.33, 76.82],
  'Tumkur':      [13.34, 77.10],
};

export function MapPanel({ districts }: MapPanelProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    // Fix Leaflet default icon paths in Next.js
    import('leaflet').then((leaflet) => {
      // eslint-disable-next-line
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setL(leaflet);
    });
  }, []);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border shadow-sm">
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[999] bg-white/90 backdrop-blur rounded-lg p-3 shadow text-xs space-y-1">
        <p className="font-semibold text-foreground mb-1">Stress Index</p>
        {[
          { label: 'Low (< 0.35)',          color: '#22c55e' },
          { label: 'Low-Moderate (< 0.55)', color: '#84cc16' },
          { label: 'Moderate (< 0.70)',     color: '#eab308' },
          { label: 'High (< 0.85)',          color: '#f97316' },
          { label: 'Critical (≥ 0.85)',     color: '#ef4444' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
        <div className="mt-1 pt-1 border-t text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-sm border border-gray-400 mr-1" />real data
          &nbsp;·&nbsp;
          <span className="inline-block w-3 h-3 rounded-sm border border-dashed border-gray-400 mr-1" />interpolated
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {districts.map((d) => {
          const color  = stressColor(d.stressIndex);
          const center = CENTROIDS[d.name];

          if (d.geojson) {
            return (
              <GeoJSON
                key={d.id}
                // eslint-disable-next-line
                data={d.geojson as any}
                style={{
                  fillColor:   color,
                  color:       '#ffffff',
                  weight:      1,
                  fillOpacity: 0.75,
                  dashArray:   d.dataQuality !== 'real' ? '4 4' : undefined,
                }}
              >
                <Tooltip>
                  <DistrictTooltip district={d} />
                </Tooltip>
              </GeoJSON>
            );
          }

          if (center && L) {
            return (
              <CircleMarker
                key={d.id}
                center={center}
                radius={18}
                pathOptions={{
                  fillColor:   color,
                  color:       '#ffffff',
                  weight:      2,
                  fillOpacity: 0.85,
                  dashArray:   d.dataQuality !== 'real' ? '4 4' : undefined,
                }}
              >
                <Tooltip>
                  <DistrictTooltip district={d} />
                </Tooltip>
              </CircleMarker>
            );
          }

          return null;
        })}
      </MapContainer>
    </div>
  );
}

function DistrictTooltip({ district: d }: { district: DistrictData }) {
  return (
    <div className="text-xs space-y-0.5 min-w-[160px]">
      <p className="font-semibold text-sm">{d.name}, {d.state}</p>
      <p>
        Stress:{' '}
        <span className="font-medium" style={{ color: stressColor(d.stressIndex) }}>
          {stressLabel(d.stressIndex)} ({d.stressIndex.toFixed(2)})
        </span>
      </p>
      <p>Groundwater: <b>{d.groundwaterLevel} m BGL</b></p>
      <p>Rainfall avg: <b>{d.rainfallAvg} mm/yr</b></p>
      <p>Primary source: <b className="capitalize">{d.dominantSource}</b></p>
      <p className="text-[10px] text-muted-foreground mt-1">
        Data: {d.dataQuality}
      </p>
    </div>
  );
}
