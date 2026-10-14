import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '../api/axios'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const barColor = (avg) => (avg <= 5 ? 'bg-red-400' : avg < 7 ? 'bg-amber-400' : 'bg-green-500')

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function Card({ title, hint, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default function InterviewAnalytics() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/interviews/analytics')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load your analytics'))
  }, [])

  if (error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
  if (!stats) return <p className="text-slate-500">Loading...</p>

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Interview analytics</h1>
        <p className="mt-1 text-slate-500">How your mock interviews are going over time.</p>
      </div>
      <Link
        to="/interview"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to interviews
      </Link>
    </div>
  )

  if (stats.total === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">
            No completed interviews yet. Finish a mock interview and your analytics will appear here.
          </p>
          <Link
            to="/interview"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Start an interview
          </Link>
        </div>
      </div>
    )
  }

  const chartData = stats.trend.map((t) => ({
    label: `#${t.number}`,
    score: t.score,
    date: formatDate(t.completedAt),
  }))

  const change = stats.changeSinceFirst
  const changeHint =
    change === null
      ? 'Complete another interview to see your change'
      : `${change > 0 ? '+' : ''}${change} since your first interview`

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Interviews completed"
          value={stats.total}
        />
        <StatCard label="Average score" value={`${stats.average}`} hint="out of 100" />
        <StatCard label="Best score" value={`${stats.best}`} hint="out of 100" />
        <StatCard label="Latest score" value={`${stats.latest}`} hint={changeHint} />
      </div>

      <Card
        title="Score trend"
        hint={`Your last ${chartData.length} ${chartData.length === 1 ? 'interview' : 'interviews'}, oldest to newest.`}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} width={34} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value} / 100`, 'Score']}
                labelFormatter={(label, payload) =>
                  payload && payload[0] ? `Interview ${label} · ${payload[0].payload.date}` : label
                }
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2A7F8E"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Technical average"
          value={stats.averages.technical === null ? 'N/A' : `${stats.averages.technical} / 10`}
        />
        <StatCard
          label="Communication average"
          value={stats.averages.communication === null ? 'N/A' : `${stats.averages.communication} / 10`}
        />
        {stats.byCategory.map((c) => (
          <StatCard
            key={c.category}
            label={`${c.category} questions`}
            value={`${c.average} / 10`}
            hint={`${c.questions} answered`}
          />
        ))}
      </div>

      <Card
        title="Topic performance"
        hint="Average score per topic, weakest first. Only questions you answered are counted."
      >
        {stats.topics.length === 0 ? (
          <p className="text-sm text-slate-400">Answer some questions to see topic results.</p>
        ) : (
          <div className="space-y-3">
            {stats.topics.slice(0, 12).map((t) => (
              <div key={t.topic}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700">
                    {t.topic}
                    {t.recurring && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Weak in {t.weakSessions} interviews
                      </span>
                    )}
                  </span>
                  <span className="text-slate-500">
                    {t.average} / 10 · {t.attempts} {t.attempts === 1 ? 'question' : 'questions'}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${barColor(t.average)}`}
                    style={{ width: `${t.average * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-slate-400">
          Topic names are written by the AI, so the same skill can appear under slightly different
          names. A topic is marked as recurring only when the same name shows up weak in two or more
          interviews.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Needs the most work" hint="Topics with an average of 5 or below.">
          {stats.weakTopics.length === 0 ? (
            <p className="text-sm text-slate-400">No weak topics right now. Nice work!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.weakTopics.map((t) => (
                <span key={t.topic} className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700">
                  {t.topic}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Your strongest topics" hint="Topics with an average of 7 or above.">
          {stats.strongTopics.length === 0 ? (
            <p className="text-sm text-slate-400">Keep practising. Strong topics will show up here.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.strongTopics.map((t) => (
                <span key={t.topic} className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                  {t.topic}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Your study list" hint="Topics recommended in your three most recent interviews.">
        {stats.studyTopics.length === 0 ? (
          <p className="text-sm text-slate-400">No study topics yet.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {stats.studyTopics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}