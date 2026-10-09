import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { DIFFICULTY_COLORS } from '../constants/dsa'

const formatDay = (key) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

const cellColor = (count) => {
  if (count === 0) return 'bg-slate-200'
  if (count === 1) return 'bg-indigo-200'
  if (count === 2) return 'bg-indigo-400'
  return 'bg-indigo-600'
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export default function DsaStats({ stats, onSaveGoal }) {
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalValue, setGoalValue] = useState('')
  const [goalError, setGoalError] = useState('')

  const { total, difficulty, topics, daily, weekly, streak, goal } = stats

  const goalPercent = Math.min(100, Math.round((goal.solvedThisWeek / goal.weekly) * 100))
  const maxTopic = Math.max(1, ...topics.map((t) => t.count))
  const notStarted = topics.filter((t) => t.count === 0 && t.topic !== 'Other').map((t) => t.topic)

  const weeklyData = weekly.map((w) => ({ label: formatDay(w.weekStart), count: w.count }))
  const pieData = Object.entries(difficulty)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)

  const startEditGoal = () => {
    setGoalValue(String(goal.weekly))
    setGoalError('')
    setEditingGoal(true)
  }

  const saveGoal = async () => {
    try {
      await onSaveGoal(Number(goalValue))
      setEditingGoal(false)
    } catch (err) {
      setGoalError(err.response?.data?.message || 'Could not save goal')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Problems solved" value={total} />
        <StatCard
          label="Current streak"
          value={`${streak.current} ${streak.current === 1 ? 'day' : 'days'}`}
          hint="Solve one today to keep it going"
        />
        <StatCard
          label="Longest streak"
          value={`${streak.longest} ${streak.longest === 1 ? 'day' : 'days'}`}
        />

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">This week</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">
            {goal.solvedThisWeek}
            <span className="text-lg font-medium text-slate-400"> / {goal.weekly}</span>
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${goalPercent}%` }}
            />
          </div>

          {editingGoal ? (
            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  className="w-20 rounded-lg border border-slate-300 p-1.5 text-sm outline-none focus:border-indigo-500"
                />
                <button
                  onClick={saveGoal}
                  className="rounded-lg bg-indigo-600 px-3 text-sm text-white hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingGoal(false)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
              {goalError && <p className="mt-1 text-xs text-red-600">{goalError}</p>}
            </div>
          ) : (
            <button
              onClick={startEditGoal}
              className="mt-3 text-xs text-indigo-600 hover:underline"
            >
              Change weekly goal
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">Last 14 days</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {daily.map((d) => (
            <div
              key={d.date}
              title={`${formatDay(d.date)}: ${d.count} solved`}
              className={`h-8 w-8 rounded-md ${cellColor(d.count)}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">Darker squares mean more problems solved that day.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="font-semibold text-slate-800">Weekly activity</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} width={30} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Problems" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="font-semibold text-slate-800">Difficulty split</h2>
          {pieData.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-400">
              Log a problem to see your split.
            </p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={DIFFICULTY_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">Topic-wise progress</h2>
        <div className="mt-4 space-y-3">
          {topics.map((t) => (
            <div key={t.topic} className="flex items-center gap-3">
              <span className="w-48 shrink-0 text-sm text-slate-600">{t.topic}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${(t.count / maxTopic) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm font-medium text-slate-700">{t.count}</span>
            </div>
          ))}
        </div>
        {total > 0 && notStarted.length > 0 && (
          <p className="mt-4 text-sm text-slate-500">
            Not started yet: <span className="text-slate-700">{notStarted.join(', ')}</span>
          </p>
        )}
      </div>
    </div>
  )
}