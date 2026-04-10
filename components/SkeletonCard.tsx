export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[#0d1f2d] border border-white/6">
      {/* Image placeholder */}
      <div className="h-48 relative skeleton-shimmer">
        <div className="absolute top-3 left-3 w-11 h-12 rounded-xl bg-white/6" />
        <div className="absolute top-3 right-3 w-14 h-6 rounded-full bg-white/6" />
        <div className="absolute bottom-3 left-3 w-20 h-5 rounded-full bg-white/6" />
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 rounded-md skeleton-shimmer w-full" />
          <div className="h-4 rounded-md skeleton-shimmer w-3/4" />
          {/* min-height spacer to match real card */}
          <div className="h-px" />
        </div>

        {/* Meta */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded skeleton-shimmer flex-shrink-0" />
            <div className="h-3 rounded skeleton-shimmer w-40" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded skeleton-shimmer flex-shrink-0" />
            <div className="h-3 rounded skeleton-shimmer w-24" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/6">
          <div className="h-3 rounded skeleton-shimmer w-20" />
          <div className="h-3 rounded skeleton-shimmer w-16" />
        </div>
      </div>
    </div>
  );
}
