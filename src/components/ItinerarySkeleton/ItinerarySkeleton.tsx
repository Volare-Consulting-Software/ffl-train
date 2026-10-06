const LEGS = 2;

/** Placeholder shaped like ItineraryDetails while a route is planned. */
export function ItinerarySkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-line bg-surface-raised p-5" role="status" aria-label="Loading route">
      <div className="h-6 w-56 rounded bg-surface-sunken" />
      <div className="mt-2 h-4 w-32 rounded bg-surface-sunken" />
      <div className="mt-5 flex flex-col gap-5">
        {Array.from({ length: LEGS }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="h-4 w-40 rounded bg-surface-sunken" />
            <div className="h-4 w-3/4 rounded bg-surface-sunken" />
            <div className="h-4 w-2/3 rounded bg-surface-sunken" />
            <div className="h-3 w-24 rounded bg-surface-sunken" />
          </div>
        ))}
      </div>
    </div>
  );
}
