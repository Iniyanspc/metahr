export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
