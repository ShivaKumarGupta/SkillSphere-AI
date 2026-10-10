import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'
import { todayKey } from '../utils/date'

const readinessLabel = (pct) => {
  if (pct < 30) return 'Just getting started'
  if (pct < 60) return 'Building momentum'
  if (pct < 85) return 'Looking strong'
  return 'Placement ready'
}

function StatCard({ to, label, value, hint }) {
  return (
    <Link to={to} className="rounded-2xl bg-white p-5 shadow transition hover:shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </Link>
  )
}

function ComingSoon({ title, text }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 p-5">
      <p className="font-medium text-slate-600">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
      <span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
        Coming soon
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard', { params: { today: todayKey() } })
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load your dashboard'))
  }, [])

  if (error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
  if (!data) return <p className="text-slate-500">Loading your dashboard...</p>

  const { readiness, skills, projects, certificates, dsa, nextActions } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.name} 👋</h1>
        <p className="mt-1 text-slate-500">
          {user.targetRole
            ? `Target role: ${user.targetRole}`
            : 'Set a target role in your profile to personalise your journey'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
          <p className="text-sm text-slate-500">Career readiness</p>
          <p className="mt-1 text-5xl font-bold text-indigo-600">{readiness.percentage}%</p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {readinessLabel(readiness.percentage)}
          </p>

          <div className="mt-5 space-y-3">
            {readiness.areas.map((a) => (
              <div key={a.key}>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{a.label}</span>
                  <span>{a.percentage}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${a.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow lg:col-span-3">
          <h2 className="font-semibold text-slate-800">What to work on next</h2>
          {nextActions.length === 0 ? (
            <p className="mt-4 text-sm text-green-600">
              🎉 You are on top of everything right now. Keep your streak going!
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {nextActions.map((a, i) => (
                <li key={a.title} className="flex gap-3 rounded-xl bg-slate-50 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{a.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{a.detail}</p>
                    <Link
                      to={a.link}
                      className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline"
                    >
                      Go there →
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          to="/projects"
          label="Projects"
          value={projects.total}
          hint={`${projects.byStatus.Completed} completed`}
        />
        <StatCard
          to="/certificates"
          label="Certificates"
          value={certificates.total}
          hint="Credentials earned"
        />
        <StatCard
          to="/dsa"
          label="DSA solved"
          value={dsa.total}
          hint={`${dsa.streak.current}-day streak`}
        />
        <StatCard
          to="/dsa"
          label="This week"
          value={`${dsa.goal.solvedThisWeek} / ${dsa.goal.weekly}`}
          hint="Weekly DSA goal"
        />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">Your skills</h2>
        {skills.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No skills yet.{' '}
            <Link to="/profile" className="text-indigo-600 hover:underline">
              Add them in your profile
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((s) => {
                const proven = s.projects + s.certificates > 0
                const proof = [
                  s.projects > 0 && `${s.projects} ${s.projects === 1 ? 'project' : 'projects'}`,
                  s.certificates > 0 &&
                    `${s.certificates} ${s.certificates === 1 ? 'certificate' : 'certificates'}`,
                ]
                  .filter(Boolean)
                  .join(', ')

                return (
                  <span
                    key={s.skill}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      proven ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.skill}
                    <span className="ml-1.5 text-xs opacity-75">
                      {proven ? `✓ ${proof}` : '· no proof yet'}
                    </span>
                  </span>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              A skill counts as proven when it appears in a project's technologies or is the related
              skill of a certificate. Use the same spelling in all places.
            </p>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ComingSoon title="Resume" text="Build and analyse your resume" />
        <ComingSoon title="Mock interviews" text="Practice and get scored feedback" />
        <ComingSoon title="Applications" text="Track every company you apply to" />
      </div>
    </div>
  )
}