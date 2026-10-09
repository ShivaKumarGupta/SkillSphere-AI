import { useState, useEffect } from 'react'
import api from '../api/axios'
import TagInput from '../components/TagInput'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500'

const STATUSES = ['Planned', 'In Progress', 'Completed']

const statusStyles = {
  Planned: 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
}

const emptyForm = {
  name: '',
  description: '',
  technologies: [],
  githubUrl: '',
  liveUrl: '',
  status: 'In Progress',
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/projects')
      .then((res) => setProjects(res.data))
      .catch(() => setError('Could not load projects'))
      .finally(() => setLoading(false))
  }, [])

  const openNew = () => {
    setForm(emptyForm)
    setEditingId('new')
    setError('')
  }

  const openEdit = (project) => {
    setForm({
      name: project.name,
      description: project.description || '',
      technologies: project.technologies || [],
      githubUrl: project.githubUrl || '',
      liveUrl: project.liveUrl || '',
      status: project.status,
    })
    setEditingId(project._id)
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
        const { data } = await api.post('/projects', form)
        setProjects([data, ...projects])
      } else {
        const { data } = await api.put(`/projects/${editingId}`, form)
        setProjects(projects.map((p) => (p._id === data._id ? data : p)))
      }
      closeForm()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/projects/${project._id}`)
      setProjects(projects.filter((p) => p._id !== project._id))
    } catch {
      setError('Could not delete the project')
    }
  }

  if (loading) return <p className="text-slate-500">Loading projects...</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="mt-1 text-slate-500">Keep all your work in one place.</p>
        </div>
        {!editingId && (
          <button
            onClick={openNew}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            + Add project
          </button>
        )}
      </div>

      {!editingId && error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {editingId && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {editingId === 'new' ? 'Add a project' : 'Edit project'}
          </h2>

          {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Project name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                maxLength={1000}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <TagInput
                label="Technologies used"
                value={form.technologies}
                onChange={(technologies) => setForm({ ...form, technologies })}
                placeholder="e.g. React, Node.js, MongoDB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">GitHub repository</label>
              <input
                name="githubUrl"
                type="url"
                value={form.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Live demo</label>
              <input
                name="liveUrl"
                type="url"
                value={form.liveUrl}
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
              {saving ? 'Saving...' : 'Save project'}
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

      {projects.length === 0 && !editingId ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">No projects yet. Add your first one to build your portfolio.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <div key={p._id} className="flex flex-col rounded-2xl bg-white p-5 shadow">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyles[p.status]}`}
                >
                  {p.status}
                </span>
              </div>

              {p.description && <p className="mt-2 text-sm text-slate-600">{p.description}</p>}

              {p.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.technologies.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {p.githubUrl && (
                  <a
                    href={p.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    GitHub
                  </a>
                )}
                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Live demo
                  </a>
                )}
              </div>

              <div className="mt-auto flex gap-3 pt-4 text-sm">
                <button onClick={() => openEdit(p)} className="text-slate-600 hover:text-indigo-600">
                  Edit
                </button>
                <button onClick={() => handleDelete(p)} className="text-slate-600 hover:text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}