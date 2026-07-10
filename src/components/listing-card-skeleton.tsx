export function ListingCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="aspect-[16/10] bg-border/60" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-border/60" />
          <div className="h-5 w-12 rounded-full bg-border/60" />
          <div className="ml-auto h-5 w-14 rounded-full bg-border/60" />
        </div>
        <div className="h-4 w-full rounded bg-border/60" />
        <div className="h-4 w-2/3 rounded bg-border/60" />
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-border/60" />
          <div className="h-5 w-16 rounded-full bg-border/60" />
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <div className="h-6 w-6 rounded-full bg-border/60" />
          <div className="h-3 w-24 rounded bg-border/60" />
        </div>
      </div>
    </div>
  );
}
