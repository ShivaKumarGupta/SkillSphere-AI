const scoreLabel = (s) => (s < 40 ? 'Weak' : s < 60 ? 'Needs work' : s < 80 ? 'Good' : 'Strong')
const scoreColor = (s) =>
  s < 40 ? 'text-red-600' : s < 60 ? 'text-amber-600' : s < 80 ? 'text-indigo-600' : 'text-green-600'
const questionColor = (s) =>
  s <= 3 ? 'bg-red-100 text-red-700' : s <= 6 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'

const CATEGORY_STYLES = {
  Technical: 'bg-indigo-100 text-indigo-700',
  HR: 'bg-purple-100 text-purple-700',
}

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

function ScoreTile({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">
        {value === null || value === undefined ? 'N/A' : value}
        {value !== null && value !== undefined && (
          <span className="text-sm font-medium text-slate-400"> / 10</span>
        )}
      </p>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function Bullets({ items, empty }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">{empty}</p>
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export default function InterviewResults({ session, onBack }) {
  const ev = session.evaluation

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to interviews
      </button>

      <div className="rounded-2xl bg-white p-6 shadow">
        <p className="text-sm text-slate-500">
          {session.role} · {session.type} · {session.difficulty} · {session.questions.length} questions
        </p>
        <p className={`mt-2 text-5xl font-bold ${scoreColor(ev.overallScore)}`}>
          {ev.overallScore}
          <span className="text-xl font-medium text-slate-400"> / 100</span>
        </p>
        <p className="mt-1 text-sm font-medium text-slate-600">{scoreLabel(ev.overallScore)}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ScoreTile label="Technical" value={ev.technicalScore} />
          <ScoreTile label="Communication" value={ev.communicationScore} />
        </div>

        <p className="mt-5 text-sm text-slate-700">{ev.summary}</p>
        <p className="mt-4 text-xs text-slate-400">Completed {formatDateTime(session.completedAt)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Strengths">
          <Bullets items={ev.strengths} empty="No specific strengths were listed." />
        </Card>
        <Card title="Areas to improve">
          <Bullets items={ev.improvementAreas} empty="No improvement areas were listed." />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Weak topics">
          {ev.weakTopics.length === 0 ? (
            <p className="text-sm text-slate-400">No weak topics. Nice work!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ev.weakTopics.map((t, i) => (
                <span key={i} className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700">
                  {t}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">Topics of questions you scored 5 or below on.</p>
        </Card>
        <Card title="Recommended topics to study">
          <Bullets items={ev.studyTopics} empty="No topics were suggested." />
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Question by question</h2>
        {session.questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl bg-white p-6 shadow">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Question {i + 1}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[q.category]}`}
                >
                  {q.category}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                  {q.topic}
                </span>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${questionColor(q.score)}`}>
                {q.score} / 10
              </span>
            </div>

            <p className="mt-3 font-medium text-slate-800">{q.text}</p>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">Your answer</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
              {q.answer.trim() || 'No answer given.'}
            </p>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">Feedback</p>
            <p className="mt-1 text-sm text-slate-700">{q.feedback}</p>

            {q.keyPoints.length > 0 && (
              <>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                  A strong answer covers
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {q.keyPoints.map((k, j) => (
                    <li key={j}>{k}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Scores are an AI judgement of your written answers and are only a rough guide. Use the
        feedback to practise, not as a verdict.
      </p>
    </div>
  )
}