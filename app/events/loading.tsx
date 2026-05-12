export default function EventsLoading() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="relative mb-10">
        <div className="h-4 w-20 rounded bg-ink-200 animate-pulse mb-3" />
        <div className="h-12 w-40 rounded-xl bg-ink-200 animate-pulse mb-4" />
        <div className="h-4 w-80 rounded bg-ink-100 animate-pulse" />
      </div>
      <div className="text-xs uppercase tracking-[0.2em] text-ink-300 mb-5">Upcoming</div>
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-14">
                <div className="rounded-xl bg-ink-200 h-14" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-20 rounded-full bg-ink-100" />
                </div>
                <div className="h-6 w-4/5 rounded-lg bg-ink-200" />
                <div className="h-4 w-full rounded bg-ink-100" />
                <div className="space-y-1.5">
                  <div className="h-3 w-32 rounded bg-ink-100" />
                  <div className="h-3 w-24 rounded bg-ink-100" />
                  <div className="h-3 w-28 rounded bg-ink-100" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
