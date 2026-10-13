import { useState, useEffect } from 'react'
import api from '../api/axios'
import { STATUSES, ACTIVE_STATUSES, STATUS_STYLES } from '../constants/placement'
import { todayKey, toLocalInput } from '../utils/date'
import { Link } from 'react-router-dom'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500'

const makeEmptyForm = () => ({
  company: '',
  role: '',
  applicationDate: todayKey(),
  status: 'Applied',
  packageLpa: '',
  jobUrl: '',
  notes: '',
  interviews: [],
})

const sortApps = (list) =>
  [...list].sort(
    (a, b) =>
      b.applicationDate.localeCompare(a.applicationDate) || b.createdAt.localeCompare(a.createdAt)
  )

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

export default function Applications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(makeEmptyForm())
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('All')
  const [busyId, setBusyId] = useState(null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    api
      .get('/applications')
      .then((res) => setApplications(res.data))
      .catch(() => setError('Could not load your applications'))
      .finally(() => setLoading(false))
  }, [])

  const openNew = () => {
    setForm(makeEmptyForm())
    setEditingId('new')
    setError('')
  }

  const openEdit = (a) => {
    setForm({
      company: a.company,
      role: a.role,
      applicationDate: a.applicationDate.slice(0, 10),
      status: a.status,
      packageLpa: a.packageLpa ?? '',
      jobUrl: a.jobUrl || '',
      notes: a.notes || '',
      interviews: a.interviews.map((iv) => ({ round: iv.round, date: toLocalInput(iv.date) })),
    })
    setEditingId(a._id)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setEditingId(null)
    setError('')
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const updateInterview = (index, changes) =>
    setForm((f) => ({
      ...f,
      interviews: f.interviews.map((iv, i) => (i === index ? { ...iv, ...changes } : iv)),
    }))

  const addInterview = () =>
    setForm((f) => ({ ...f, interviews: [...f.interviews, { round: '', date: '' }] }))

  const removeInterview = (index) =>
    setForm((f) => ({ ...f, interviews: f.interviews.filter((_, i) => i !== index) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.interviews.some((iv) => !iv.date)) {
      setError('Add a date and time for each interview, or remove the empty row')
      return
    }

    const payload = {
      ...form,
      packageLpa: form.packageLpa === '' ? null : Number(form.packageLpa),
      // the browser turns the student's local time into UTC for storage
      interviews: form.interviews.map((iv) => ({
        round: iv.round,
        date: new Date(iv.date).toISOString(),
      })),
    }

    setSaving(true)
    try {
      if (editingId === 'new') {
        const { data } = await api.post('/applications', payload)
        setApplications((list) => sortApps([data, ...list]))
      } else {
        const { data } = await api.put(`/applications/${editingId}`, payload)
        setApplications((list) => sortApps(list.map((a) => (a._id === data._id ? data : a))))
      }
      closeForm()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (a, status) => {
    setError('')
    setBusyId(a._id)
    try {
      const { data } = await api.patch(`/applications/${a._id}/status`, { status })
      setApplications((list) => list.map((x) => (x._id === data._id ? data : x)))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the status')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete your ${a.company} application? This cannot be undone.`)) return
    setError('')
    setBusyId(a._id)
    try {
      await api.delete(`/applications/${a._id}`)
      setApplications((list) => list.filter((x) => x._id !== a._id))
    } catch {
      setError('Could not delete the application')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-slate-500">Loading applications...</p>

  const countOf = (status) => applications.filter((a) => a.status === status).length
  const active = applications.filter((a) => ACTIVE_STATUSES.includes(a.status)).length

  const upcoming = applications
    .filter((a) => ACTIVE_STATUSES.includes(a.status))
    .flatMap((a) =>
      a.interviews.map((iv) => ({
        key: `${a._id}-${iv.date}`,
        company: a.company,
        round: iv.round,
        date: iv.date,
      }))
    )
    .filter((iv) => new Date(iv.date).getTime() > now)
    .sort((a, b) => a.date.localeCompare(b.date))

  const visible = filter === 'All' ? applications : applications.filter((a) => a.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Placement Tracker</h1>
          <p className="mt-1 text-slate-500">Every company, stage and interview in one place.</p>
        </div>
                {!editingId && (
          <div className="flex gap-3">
            <Link
              to="/applications/analytics"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              View analytics
            </Link>
            <button
              onClick={openNew}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              + Add application
            </button>
          </div>
        )}
      </div>

      {!editingId && error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {editingId && (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {editingId === 'new' ? 'Add an application' : 'Edit application'}
          </h2>

          {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Company</label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Job role</label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Application date</label>
              <input
                name="applicationDate"
                type="date"
                value={form.applicationDate}
                onChange={handleChange}
                max={todayKey()}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Current stage</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Package (LPA, optional)</label>
              <input
                name="packageLpa"
                type="number"
                min="0"
                max="500"
                step="0.01"
                value={form.packageLpa}
                onChange={handleChange}
                placeholder="e.g. 6.5"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Job link (optional)</label>
              <input
                name="jobUrl"
                type="url"
                value={form.jobUrl}
                onChange={handleChange}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Interviews and tests</label>
                {form.interviews.length < 10 && (
                  <button
                    type="button"
                    onClick={addInterview}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    + Add interview
                  </button>
                )}
              </div>
              {form.interviews.length === 0 && (
                <p className="mt-1 text-sm text-slate-400">No interviews added yet.</p>
              )}
              <div className="mt-2 space-y-3">
                {form.interviews.map((iv, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3">
                    <input
                      value={iv.round}
                      onChange={(e) => updateInterview(i, { round: e.target.value })}
                      maxLength={60}
                      placeholder="Round, e.g. Technical round 1"
                      className="min-w-48 flex-1 rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
                    />
                    <input
                      type="datetime-local"
                      value={iv.date}
                      onChange={(e) => updateInterview(i, { date: e.target.value })}
                      className="rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeInterview(i)}
                      className="text-sm text-slate-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                maxLength={1000}
                placeholder="Contacts, topics to revise, anything you want to remember"
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
              {saving ? 'Saving...' : 'Save application'}
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

      {!editingId && applications.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total tracked" value={applications.length} />
            <StatCard label="Active" value={active} />
            <StatCard label="Interviews coming up" value={upcoming.length} />
            <StatCard label="Selected" value={countOf('Selected')} />
            <StatCard label="Rejected" value={countOf('Rejected')} />
          </div>

          {upcoming.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="font-semibold text-slate-800">Coming up</h2>
              <ul className="mt-3 space-y-2">
                {upcoming.slice(0, 3).map((iv) => (
                  <li key={iv.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-slate-700">
                      <span className="font-medium">{iv.company}</span> · {iv.round}
                    </span>
                    <span className="text-indigo-600">{formatDateTime(iv.date)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {['All', ...STATUSES].map((s) => {
              const count = s === 'All' ? applications.length : countOf(s)
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    filter === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                  }`}
                >
                  {s} ({count})
                </button>
              )
            })}
          </div>
        </>
      )}

      {applications.length === 0 && !editingId ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">
            No applications yet. Add the first company you applied to, or a job you want to apply for.
          </p>
        </div>
      ) : (
        !editingId &&
        (visible.length === 0 ? (
          <p className="text-sm text-slate-400">No applications at this stage.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((a) => (
              <div key={a._id} className="flex flex-col rounded-2xl bg-white p-5 shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-slate-800">{a.company}</h3>
                    <p className="break-words text-sm text-slate-600">{a.role}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[a.status]}`}
                  >
                    {a.status}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {a.status === 'Saved' ? 'Added' : 'Applied'} {formatDate(a.applicationDate)}
                  {a.packageLpa !== null && ` · ₹${a.packageLpa} LPA`}
                </p>

                {a.interviews.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {a.interviews.map((iv) => {
                      const past = new Date(iv.date).getTime() < now
                      return (
                        <li
                          key={`${a._id}-${iv.date}`}
                          className={`text-sm ${past ? 'text-slate-400' : 'text-slate-700'}`}
                        >
                          {iv.round} · {formatDateTime(iv.date)}
                          {past && ' (past)'}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {a.notes && (
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">{a.notes}</p>
                )}

                {a.jobUrl && (
                  <a
                    href={a.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-sm text-indigo-600 hover:underline"
                  >
                    Job link
                  </a>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                  <select
                    value={a.status}
                    onChange={(e) => changeStatus(a, e.target.value)}
                    disabled={busyId === a._id}
                    aria-label={`Change stage for ${a.company}`}
                    className="rounded-lg border border-slate-300 p-1.5 text-sm outline-none focus:border-indigo-500 disabled:opacity-60"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => openEdit(a)}
                    className="text-sm text-slate-600 hover:text-indigo-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    disabled={busyId === a._id}
                    className="text-sm text-slate-600 hover:text-red-600 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}