export function CardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton mt-3 h-3 w-full" />
      <div className="skeleton mt-1.5 h-3 w-4/5" />
      <div className="skeleton mt-4 h-1.5 w-full rounded-full" />
    </div>
  );
}

export function RepoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-base-700/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <div className="skeleton h-3.5 w-1/3" />
          <div className="skeleton h-3.5 w-16 rounded-full" />
          <div className="skeleton h-3.5 w-12 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <div className="card skeleton w-full" style={{ height }} />;
}
