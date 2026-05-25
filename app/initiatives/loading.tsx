export default function Loading() {
  return (
    <div className="container-page py-10 sm:py-14 animate-pulse">
      <div className="mb-10 pb-6 border-b border-ink-200">
        <div className="h-3 w-40 rounded bg-ink-200 mb-3" />
        <div className="h-10 w-80 rounded bg-ink-200 mb-3" />
        <div className="h-4 w-full max-w-2xl rounded bg-ink-100" />
      </div>
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-ink-200 bg-white/60 p-4 space-y-3">
            <div className="h-4 w-24 rounded bg-ink-200" />
            <div className="h-20 rounded-xl bg-ink-100" />
            <div className="h-20 rounded-xl bg-ink-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
