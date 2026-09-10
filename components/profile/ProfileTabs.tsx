'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatLiters } from '@/lib/utils';
import { Trash2, ExternalLink, Calculator, Sprout, BookmarkX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavedProfile {
  id:        string;
  label:     string;
  createdAt: string;
  data:      Record<string, unknown>;
}

interface ProfileTabsProps {
  footprintProfiles:  SavedProfile[];
  irrigationProfiles: SavedProfile[];
}

export function ProfileTabs({ footprintProfiles, irrigationProfiles }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'footprint' | 'irrigation'>('footprint');
  const router = useRouter();

  async function handleDelete(id: string) {
    await fetch(`/api/profiles?id=${id}`, { method: 'DELETE' });
    router.refresh();
  }

  const tabs = [
    { key: 'footprint' as const,  label: 'Footprint Profiles',  icon: Calculator, count: footprintProfiles.length  },
    { key: 'irrigation' as const, label: 'Irrigation Profiles', icon: Sprout,     count: irrigationProfiles.length },
  ];

  const profiles = activeTab === 'footprint' ? footprintProfiles : irrigationProfiles;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === t.key
                ? 'border-aqua-600 text-aqua-700'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === t.key ? 'bg-aqua-100 text-aqua-700' : 'bg-muted text-muted-foreground'
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Profile cards */}
      {profiles.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <BookmarkX className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No saved {activeTab} profiles yet.</p>
          <p className="text-sm mt-1">
            Run the{' '}
            <a
              href={activeTab === 'footprint' ? '/calculator' : '/irrigation'}
              className="text-aqua-600 hover:underline"
            >
              {activeTab === 'footprint' ? 'Water Footprint Calculator' : 'Irrigation Advisor'}
            </a>{' '}
            and click &quot;Save this result&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              type={activeTab}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileCard({
  profile, type, onDelete,
}: {
  profile: SavedProfile;
  type: 'footprint' | 'irrigation';
  onDelete: () => void;
}) {
  const data = profile.data;
  const savedDate = new Date(profile.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="rounded-xl border p-4 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-semibold text-sm leading-tight">{profile.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{savedDate}</p>
        </div>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
          title="Delete profile"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Summary metrics */}
      {type === 'footprint' ? (
        <FootprintSummary data={data} />
      ) : (
        <IrrigationSummary data={data} />
      )}

      {/* Load button */}
      <a
        href={
          type === 'footprint'
            ? `/calculator?profile=${profile.id}`
            : `/irrigation?profile=${profile.id}`
        }
        className="inline-flex items-center gap-1.5 text-xs text-aqua-600 hover:underline font-medium"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Open in module
      </a>
    </div>
  );
}

function FootprintSummary({ data }: { data: Record<string, unknown> }) {
  const total    = typeof data.totalPerDay  === 'number' ? data.totalPerDay  : 0;
  const avgPct   = typeof data.percentVsAvg === 'number' ? data.percentVsAvg : 0;
  const breakdown = (data.breakdown as Record<string, number>) ?? {};

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Daily total</span>
        <span className="font-semibold">{formatLiters(total)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">vs national avg</span>
        <span className={cn('font-semibold', avgPct > 100 ? 'text-red-600' : 'text-green-600')}>
          {avgPct}%
        </span>
      </div>
      {Object.keys(breakdown).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(breakdown).map(([k, v]) => (
            <span key={k} className="text-xs bg-muted rounded px-1.5 py-0.5 capitalize">
              {k}: {formatLiters(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function IrrigationSummary({ data }: { data: Record<string, unknown> }) {
  const method  = typeof data.recommendedMethod === 'string' ? data.recommendedMethod : '—';
  const savings = (data.savings as Record<string, number>) ?? {};
  const crop    = (data.crop as { name?: string }) ?? {};

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Crop</span>
        <span className="font-semibold capitalize">{crop.name ?? '—'}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Recommended</span>
        <span className="font-semibold capitalize text-green-700">{method}</span>
      </div>
      {savings.waterKLPerSeason != null && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Water saved/season</span>
          <span className="font-semibold">{savings.waterKLPerSeason} KL</span>
        </div>
      )}
    </div>
  );
}
