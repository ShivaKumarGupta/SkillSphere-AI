import { useState, useEffect } from 'react'
import api from '../api/axios'
import DsaStats from '../components/DsaStats'
import { PLATFORMS, DIFFICULTIES, TOPICS, DIFFICULTY_BADGES } from '../constants/dsa'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500'

const todayKey = () => {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const makeEmptyForm = () => ({
  title: '',
  platform: 'LeetCode',
  difficulty: 'Easy',
  topic: 'Arrays',
  solvedDate: todayKey(),
  link: '',
})

const sortProblems = (list) =>
  [...list].sort(
    (a, b) => b.solvedDate.localeCompare(a.solvedDate) || b.createdAt.localeCompare(a.createdAt)
  )

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

const PAGE_SIZE = 15

export default function Dsa() {
  const [problems, setProblems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(makeEmptyForm())
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const fetchStats = async () => {
    const { data } = await api.get('/dsa/stats', { params: { today: todayKey() } })
    setStats(data)
  }

  useEffect(() => {
    Promise.all([
      api.get('/dsa/problems'),
      api.get('/dsa/stats', { params: { today: todayKey() } }),
    ])
      .then(([problemsRes, statsRes]) => {
        setProblems(problemsRes.data)
        setStats(statsRes.data)
      })
      .catch(() => setError('Could not load your DSA progress'))
      .finally(() => setLoading(false))
  }, [])

  const openNew = () => {
    setForm(makeEmptyForm())
    setEditingId('new')
    setError('')
  }

  const openEdit = (p) => {
    setForm({
      title: p.title,
      platform: p.platform,
      difficulty: p.difficulty,
      topic: p.topic,
      solvedDate: p.solvedDate.slice(0, 10),
      link: p.link || '',
    })
    setEditingId(p._id)
    setError('')
  }

  const closeForm = () => {
    setEditingId(null)
    setError('')
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId === 'new') {
        const { data } = await api.post('/dsa/problems', form)
        setProblems(sortProblems([data, ...problems]))
      } else {
        const { data } = await api.put(`/dsa/problems/${editingId}`, form)
        setProblems(sortProblems(problems.map((p) => (p._id === data._id ? data : p))))
      }
      closeForm()
      fetchStats().catch(() => {})
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.title}" from your log?`)) return
    try {
      await api.delete(`/dsa/problems/${p._id}`)
      setProblems(problems.filter((x) => x._id !== p._id))
      fetchStats().catch(() => {})
    } catch {
      setError('Could not delete the problem')
    }
  }

  const saveGoal = async (weeklyGoal) => {
    await api.put('/dsa/goal', { weeklyGoal })
    await fetchStats()
  }

  if (loading) return <p className="text-slate-500">Loading your DSA progress...</p>

  const visible = showAll ? problems : problems.slice(0, PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">DSA &amp; Coding Progress</h1>
          <p className="mt-1 text-slate-500">Log what you solve and watch the patterns appear.</p>
        </div>
        {!editingId && (
          <button
            onClick={openNew}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            + Log a problem
          </button>
        )}
      </div>

      {!editingId && error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {editingId && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {editingId === 'new' ? 'Log a solved problem' : 'Edit problem'}
          </h2>

          {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Problem title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={150}
                placeholder="e.g. Two Sum"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Platform</label>
              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                className={inputClass}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Difficulty</label>
              <select
                name="difficulty"
                value={form.difficulty}
                onChange={handleChange}
                className={inputClass}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Topic</label>
              <select
                name="topic"
                value={form.topic}
                onChange={handleChange}
                className={inputClass}
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Date solved</label>
              <input
                name="solvedDate"
                type="date"
                value={form.solvedDate}
                onChange={handleChange}
                max={todayKey()}
                required
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Problem link (optional)
              </label>
              <input
                name="link"
                type="url"
                value={form.link}
                onChange={handleChange}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save problem'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {stats && (
        <div className="mt-6">
          <DsaStats stats={stats} onSaveGoal={saveGoal} />
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">Problem log</h2>

        {problems.length === 0 ? (
          <p className="mt-4 text-center text-sm text-slate-400">
            Nothing logged yet. Use "Log a problem" to start your streak.
          </p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-slate-100">
              {visible.map((p) => (
                <li key={p._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    {p.link ? (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {p.title}
                      </a>
                    ) : (
                      <span className="font-medium text-slate-800">{p.title}</span>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {p.platform} · {p.topic} · {formatDate(p.solvedDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${DIFFICULTY_BADGES[p.difficulty]}`}
                    >
                      {p.difficulty}
                    </span>
                    <button
                      onClick={() => openEdit(p)}
                      className="text-sm text-slate-600 hover:text-indigo-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="text-sm text-slate-600 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {problems.length > PAGE_SIZE && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-4 text-sm text-indigo-600 hover:underline"
              >
                {showAll ? 'Show fewer' : `Show all ${problems.length} problems`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}