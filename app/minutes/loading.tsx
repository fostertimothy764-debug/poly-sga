export default function Loading() {
  return (
    <div className="container-page py-10 sm:py-14 animate-pulse">
      <div className="mb-10 pb-6 border-b border-ink-200">
        <div className="h-3 w-40 rounded bg-ink-200 mb-3" />
        <div className="h-10 w-72 rounded bg-ink-200 mb-3" />
        <div className="h-4 w-full max-w-2xl rounded bg-ink-100" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] mb-8">
        <div className="h-11 rounded-xl bg-ink-100" />
        <div className="h-11 w-40 rounded-xl bg-ink-100" />
        <div className="h-11 w-32 rounded-xl bg-ink-100" />
        <div className="h-11 w-32 rounded-xl bg-ink-100" />
      </div>
      <div className="space-y-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-ink-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
