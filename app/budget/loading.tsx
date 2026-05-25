export default function Loading() {
  return (
    <div className="container-page py-10 sm:py-14 animate-pulse">
      <div className="mb-10 pb-6 border-b border-ink-200">
        <div className="h-3 w-40 rounded bg-ink-200 mb-3" />
        <div className="h-10 w-72 rounded bg-ink-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-ink-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl border border-ink-200 bg-white" />
        <div className="h-72 rounded-2xl border border-ink-200 bg-white" />
      </div>
    </div>
  );
}
