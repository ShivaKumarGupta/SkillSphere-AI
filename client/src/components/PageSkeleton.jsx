export default function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse space-y-6 motion-reduce:animate-none">
      <div className="h-8 w-64 rounded-lg bg-slate-200" />
      <div className="h-44 rounded-2xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-slate-200" />
      <span className="sr-only">Loading</span>
    </div>
  )
}