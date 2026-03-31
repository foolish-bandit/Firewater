export function SkeletonCard() {
  return (
    <div className="bg-[#1A1816] vintage-border overflow-hidden flex flex-col animate-pulse">
      <div className="h-[2px] w-[30%] bg-[#C89B3C]/10" />
      <div className="w-full h-32 bg-[#141210]/60" />
      <div className="p-6 flex-1 flex flex-col gap-3">
        <div className="h-6 bg-[#EAE4D9]/5 rounded w-3/4" />
        <div className="h-3 bg-[#C89B3C]/10 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-6 bg-[#141210]/60 rounded w-16" />
          <div className="h-6 bg-[#141210]/60 rounded w-20" />
        </div>
        <div className="h-[2px] bg-[#141210] rounded-full" />
        <div className="flex gap-2">
          <div className="h-5 bg-[#EAE4D9]/5 rounded-full w-16" />
          <div className="h-5 bg-[#EAE4D9]/5 rounded-full w-14" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-[#EAE4D9]/5 rounded w-full" />
          <div className="h-3 bg-[#EAE4D9]/5 rounded w-5/6" />
          <div className="h-3 bg-[#EAE4D9]/5 rounded w-2/3" />
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
      <div className="h-8 bg-[#EAE4D9]/5 rounded w-48" />
      <div className="h-4 bg-[#EAE4D9]/5 rounded w-72" />
      <SkeletonGrid count={6} />
    </div>
  );
}
