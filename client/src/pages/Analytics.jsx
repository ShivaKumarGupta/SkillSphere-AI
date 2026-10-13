import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import api from '../api/axios'
import { todayKey } from '../utils/date'
import { DIFFICULTY_COLORS } from '../constants/dsa'

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

const fullDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function Tile({ to, label, value, hint }) {
  return (
    <Link to={to} className="rounded-2xl bg-white p-5 shadow transition hover:shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Link>
  )
}

function Card({ title, hint, link, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">{title}</h2>
          {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
        </div>
        {link && (
          <Link to={link.to} className="shrink-0 text-sm text-indigo-600 hover:underline">
            {link.label}
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function ScoreLine({ data, emptyText }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">{emptyText}</p>
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} width={34} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${value} / 100`, 'Score']}
            labelFormatter={(label, payload) =>
              payload && payload[0] ? `${label} · ${payload[0].payload.date}` : label
            }
          />
          <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/analytics', { params: { today: todayKey() } })
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load your analytics'))
  }, [])

  if (error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
  if (!data) return <p className="text-slate-500">Loading...</p>

  const { skills, dsa, interviews, resume, applications, roadmap, activity } = data

  const activityData = activity.map((w) => ({
    label: shortDate(w.weekStart),
    'DSA problems': w.dsa,
    'Mock interviews': w.interviews,
    'Roadmap milestones': w.milestones,
    Applications: w.applications,
  }))
  const hasActivity = activity.some((w) => w.total > 0)

  const resumeData = resume.trend.map((t) => ({ label: `#${t.number}`, score: t.score, date: fullDate(t.at) }))
  const interviewData = interviews.trend.map((t) => ({
    label: `#${t.number}`,
    score: t.score,
    date: fullDate(t.completedAt),
  }))

  const dsaTotal = Math.max(1, dsa.total)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Your analytics</h1>
        <p className="mt-1 text-slate-500">Everything about your preparation, in one place.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          to="/profile"
          label="Skills with proof"
          value={skills.total === 0 ? 'N/A' : `${skills.proven} / ${skills.total}`}
          hint="Backed by a project or certificate"
        />
        <Tile
          to="/dsa"
          label="DSA problems solved"
          value={dsa.total}
          hint={`${dsa.streak.current}-day streak · ${dsa.goal.solvedThisWeek}/${dsa.goal.weekly} this week`}
        />
        <Tile
          to="/resume/analysis"
          label="Resume AI score"
          value={resume.latest === null ? 'N/A' : resume.latest}
          hint={
            resume.change === null
              ? 'Analyze again after improving to see your change'
              : `${resume.change > 0 ? '+' : ''}${resume.change} since your first analysis`
          }
        />
        <Tile
          to="/interview/analytics"
          label="Mock interview average"
          value={interviews.average === null ? 'N/A' : interviews.average}
          hint={`${interviews.total} ${interviews.total === 1 ? 'interview' : 'interviews'} completed`}
        />
        <Tile
          to="/applications/analytics"
          label="Applications sent"
          value={applications.applied}
          hint={`${applications.active} active · ${applications.selected} selected`}
        />
        <Tile
          to="/roadmap"
          label="Roadmap progress"
          value={roadmap.total === 0 ? 'N/A' : `${roadmap.done} / ${roadmap.total}`}
          hint="Milestones completed"
        />
      </div>

      <Card
        title="Weekly activity"
        hint="What you did each week for the last 8 weeks. Week boundaries use UTC."
      >
        {!hasActivity ? (
          <p className="text-sm text-slate-400">
            No activity in the last 8 weeks. Solve a problem, finish an interview or tick a milestone
            and it will show up here.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} width={30} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="DSA problems" stackId="a" fill="#4f46e5" />
                <Bar dataKey="Mock interviews" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Roadmap milestones" stackId="a" fill="#22c55e" />
                <Bar dataKey="Applications" stackId="a" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Resume score over time"
          hint="Each point is one AI analysis."
          link={{ to: '/resume/analysis', label: 'Open analyzer' }}
        >
          <ScoreLine data={resumeData} emptyText="No resume analysis yet." />
        </Card>
        <Card
          title="Interview score trend"
          hint="Your last 10 mock interviews."
          link={{ to: '/interview/analytics', label: 'Details' }}
        >
          <ScoreLine data={interviewData} emptyText="No completed interviews yet." />
        </Card>
      </div>

      <Card
        title="Skills"
        hint="Green skills are backed by a project or certificate."
        link={{ to: '/projects', label: 'Add projects' }}
      >
        {skills.items.length === 0 ? (
          <p className="text-sm text-slate-400">
            No skills yet.{' '}
            <Link to="/profile" className="text-indigo-600 hover:underline">
              Add them in your profile
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.items.map((s) => {
              const proven = s.projects + s.certificates > 0
              return (
                <span
                  key={s.skill}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    proven ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s.skill}
                </span>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="DSA by difficulty" link={{ to: '/dsa', label: 'DSA tracker' }}>
          {dsa.total === 0 ? (
            <p className="text-sm text-slate-400">No problems logged yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(dsa.difficulty).map(([level, count]) => (
                <div key={level}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{level}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / dsaTotal) * 100}%`,
                        backgroundColor: DIFFICULTY_COLORS[level],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Application funnel" link={{ to: '/applications/analytics', label: 'Details' }}>
          {applications.applied === 0 ? (
            <p className="text-sm text-slate-400">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.funnel.map((f) => (
                <div key={f.stage}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{f.stage}</span>
                    <span className="text-slate-500">{f.count}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(f.count / applications.applied) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}