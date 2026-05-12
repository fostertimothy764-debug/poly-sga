export default function AnnouncementsLoading() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="relative mb-10">
        <div className="h-4 w-24 rounded bg-ink-200 animate-pulse mb-3" />
        <div className="h-12 w-64 rounded-xl bg-ink-200 animate-pulse mb-4" />
        <div className="h-4 w-96 rounded bg-ink-100 animate-pulse" />
      </div>
      <div className="flex gap-2 mb-8">
        {[80, 100, 110, 90].map((w, i) => (
          <div key={i} className="h-8 rounded-full bg-ink-100 animate-pulse" style={{ width: w }} />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="h-5 w-16 rounded-full bg-ink-100" />
              <div className="h-5 w-20 rounded-full bg-ink-100 ml-auto" />
            </div>
            <div className="h-7 w-3/4 rounded-lg bg-ink-200 mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-ink-100" />
              <div className="h-4 w-5/6 rounded bg-ink-100" />
              <div className="h-4 w-2/3 rounded bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
