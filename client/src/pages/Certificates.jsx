import { useState, useEffect } from 'react'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500'

const emptyForm = {
  name: '',
  organization: '',
  issueDate: '',
  credentialUrl: '',
  relatedSkill: '',
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

export default function Certificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/certificates')
      .then((res) => setCertificates(res.data))
      .catch(() => setError('Could not load certificates'))
      .finally(() => setLoading(false))
  }, [])

  const sortByDate = (list) =>
    [...list].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))

  const openNew = () => {
    setForm(emptyForm)
    setEditingId('new')
    setError('')
  }

  const openEdit = (cert) => {
    setForm({
      name: cert.name,
      organization: cert.organization,
      issueDate: cert.issueDate.slice(0, 10),
      credentialUrl: cert.credentialUrl || '',
      relatedSkill: cert.relatedSkill || '',
    })
    setEditingId(cert._id)
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
        const { data } = await api.post('/certificates', form)
        setCertificates(sortByDate([data, ...certificates]))
      } else {
        const { data } = await api.put(`/certificates/${editingId}`, form)
        setCertificates(sortByDate(certificates.map((c) => (c._id === data._id ? data : c))))
      }
      closeForm()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cert) => {
    if (!window.confirm(`Delete "${cert.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/certificates/${cert._id}`)
      setCertificates(certificates.filter((c) => c._id !== cert._id))
    } catch {
      setError('Could not delete the certificate')
    }
  }

  if (loading) return <p className="text-slate-500">Loading certificates...</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Certificates</h1>
          <p className="mt-1 text-slate-500">Courses and credentials that back up your skills.</p>
        </div>
        {!editingId && (
          <button
            onClick={openNew}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            + Add certificate
          </button>
        )}
      </div>

      {!editingId && error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {editingId && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {editingId === 'new' ? 'Add a certificate' : 'Edit certificate'}
          </h2>

          {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Certificate name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={150}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Issuing organization
              </label>
              <input
                name="organization"
                value={form.organization}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="e.g. Coursera, Google, NPTEL"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Issue date</label>
              <input
                name="issueDate"
                type="date"
                value={form.issueDate}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Credential / verification link
              </label>
              <input
                name="credentialUrl"
                type="url"
                value={form.credentialUrl}
                onChange={handleChange}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Related skill</label>
              <input
                name="relatedSkill"
                list="skill-options"
                value={form.relatedSkill}
                onChange={handleChange}
                maxLength={50}
                placeholder="Pick one of your skills or type"
                className={inputClass}
              />
              <datalist id="skill-options">
                {(user.skills || []).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save certificate'}
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

      {certificates.length === 0 && !editingId ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">
            No certificates yet. Add your first one to strengthen your portfolio.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <div key={c._id} className="flex flex-col rounded-2xl bg-white p-5 shadow">
              <h3 className="font-semibold text-slate-800">{c.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {c.organization} · {formatDate(c.issueDate)}
              </p>

              {c.relatedSkill && (
                <div className="mt-3">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                    {c.relatedSkill}
                  </span>
                </div>
              )}

              {c.credentialUrl && (
                <a
                  href={c.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm text-indigo-600 hover:underline"
                >
                  Verify credential
                </a>
              )}

              <div className="mt-auto flex gap-3 pt-4 text-sm">
                <button onClick={() => openEdit(c)} className="text-slate-600 hover:text-indigo-600">
                  Edit
                </button>
                <button onClick={() => handleDelete(c)} className="text-slate-600 hover:text-red-600">
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