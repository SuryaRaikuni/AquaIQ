export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-56 bg-muted rounded-md" />
        <div className="h-4 w-96 bg-muted/60 rounded-md" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-40 bg-muted rounded-md" />
        <div className="h-9 w-40 bg-muted rounded-md" />
        <div className="h-9 w-24 bg-muted rounded-md" />
      </div>

      {/* Map + widget skeleton */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 h-[500px] bg-muted rounded-xl" />
        <div className="lg:w-80 h-80 bg-muted rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-72 bg-muted rounded-md" />
        <div className="rounded-xl border overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted/70 rounded" />
              <div className="h-4 w-20 bg-muted/70 rounded" />
              <div className="h-4 w-16 bg-muted/60 rounded" />
              <div className="h-4 w-16 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
