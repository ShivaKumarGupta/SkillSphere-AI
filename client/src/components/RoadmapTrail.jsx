const CATEGORY_STYLES = {
  Skills: 'bg-indigo-100 text-indigo-700',
  Projects: 'bg-green-100 text-green-700',
  DSA: 'bg-amber-100 text-amber-700',
  Certification: 'bg-sky-100 text-sky-700',
  Resume: 'bg-pink-100 text-pink-700',
  'Interview Prep': 'bg-purple-100 text-purple-700',
}

// The path below a stop is solid once that stop is done, and dashed while it is still ahead
function PathBelow({ solid }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute bottom-0 left-[19px] top-10 border-l-2 ${
        solid ? 'border-indigo-600' : 'border-dashed border-slate-300'
      }`}
    />
  )
}

function Marker({ state, number }) {
  const styles = {
    done: 'bg-indigo-600 text-white',
    next: 'bg-amber-400 text-indigo-900 ring-4 ring-amber-200',
    todo: 'border-2 border-slate-300 bg-white text-slate-500',
  }
  return (
    <span
      className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${styles[state]}`}
    >
      {state === 'done' ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        number
      )}
    </span>
  )
}

export default function RoadmapTrail({ milestones, nextId, togglingId, onToggle, targetRole }) {
  const allDone = milestones.length > 0 && milestones.every((m) => m.completed)

  return (
    <ol className="relative">
      <li className="relative pb-8 pl-16">
        <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-900">
          <span className="h-3 w-3 rounded-full bg-white" />
        </span>
        <PathBelow solid />
        <p className="pt-1.5 font-display font-semibold text-slate-800">Trailhead</p>
        <p className="text-sm text-slate-500">
          Your skills, projects and practice so far are the starting point.
        </p>
      </li>

      {milestones.map((m, i) => {
        const state = m.completed ? 'done' : m.id === nextId ? 'next' : 'todo'
        return (
          <li key={m.id} className="relative pb-8 pl-16">
            <Marker state={state} number={i + 1} />
            <PathBelow solid={m.completed} />

            <div
              className={`rounded-2xl bg-white p-5 shadow ${
                state === 'next' ? 'ring-2 ring-amber-300' : ''
              } ${m.completed ? 'opacity-75' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`font-semibold text-slate-800 ${m.completed ? 'line-through' : ''}`}>
                  <span className="sr-only">Step {i + 1}: </span>
                  {m.title}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    CATEGORY_STYLES[m.category] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {m.category}
                </span>
                {state === 'next' && (
                  <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-indigo-900">
                    Up next
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                About {m.estimatedWeeks} {m.estimatedWeeks === 1 ? 'week' : 'weeks'}
              </p>
              {m.description && <p className="mt-2 text-sm text-slate-600">{m.description}</p>}

              {m.topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.topics.map((t, j) => (
                    <span key={j} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => onToggle(m)}
                disabled={togglingId === m.id}
                className="mt-4 text-sm font-semibold text-indigo-700 hover:underline disabled:opacity-60"
              >
                {togglingId === m.id ? 'Saving...' : m.completed ? 'Mark as not done' : 'Mark as done'}
              </button>
            </div>
          </li>
        )
      })}

      <li className="relative pl-16">
        <span
          className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full ${
            allDone ? 'bg-amber-400 text-indigo-900' : 'border-2 border-slate-300 bg-white text-slate-400'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M6 3v18h2v-7h9l-2-4 2-4H8V3z" />
          </svg>
        </span>
        <p className="pt-1.5 font-display font-semibold text-slate-800">Summit: {targetRole}</p>
        <p className="text-sm text-slate-500">
          {allDone ? 'You completed every milestone. Time to apply with confidence.' : 'Your target role is at the top of this trail.'}
        </p>
      </li>
    </ol>
  )
}