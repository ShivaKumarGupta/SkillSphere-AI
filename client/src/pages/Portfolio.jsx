import { useState, useEffect } from 'react'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500'

const SECTIONS = [
  ['showEducation', 'Education', 'College, degree, branch, graduation year and CGPA from your profile'],
  ['showSkills', 'Skills', 'The skills listed in your profile'],
  ['showProjects', 'Projects', 'Projects marked In Progress or Completed (Planned ones stay hidden)'],
  ['showCertificates', 'Certificates', 'Your certificates, with their verification links'],
  [
    'showEmail',
    'Email address',
    'Your email, shown as a link. Leave this off if you do not want it visible to anyone or collected by bots.',
  ],
]

const slugify = (name) => {
  const s = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/, '')
  return s.length >= 3 ? s : ''
}

export default function Portfolio() {
  const { user } = useAuth()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api
      .get('/portfolio')
      .then((res) => {
        const p = res.data.portfolio
        setSaved(p)
        setForm(
          p || {
            slug: slugify(user.name),
            isPublic: false,
            headline: '',
            bio: '',
            showEmail: false,
            showEducation: true,
            showSkills: true,
            showProjects: true,
            showCertificates: true,
          }
        )
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not load your portfolio settings' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const { data } = await api.put('/portfolio', form)
      setSaved(data.portfolio)
      setForm(data.portfolio)
      setMessage({
        type: 'success',
        text: data.portfolio.isPublic ? 'Saved. Your portfolio is public.' : 'Saved. Your portfolio is private.',
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  const publicUrl = saved ? `${window.location.origin}/u/${saved.slug}` : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage({ type: 'error', text: 'Could not copy automatically. Select the link and copy it.' })
    }
  }

  if (!form && !message) return <p className="text-slate-500">Loading...</p>
  if (!form) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{message.text}</p>

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Public portfolio</h1>
        <p className="mt-1 text-slate-500">A page you can share with recruiters. It is private until you turn it on.</p>
      </div>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </p>
      )}

      {saved && (
        <div className="rounded-2xl bg-white p-6 shadow">
          {saved.isPublic ? (
            <>
              <p className="text-sm font-medium text-green-700">Your portfolio is public</p>
              <p className="mt-2 break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{publicUrl}</p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Open public page
                </a>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                While you run the project on your computer, this link only works on your computer.
                After deployment it becomes a real link.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Your portfolio is <span className="font-medium">private</span>. Nobody else can see it.
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => set('isPublic', e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-medium text-slate-800">Make my portfolio public</span>
            <span className="block text-sm text-slate-500">
              Anyone with the link can view it, without logging in. Untick this and save to make it
              private again right away.
            </span>
          </span>
        </label>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">Your link name</label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">{window.location.origin}/u/</span>
            <input
              value={form.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase())}
              required
              minLength={3}
              maxLength={30}
              placeholder="your-name"
              className="min-w-40 flex-1 rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            3 to 30 characters: lowercase letters, numbers and hyphens. Changing it later breaks links you
            already shared.
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Headline</label>
          <input
            value={form.headline}
            onChange={(e) => set('headline', e.target.value)}
            maxLength={100}
            placeholder="e.g. Final-year CS student building full-stack apps"
            className={inputClass}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">About you</label>
          <textarea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="A few sentences about what you build and what you are looking for."
            className={inputClass}
          />
          <p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/500</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">What visitors will see</h2>
        <p className="mt-1 text-sm text-slate-500">
          Always shown: your name, target role, headline, about text, and your GitHub and LinkedIn
          links from your profile. Never shown: your resume, AI feedback, interview scores, DSA data
          and applications.
        </p>

        <div className="mt-4 space-y-4">
          {SECTIONS.map(([key, label, hint]) => (
            <label key={key} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="font-medium text-slate-800">{label}</span>
                <span className="block text-sm text-slate-500">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save portfolio'}
      </button>
    </form>
  )
}