import React from "react";

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`animate-pulse bg-zinc-800 rounded-lg ${className}`} style={style} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <Skeleton className="w-8 h-8 rounded-xl mb-3" />
      <Skeleton className="w-16 h-7 mb-2" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <Skeleton className="w-40 h-4 mb-4" />
      <Skeleton className="w-full h-[200px] rounded-xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800 flex gap-6">
        {[120, 80, 60, 100, 80, 50].map((w, i) => (
          <Skeleton key={i} className="h-3" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-zinc-800/50 flex gap-6 items-center">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function HistoryCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="w-28 h-4" />
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
        <Skeleton className="w-12 h-6 rounded-lg" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-6 w-24 rounded-full" />)}
      </div>
    </div>
  );
}
