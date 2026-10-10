import { useState, useEffect } from 'react'
import api from '../api/axios'
import TagInput from '../components/TagInput'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500 disabled:bg-slate-100'

const CONTACT_FIELDS = [
  ['fullName', 'Full name', 'text'],
  ['email', 'Email', 'email'],
  ['phone', 'Phone', 'text'],
  ['location', 'Location (e.g. Bilaspur, India)', 'text'],
  ['linkedin', 'LinkedIn link', 'url'],
  ['github', 'GitHub link', 'url'],
  ['portfolio', 'Portfolio / website link', 'url'],
]

const BLANK = {
  education: { institution: '', degree: '', field: '', startYear: '', endYear: '', score: '' },
  projects: { name: '', technologies: [], link: '', bulletsText: '' },
  experience: { company: '', role: '', startDate: '', endDate: '', current: false, bulletsText: '' },
  certifications: { name: '', organization: '', year: '' },
  codingProfiles: { platform: '', url: '' },
}

const linesToText = (arr) => (arr || []).join('\n')
const textToLines = (text) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

// server data -> form state
const toForm = (r) => ({
  contact: Object.fromEntries(CONTACT_FIELDS.map(([key]) => [key, r.contact?.[key] || ''])),
  summary: r.summary || '',
  education: (r.education || []).map((e) => ({ ...BLANK.education, ...e })),
  skills: r.skills || [],
  projects: (r.projects || []).map((p) => ({
    name: p.name || '',
    technologies: p.technologies || [],
    link: p.link || '',
    bulletsText: linesToText(p.bullets),
  })),
  experience: (r.experience || []).map((x) => ({
    company: x.company || '',
    role: x.role || '',
    startDate: x.startDate || '',
    endDate: x.endDate || '',
    current: !!x.current,
    bulletsText: linesToText(x.bullets),
  })),
  achievementsText: linesToText(r.achievements),
  certifications: (r.certifications || []).map((c) => ({ ...BLANK.certifications, ...c })),
  codingProfiles: (r.codingProfiles || []).map((p) => ({ ...BLANK.codingProfiles, ...p })),
})

// form state -> what we send to the server
const fromForm = (f) => ({
  contact: f.contact,
  summary: f.summary,
  education: f.education,
  skills: f.skills,
  projects: f.projects.map(({ bulletsText, ...p }) => ({ ...p, bullets: textToLines(bulletsText) })),
  experience: f.experience.map(({ bulletsText, ...x }) => ({ ...x, bullets: textToLines(bulletsText) })),
  achievements: textToLines(f.achievementsText),
  certifications: f.certifications,
  codingProfiles: f.codingProfiles,
})

function TextInput({ label, value, onChange, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} {...props} />
    </div>
  )
}

function TextArea({ label, value, onChange, hint, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} {...props} />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function Section({ title, hint, onAdd, addLabel, isEmpty, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="shrink-0 rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            {addLabel}
          </button>
        )}
      </div>
      <div className="mt-4 space-y-4">
        {isEmpty && <p className="text-sm text-slate-400">Nothing added yet.</p>}
        {children}
      </div>
    </section>
  )
}

function Entry({ onRemove, children }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-3 text-sm text-slate-500 hover:text-red-600"
      >
        Remove
      </button>
    </div>
  )
}

