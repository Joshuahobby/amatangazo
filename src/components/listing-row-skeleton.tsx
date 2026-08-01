/** Loading placeholder matching ListingRow's geometry (48px logo + two lines). */
export function ListingRowSkeleton() {
  return (
    <div className="flex animate-pulse items-start gap-3 p-3">
      <div className="h-12 w-12 shrink-0 rounded-lg bg-border/60" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-border/60" />
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded-full bg-border/60" />
          <div className="h-4 w-24 rounded bg-border/60" />
        </div>
      </div>
    </div>
  );
}
