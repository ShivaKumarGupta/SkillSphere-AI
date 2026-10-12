const scoreColor = (s) =>
  s < 40 ? 'bg-red-100 text-red-700' : s < 60 ? 'bg-amber-100 text-amber-700' : s < 80 ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function InterviewHistory({ items, onView, onDelete, busyId }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="font-semibold text-slate-800">Past interviews</h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          No completed interviews yet. Your results will appear here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{item.role}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {item.type} · {item.difficulty} · {item.questionCount} questions ·{' '}
                  {formatDate(item.completedAt)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${scoreColor(item.overallScore)}`}>
                  {item.overallScore} / 100
                </span>
                <button
                  onClick={() => onView(item.id)}
                  disabled={busyId === item.id}
                  className="text-sm text-indigo-600 hover:underline disabled:opacity-60"
                >
                  {busyId === item.id ? 'Opening...' : 'View'}
                </button>
                <button
                  onClick={() => onDelete(item)}
                  disabled={busyId === item.id}
                  className="text-sm text-slate-500 hover:text-red-600 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}