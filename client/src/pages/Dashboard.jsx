import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'
import { todayKey } from '../utils/date'
import PageSkeleton from '../components/PageSkeleton'

const readinessLabel = (pct) => {
  if (pct < 30) return 'Just getting started'
  if (pct < 60) return 'Building momentum'
  if (pct < 85) return 'Looking strong'
  return 'Placement ready'
}

// The ring fills once when the page opens
function Ring({ value }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), 60)
    return () => clearTimeout(timer)
  }, [])

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - (shown ? value : 0) / 100)

  return (
    <div className="relative h-44 w-44">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={`Career readiness ${value} percent`}
      >
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-200" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-indigo-600 transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-4xl font-bold text-indigo-900">{value}%</span>
      </div>
    </div>
  )
}

function Tile({ to, label, value, hint }) {
  return (
    <Link
      to={to}
      className="rounded-2xl bg-white p-5 shadow ring-1 ring-transparent transition-colors hover:ring-indigo-300"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-slate-800">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>}
    </Link>
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
  if (!data) return <PageSkeleton />

  const { readiness, skills, projects, certificates, dsa, roadmap, interviews, applications, resume, nextActions } = data

  const first = nextActions[0]
  const rest = nextActions.slice(1)
  const proven = skills.filter((s) => s.projects + s.certificates > 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.name}</h1>
        <p className="mt-1 text-slate-500">
          {user.targetRole
            ? `Target role: ${user.targetRole}`
            : 'Set a target role in your profile to personalise your trail'}
        </p>
      </div>

      <section className="grid gap-8 rounded-3xl bg-white p-6 shadow lg:grid-cols-[auto_1fr] lg:p-8">
        <div className="flex flex-col items-center justify-center">
          <Ring value={readiness.percentage} />
          <p className="mt-3 font-display font-semibold text-indigo-900">
            {readinessLabel(readiness.percentage)}
          </p>
          <p className="text-sm text-slate-500">Career readiness</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-800">What to work on next</h2>

          {!first ? (
            <p className="mt-4 text-sm text-green-700">
              You are on top of everything right now. Keep your streak going.
            </p>
          ) : (
            <>
              <div className="mt-4 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
                <p className="font-semibold text-slate-800">{first.title}</p>
                <p className="mt-1 text-sm text-slate-600">{first.detail}</p>
                <Link
                  to={first.link}
                  className="mt-3 inline-block rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
                >
                  Open
                </Link>
              </div>

              {rest.length > 0 && (
                <ul className="mt-4 divide-y divide-slate-100">
                  {rest.map((a) => (
                    <li key={a.title} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{a.title}</p>
                        <p className="text-xs text-slate-500">{a.detail}</p>
                      </div>
                      <Link
                        to={a.link}
                        className="shrink-0 text-sm font-semibold text-indigo-700 hover:underline"
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">What your readiness is made of</h2>
        <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {readiness.areas.map((a) => (
            <div key={a.key}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">{a.label}</span>
                <span className="text-slate-500">{a.percentage}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${a.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          to="/profile"
          label="Skills with proof"
          value={skills.length === 0 ? 'N/A' : `${proven} / ${skills.length}`}
          hint="Backed by a project or certificate"
        />
        <Tile to="/projects" label="Projects" value={projects.total} hint={`${projects.byStatus.Completed} completed`} />
        <Tile to="/certificates" label="Certificates" value={certificates.total} hint="Credentials earned" />
        <Tile to="/dsa" label="DSA solved" value={dsa.total} hint={`${dsa.streak.current}-day streak`} />
        <Tile
          to="/roadmap"
          label="Roadmap"
          value={roadmap.total === 0 ? 'Not started' : `${roadmap.done} / ${roadmap.total}`}
          hint={roadmap.next ? `Next: ${roadmap.next}` : roadmap.total > 0 ? 'All milestones done' : 'Generate your trail'}
        />
        <Tile
          to="/resume/analysis"
          label="Resume AI score"
          value={resume.score === null ? 'N/A' : resume.score}
          hint={resume.score === null ? 'Not reviewed yet' : 'Out of 100'}
        />
        <Tile
          to={interviews.total > 0 ? '/interview/analytics' : '/interview'}
          label="Mock interviews"
          value={interviews.total === 0 ? 'N/A' : `${interviews.average} avg`}
          hint={interviews.total === 0 ? 'None taken yet' : `${interviews.total} completed`}
        />
        <Tile
          to="/applications"
          label="Applications"
          value={applications.total === 0 ? 'N/A' : `${applications.active} active`}
          hint={
            applications.total === 0
              ? 'None tracked yet'
              : `${applications.total} tracked, ${applications.selected} selected`
          }
        />
      </div>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">Your skills</h2>
        {skills.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No skills yet.{' '}
            <Link to="/profile" className="font-medium text-indigo-700 hover:underline">
              Add them in your profile
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((s) => {
                const isProven = s.projects + s.certificates > 0
                const proof = [
                  s.projects > 0 && `${s.projects} ${s.projects === 1 ? 'project' : 'projects'}`,
                  s.certificates > 0 && `${s.certificates} ${s.certificates === 1 ? 'certificate' : 'certificates'}`,
                ]
                  .filter(Boolean)
                  .join(', ')

                return (
                  <span
                    key={s.skill}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      isProven ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.skill}
                    <span className="ml-1.5 text-xs opacity-75">
                      {isProven ? `Proven by ${proof}` : 'No proof yet'}
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
      </section>
    </div>
  )
}