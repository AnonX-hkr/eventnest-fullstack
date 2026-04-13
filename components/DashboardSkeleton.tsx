/**
 * Shimmer skeleton shown while dashboard stats are loading.
 * Mirrors the exact layout of the real dashboard so there's no layout shift.
 */
export default function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="h-8 w-36 rounded-lg skeleton-shimmer mb-2" />
          <div className="h-4 w-52 rounded skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
          <div className="h-9 w-32 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[#112240] border border-white/6 p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-xl skeleton-shimmer" />
              <div className="w-4 h-4 rounded skeleton-shimmer" />
            </div>
            <div className="h-8 w-24 rounded-lg skeleton-shimmer mb-2" />
            <div className="h-3 w-20 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Chart + Quick actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#112240] border border-white/6 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
            <div>
              <div className="h-4 w-44 rounded skeleton-shimmer mb-1.5" />
              <div className="h-3 w-28 rounded skeleton-shimmer" />
            </div>
            <div className="h-3 w-20 rounded skeleton-shimmer" />
          </div>
          <div className="px-6 pb-6 pt-4">
            {/* Bar chart skeleton */}
            <div className="flex items-end gap-2 h-32">
              {[60, 85, 45, 95, 70, 55].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md skeleton-shimmer"
                    style={{ height: `${h}%` }}
                  />
                  <div className="h-2.5 w-5 rounded skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl bg-[#112240] border border-white/6 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6">
            <div className="h-4 w-28 rounded skeleton-shimmer" />
          </div>
          <div className="p-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg skeleton-shimmer flex-shrink-0" />
                <div className="h-3 flex-1 rounded skeleton-shimmer" />
                <div className="w-3.5 h-3.5 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="rounded-2xl bg-[#112240] border border-white/6 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
          <div className="h-4 w-28 rounded skeleton-shimmer" />
          <div className="h-3 w-16 rounded skeleton-shimmer" />
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full skeleton-shimmer flex-shrink-0" />
                <div>
                  <div className="h-3.5 w-28 rounded skeleton-shimmer mb-1.5" />
                  <div className="h-2.5 w-36 rounded skeleton-shimmer" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-3.5 w-14 rounded skeleton-shimmer mb-1.5" />
                <div className="h-2.5 w-24 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
