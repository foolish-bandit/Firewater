/** Shared shimmer / skeleton primitives for loading states. */

// --- Shimmer base ---

const shimmerClass =
  'bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-surface-alt via-surface-raised to-surface-alt';

/** Generic shimmer block. Pass className for size / shape overrides. */
export function Shimmer({ className = '' }: { className?: string }) {
  return <div className={`${shimmerClass} ${className}`} />;
}

// --- Existing card-level skeletons ---

export function SkeletonCard() {
  return (
    <div className="surface-raised overflow-hidden flex flex-col animate-pulse">
      <div className="h-[2px] w-[30%] bg-on-surface-accent/10" />
      <div className="w-full h-32 bg-surface-base/60" />
      <div className="p-6 flex-1 flex flex-col gap-3">
        <div className="h-6 bg-on-surface/5 rounded w-3/4" />
        <div className="h-3 bg-on-surface-accent/10 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-6 bg-surface-base/60 rounded w-16" />
          <div className="h-6 bg-surface-base/60 rounded w-20" />
        </div>
        <div className="h-[2px] bg-surface-base rounded-full" />
        <div className="flex gap-2">
          <div className="h-5 bg-on-surface/5 rounded-full w-16" />
          <div className="h-5 bg-on-surface/5 rounded-full w-14" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-on-surface/5 rounded w-full" />
          <div className="h-3 bg-on-surface/5 rounded w-5/6" />
          <div className="h-3 bg-on-surface/5 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-12 animate-pulse">
      <div className="h-8 bg-on-surface/5 rounded w-48" />
      <div className="h-4 bg-on-surface/5 rounded w-72" />
      <SkeletonGrid count={6} />
    </div>
  );
}

// --- Feed skeleton ---

function FeedItemSkeleton() {
  return (
    <div className="surface-raised rounded-[28px] border border-border-subtle p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4 pl-2">
        {/* Avatar */}
        <Shimmer className="w-11 h-11 rounded-full shrink-0" />
        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Shimmer className="h-5 w-16 rounded-full" />
            <Shimmer className="h-3 w-12 rounded" />
          </div>
          <Shimmer className="h-4 w-3/4 rounded" />
          <Shimmer className="h-4 w-1/2 rounded" />
          {/* Info panel */}
          <div className="rounded-[22px] bg-surface-alt p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-4 rounded" />
              <Shimmer className="h-3 w-32 rounded" />
            </div>
            <Shimmer className="h-3 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FeedItemSkeleton key={i} />
      ))}
    </div>
  );
}

// --- Review skeleton ---

function ReviewItemSkeleton() {
  return (
    <div className="surface-raised p-4 sm:p-6 space-y-4">
      {/* Header: avatar + name + stars + date */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Shimmer className="w-6 h-6 rounded-full" />
          <Shimmer className="h-4 w-24 rounded" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} className="w-4 h-4 rounded-full" />
            ))}
          </div>
        </div>
        <Shimmer className="h-3 w-16 rounded" />
      </div>
      {/* Body text lines */}
      <div className="space-y-2">
        <Shimmer className="h-3 w-full rounded" />
        <Shimmer className="h-3 w-5/6 rounded" />
        <Shimmer className="h-3 w-2/3 rounded" />
      </div>
      {/* Tags */}
      <div className="flex gap-2">
        <Shimmer className="h-5 w-14 rounded-full" />
        <Shimmer className="h-5 w-18 rounded-full" />
        <Shimmer className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function ReviewsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewItemSkeleton key={i} />
      ))}
    </div>
  );
}

// --- Profile skeleton ---

export function ProfileSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-6">
            <Shimmer className="w-24 h-24 sm:w-32 sm:h-32 rounded-full shrink-0" />
            <div className="space-y-3 flex-1">
              <Shimmer className="h-3 w-16 rounded" />
              <Shimmer className="h-8 w-48 rounded" />
              <Shimmer className="h-4 w-64 rounded" />
            </div>
          </div>
          {/* Info badges */}
          <div className="flex gap-2 flex-wrap">
            <Shimmer className="h-7 w-28 rounded-full" />
            <Shimmer className="h-7 w-32 rounded-full" />
            <Shimmer className="h-7 w-24 rounded-full" />
          </div>
          {/* Persona pillars */}
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-[24px] border border-border-subtle bg-on-surface/[0.03] p-4 space-y-2">
                <Shimmer className="w-10 h-10 rounded-full" />
                <Shimmer className="h-3 w-16 rounded" />
                <Shimmer className="h-5 w-24 rounded" />
                <Shimmer className="h-3 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* Right column: stats */}
        <div className="lg:col-span-5 space-y-4">
          <Shimmer className="h-3 w-12 rounded" />
          <Shimmer className="h-7 w-36 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-raised rounded-[20px] p-4 space-y-2">
                <Shimmer className="h-3 w-16 rounded" />
                <Shimmer className="h-8 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Shelf grid */}
      <div className="space-y-4 mb-12">
        <Shimmer className="h-3 w-16 rounded" />
        <Shimmer className="h-8 w-40 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 rounded-[28px] border border-border-subtle p-6 min-h-[260px] space-y-4">
            <Shimmer className="h-5 w-20 rounded-full" />
            <Shimmer className="h-8 w-3/4 rounded" />
            <Shimmer className="h-4 w-1/2 rounded" />
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <Shimmer className="h-4 w-full rounded" />
              <Shimmer className="h-4 w-full rounded" />
            </div>
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="md:col-span-3 rounded-[28px] border border-border-subtle p-5 min-h-[220px] space-y-3">
              <Shimmer className="h-4 w-16 rounded-full" />
              <Shimmer className="h-6 w-3/4 rounded" />
              <Shimmer className="h-3 w-1/2 rounded" />
              <div className="grid grid-cols-2 gap-2">
                <Shimmer className="h-3 w-full rounded" />
                <Shimmer className="h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews journal */}
      <div className="space-y-4">
        <Shimmer className="h-3 w-20 rounded" />
        <Shimmer className="h-8 w-48 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`rounded-[28px] border border-border-subtle p-5 space-y-3 ${i === 0 ? 'lg:col-span-2' : ''}`}>
              <Shimmer className="h-7 w-3/4 rounded" />
              <Shimmer className="h-3 w-1/2 rounded" />
              <Shimmer className="h-3 w-full rounded" />
              <Shimmer className="h-3 w-5/6 rounded" />
              <div className="flex justify-between items-center mt-2">
                <Shimmer className="h-3 w-20 rounded" />
                <Shimmer className="h-8 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
