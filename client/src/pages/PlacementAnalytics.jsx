import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/axios'
import { todayKey } from '../utils/date'

const REJECTION_HELP = {
  Applied: {
    text: 'Most of your rejections come right after applying. That often points to the resume or to how well the role fits, so improve your resume with the AI analyzer.',
    to: '/resume/analysis',
    label: 'Open the AI Resume Analyzer',
  },
  'Online Assessment': {
    text: 'Most of your rejections happen at the online assessment. Practise timed coding and aptitude-style problems.',
    to: '/dsa',
    label: 'Open the DSA tracker',
  },
  'Technical Interview': {
    text: 'Most of your rejections happen in technical interviews. Practise explaining your answers out loud with mock interviews.',
    to: '/interview',
    label: 'Start a mock interview',
  },
  'HR Interview': {
    text: 'Most of your rejections happen in HR rounds. Practise behavioural questions and how you present yourself.',
    to: '/interview',
    label: 'Start an HR mock interview',
  },
}

const monthLabel = (key) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })

const lpa = (n) => (n === null || n === undefined ? 'N/A' : `₹${n} LPA`)

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

export default function PlacementAnalytics() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/applications/analytics', { params: { today: todayKey() } })
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load your analytics'))
  }, [])

  if (error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
  if (!stats) return <p className="text-slate-500">Loading...</p>

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Placement analytics</h1>
        <p className="mt-1 text-slate-500">How your applications are progressing.</p>
      </div>
      <Link
        to="/applications"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to tracker
      </Link>
    </div>
  )

  if (stats.applied === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">
            No applications yet. Add a company you applied to and your analytics will appear here.
            {stats.saved > 0 && ` Jobs you only saved (${stats.saved}) are not counted as applications.`}
          </p>
          <Link
            to="/applications"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go to the tracker
          </Link>
        </div>
      </div>
    )
  }

  const topRejection = [...stats.rejectionsByStage].sort((a, b) => b.count - a.count)[0]
  const insight = topRejection && topRejection.count >= 2 ? REJECTION_HELP[topRejection.stage] : null
  const monthly = stats.monthly.map((m) => ({ label: monthLabel(m.month), count: m.count }))

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Applications sent"
          value={stats.applied}
          hint={stats.saved > 0 ? `${stats.saved} saved jobs not counted` : undefined}
        />
        <StatCard label="Still active" value={stats.active} />
        <StatCard
          label="Reached interviews"
          value={stats.interviewRate === null ? 'N/A' : `${stats.interviewRate}%`}
          hint="Technical interview or beyond"
        />
        <StatCard
          label="Offers"
          value={stats.selected}
          hint={stats.offerRate === null ? undefined : `${stats.offerRate}% of applications`}
        />
      </div>

      <Card
        title="Application funnel"
        hint="How many applications reached each stage or went further."
      >
        <div className="space-y-4">
          {stats.funnel.map((f) => {
            const share = Math.round((f.count / stats.applied) * 100)
            return (
              <div key={f.stage}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{f.stage}</span>
                  <span className="text-slate-500">
                    {f.count} · {share}%
                  </span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Built from the stage changes you recorded. If a company skipped a round, the application
          still counts toward the earlier stages.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Where rejections happened" hint="The stage an application was in when it was rejected.">
          {stats.rejected === 0 ? (
            <p className="text-sm text-slate-400">No rejections recorded.</p>
          ) : (
            <ul className="space-y-2">
              {stats.rejectionsByStage.map((r) => (
                <li key={r.stage} className="flex justify-between text-sm">
                  <span className="text-slate-700">{r.stage}</span>
                  <span className={r.count > 0 ? 'font-medium text-red-600' : 'text-slate-400'}>
                    {r.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Packages" hint="Amounts you entered, in lakhs per annum.">
          {stats.package.tracked === 0 ? (
            <p className="text-sm text-slate-400">Add a package to your applications to see statistics.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-700">Average across applications</span>
                <span className="font-medium text-slate-800">{lpa(stats.package.average)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-700">Highest across applications</span>
                <span className="font-medium text-slate-800">{lpa(stats.package.highest)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-700">Highest offer</span>
                <span className="font-medium text-green-700">
                  {stats.package.highestOffer
                    ? `${lpa(stats.package.highestOffer.packageLpa)} · ${stats.package.highestOffer.company}`
                    : 'No offer with a package yet'}
                </span>
              </li>
            </ul>
          )}
        </Card>
      </div>

      <Card title="Applications per month" hint="The last 6 months, by application date.">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} width={30} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Applications" fill="#2A7F8E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {insight && (
        <div className="rounded-2xl bg-indigo-50 p-6">
          <h2 className="font-semibold text-indigo-900">A pattern worth acting on</h2>
          <p className="mt-2 text-sm text-indigo-900">{insight.text}</p>
          <Link
            to={insight.to}
            className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {insight.label}
          </Link>
          <p className="mt-3 text-xs text-indigo-700">
            This is a simple rule based on your own data, not a prediction. With few applications,
            treat it as a hint.
          </p>
        </div>
      )}
    </div>
  )
}