export default function Loading() {
  return (
    <div className="container-page py-10 sm:py-14 animate-pulse">
      <div className="mb-10 pb-6 border-b border-ink-200">
        <div className="h-3 w-40 rounded bg-ink-200 mb-3" />
        <div className="h-10 w-80 rounded bg-ink-200 mb-3" />
        <div className="h-4 w-full max-w-2xl rounded bg-ink-100" />
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-ink-200 bg-white" />
        ))}
      </div>
      <div className="h-48 rounded-2xl border border-ink-200 bg-white mb-10" />
      <div className="space-y-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl border border-ink-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