export default function Resume() {
  const [form, setForm] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/resume')
      .then((res) => setForm(toForm(res.data)))
      .catch(() => setLoadError('Could not load your resume'))
  }, [])

  const setContact = (key, value) =>
    setForm((f) => ({ ...f, contact: { ...f.contact, [key]: value } }))
  const setTop = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const updateItem = (section, index, changes) =>
    setForm((f) => ({
      ...f,
      [section]: f[section].map((item, i) => (i === index ? { ...item, ...changes } : item)),
    }))
  const addItem = (section) =>
    setForm((f) => ({ ...f, [section]: [...f[section], { ...BLANK[section] }] }))
  const removeItem = (section, index) =>
    setForm((f) => ({ ...f, [section]: f[section].filter((_, i) => i !== index) }))

  const showMessage = (type, text) => {
    setMessage({ type, text })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveForm = async () => {
    const res = await api.put('/resume', fromForm(form))
    setForm(toForm(res.data))
  }

  const handleSave = async () => {
    setMessage(null)
    setSaving(true)
    try {
      await saveForm()
      showMessage('success', 'Resume saved')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleAutofill = async () => {
    const ok = window.confirm(
      'This refreshes your education, skills, projects and certificates from your SkillSphere data and replaces what is currently in those sections. Your summary, experience, achievements and coding profiles stay as they are. Continue?'
    )
    if (!ok) return

    setMessage(null)
    setSaving(true)
    try {
      await saveForm() // keep any edits you made elsewhere on the page
      const res = await api.post('/resume/autofill')
      setForm(toForm(res.data))
      showMessage('success', 'Refreshed from your SkillSphere data')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loadError) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{loadError}</p>
  if (!form) return <p className="text-slate-500">Loading your resume...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Resume</h1>
          <p className="mt-1 text-slate-500">
            Pre-filled from your profile. Edit anything, then save.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAutofill}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh from my profile data
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save resume'}
          </button>
        </div>
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

      <Section title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map(([key, label, type]) => (
            <TextInput
              key={key}
              label={label}
              type={type}
              value={form.contact[key]}
              onChange={(v) => setContact(key, v)}
              maxLength={key === 'phone' ? 30 : 300}
            />
          ))}
        </div>
      </Section>

      <Section title="Summary" hint="2 to 3 lines about who you are and the role you want.">
        <TextArea
          label="Professional summary"
          rows={4}
          maxLength={600}
          value={form.summary}
          onChange={(v) => setTop('summary', v)}
        />
      </Section>

      <Section
        title="Education"
        onAdd={() => addItem('education')}
        addLabel="+ Add education"
        isEmpty={form.education.length === 0}
      >
        {form.education.map((e, i) => (
          <Entry key={i} onRemove={() => removeItem('education', i)}>
            <TextInput
              label="Institution"
              className="sm:col-span-2"
              value={e.institution}
              onChange={(v) => updateItem('education', i, { institution: v })}
            />
            <TextInput
              label="Degree (e.g. B.Tech)"
              value={e.degree}
              onChange={(v) => updateItem('education', i, { degree: v })}
            />
            <TextInput
              label="Branch / field"
              value={e.field}
              onChange={(v) => updateItem('education', i, { field: v })}
            />
            <TextInput
              label="Start year"
              type="number"
              value={e.startYear}
              onChange={(v) => updateItem('education', i, { startYear: v })}
            />
            <TextInput
              label="End year"
              type="number"
              value={e.endYear}
              onChange={(v) => updateItem('education', i, { endYear: v })}
            />
            <TextInput
              label="Score (e.g. CGPA 8.5)"
              value={e.score}
              onChange={(v) => updateItem('education', i, { score: v })}
            />
          </Entry>
        ))}
      </Section>

      <Section title="Skills">
        <TagInput
          label="Skills"
          value={form.skills}
          onChange={(skills) => setTop('skills', skills)}
          placeholder="e.g. JavaScript, React, MongoDB"
        />
      </Section>

      <Section
        title="Projects"
        hint="One bullet per line works best, and numbers make them stronger."
        onAdd={() => addItem('projects')}
        addLabel="+ Add project"
        isEmpty={form.projects.length === 0}
      >
        {form.projects.map((p, i) => (
          <Entry key={i} onRemove={() => removeItem('projects', i)}>
            <TextInput
              label="Project name"
              value={p.name}
              onChange={(v) => updateItem('projects', i, { name: v })}
            />
            <TextInput
              label="Link"
              type="url"
              placeholder="https://..."
              value={p.link}
              onChange={(v) => updateItem('projects', i, { link: v })}
            />
            <div className="sm:col-span-2">
              <TagInput
                label="Technologies"
                value={p.technologies}
                onChange={(t) => updateItem('projects', i, { technologies: t })}
                placeholder="e.g. React, Node.js"
              />
            </div>
            <TextArea
              label="Description bullets"
              className="sm:col-span-2"
              rows={4}
              hint="One bullet per line"
              value={p.bulletsText}
              onChange={(v) => updateItem('projects', i, { bulletsText: v })}
            />
          </Entry>
        ))}
      </Section>

      <Section
        title="Experience"
        hint="Internships, part-time work or freelance. Skip this if you have none yet."
        onAdd={() => addItem('experience')}
        addLabel="+ Add experience"
        isEmpty={form.experience.length === 0}
      >
        {form.experience.map((x, i) => (
          <Entry key={i} onRemove={() => removeItem('experience', i)}>
            <TextInput
              label="Company / organisation"
              value={x.company}
              onChange={(v) => updateItem('experience', i, { company: v })}
            />
            <TextInput
              label="Role"
              value={x.role}
              onChange={(v) => updateItem('experience', i, { role: v })}
            />
            <TextInput
              label="Start month"
              type="month"
              value={x.startDate}
              onChange={(v) => updateItem('experience', i, { startDate: v })}
            />
            <TextInput
              label="End month"
              type="month"
              disabled={x.current}
              value={x.current ? '' : x.endDate}
              onChange={(v) => updateItem('experience', i, { endDate: v })}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={x.current}
                onChange={(e) => updateItem('experience', i, { current: e.target.checked })}
              />
              I currently work here
            </label>
            <TextArea
              label="What you did"
              className="sm:col-span-2"
              rows={4}
              hint="One bullet per line"
              value={x.bulletsText}
              onChange={(v) => updateItem('experience', i, { bulletsText: v })}
            />
          </Entry>
        ))}
      </Section>

      <Section title="Achievements">
        <TextArea
          label="Achievements"
          rows={4}
          hint="One per line, e.g. hackathon wins, ranks, scholarships"
          value={form.achievementsText}
          onChange={(v) => setTop('achievementsText', v)}
        />
      </Section>

      <Section
        title="Certifications"
        onAdd={() => addItem('certifications')}
        addLabel="+ Add certification"
        isEmpty={form.certifications.length === 0}
      >
        {form.certifications.map((c, i) => (
          <Entry key={i} onRemove={() => removeItem('certifications', i)}>
            <TextInput
              label="Certificate name"
              className="sm:col-span-2"
              value={c.name}
              onChange={(v) => updateItem('certifications', i, { name: v })}
            />
            <TextInput
              label="Issuing organisation"
              value={c.organization}
              onChange={(v) => updateItem('certifications', i, { organization: v })}
            />
            <TextInput
              label="Year"
              type="number"
              value={c.year}
              onChange={(v) => updateItem('certifications', i, { year: v })}
            />
          </Entry>
        ))}
      </Section>

      <Section
        title="Coding profiles"
        hint="LeetCode, Codeforces, GeeksforGeeks and similar."
        onAdd={() => addItem('codingProfiles')}
        addLabel="+ Add profile"
        isEmpty={form.codingProfiles.length === 0}
      >
        {form.codingProfiles.map((p, i) => (
          <Entry key={i} onRemove={() => removeItem('codingProfiles', i)}>
            <TextInput
              label="Platform"
              placeholder="e.g. LeetCode"
              value={p.platform}
              onChange={(v) => updateItem('codingProfiles', i, { platform: v })}
            />
            <TextInput
              label="Profile link"
              type="url"
              placeholder="https://..."
              value={p.url}
              onChange={(v) => updateItem('codingProfiles', i, { url: v })}
            />
          </Entry>
        ))}
      </Section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save resume'}
      </button>
    </div>
  )
}