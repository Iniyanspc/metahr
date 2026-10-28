export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="h-48 w-full max-w-sm animate-pulse rounded-xl bg-muted" />
    </main>
  );
}
