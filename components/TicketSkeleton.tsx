/**
 * Skeleton loader for the My Tickets page.
 * Mirrors the TicketCard layout so there's no layout shift on load.
 */
export default function TicketSkeleton() {
  return (
    <div className="rounded-2xl bg-[#112240] border border-white/6 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl skeleton-shimmer flex-shrink-0" />
          <div>
            <div className="h-3.5 w-40 rounded skeleton-shimmer mb-1.5" />
            <div className="h-2.5 w-24 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full skeleton-shimmer" />
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex gap-4">
        {/* QR placeholder */}
        <div className="w-28 h-28 rounded-xl skeleton-shimmer flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 space-y-3 pt-1">
          <div>
            <div className="h-2.5 w-10 rounded skeleton-shimmer mb-1.5" />
            <div className="h-3.5 w-28 rounded skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded skeleton-shimmer" />
            <div className="h-3 w-36 rounded skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded skeleton-shimmer" />
            <div className="h-3 w-28 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Footer toggle */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/6">
        <div className="h-3 w-20 rounded skeleton-shimmer" />
        <div className="w-3.5 h-3.5 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
