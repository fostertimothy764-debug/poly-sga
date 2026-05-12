export default function SuggestionsLoading() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="relative mb-10">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-end">
          <div>
            <div className="h-4 w-24 rounded bg-ink-200 animate-pulse mb-3" />
            <div className="h-14 w-72 rounded-xl bg-ink-200 animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-ink-100 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-ink-100 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:max-w-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse py-4 px-2 text-center">
                <div className="mx-auto mb-2 h-7 w-7 rounded-full bg-ink-100" />
                <div className="h-3 w-16 mx-auto rounded bg-ink-100 mb-1" />
                <div className="h-4 w-12 mx-auto rounded bg-ink-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {[80, 80, 100, 110, 90, 110].map((w, i) => (
          <div key={i} className="h-8 rounded-full bg-ink-100 animate-pulse" style={{ width: w }} />
        ))}
      </div>
      <div className="grid gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card flex items-start gap-4 animate-pulse">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-ink-100" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-24 rounded-full bg-ink-100" />
                <div className="h-5 w-16 rounded-full bg-ink-100" />
              </div>
              <div className="h-4 w-full rounded bg-ink-200" />
              <div className="h-4 w-3/4 rounded bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
