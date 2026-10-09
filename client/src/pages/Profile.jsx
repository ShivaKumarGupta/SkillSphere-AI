import { useState } from 'react'
import useAuth from '../hooks/useAuth'
import TagInput from '../components/TagInput'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500'

const roleSuggestions = [
  'Full-Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Software Engineer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Android Developer',
]

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    name: user.name || '',
    college: user.college || '',
    degree: user.degree || '',
    branch: user.branch || '',
    graduationYear: user.graduationYear ?? '',
    cgpa: user.cgpa ?? '',
    experienceLevel: user.experienceLevel || '',
    targetRole: user.targetRole || '',
    github: user.github || '',
    linkedin: user.linkedin || '',
    skills: user.skills || [],
    careerInterests: user.careerInterests || [],
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setSaving(true)
    try {
      await updateProfile(form)
      setMessage({ type: 'success', text: 'Profile saved successfully' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow">
      <h1 className="text-2xl font-bold text-slate-800">Your profile</h1>
      <p className="mb-6 mt-1 text-slate-500">
        The more you fill in, the more personalised your roadmap and AI guidance will be.
      </p>

      {message.text && (
        <p
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
        </Field>
        <Field label="Email">
          <input value={user.email} disabled className={`${inputClass} bg-slate-100 text-slate-500`} />
        </Field>
        <Field label="College">
          <input name="college" value={form.college} onChange={handleChange} className={inputClass} />
        </Field>
        <Field label="Degree (e.g. B.Tech)">
          <input name="degree" value={form.degree} onChange={handleChange} className={inputClass} />
        </Field>
        <Field label="Branch (e.g. Computer Science)">
          <input name="branch" value={form.branch} onChange={handleChange} className={inputClass} />
        </Field>
        <Field label="Graduation year">
          <input
            name="graduationYear"
            type="number"
            min="2000"
            max="2100"
            value={form.graduationYear}
            onChange={handleChange}
            className={inputClass}
          />
        </Field>
        <Field label="CGPA (out of 10)">
          <input
            name="cgpa"
            type="number"
            min="0"
            max="10"
            step="0.01"
            value={form.cgpa}
            onChange={handleChange}
            className={inputClass}
          />
        </Field>
        <Field label="Experience level">
          <select
            name="experienceLevel"
            value={form.experienceLevel}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Target job role">
            <input
              name="targetRole"
              list="role-options"
              value={form.targetRole}
              onChange={handleChange}
              placeholder="Pick a suggestion or type your own"
              className={inputClass}
            />
            <datalist id="role-options">
              {roleSuggestions.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <TagInput
            label="Skills"
            value={form.skills}
            onChange={(skills) => setForm({ ...form, skills })}
            placeholder="e.g. JavaScript, React, Python"
          />
        </div>
        <div className="sm:col-span-2">
          <TagInput
            label="Career interests"
            value={form.careerInterests}
            onChange={(careerInterests) => setForm({ ...form, careerInterests })}
            placeholder="e.g. Web Development, AI, Cloud"
          />
        </div>
        <Field label="GitHub profile link">
          <input name="github" value={form.github} onChange={handleChange} className={inputClass} />
        </Field>
        <Field label="LinkedIn profile link">
          <input name="linkedin" value={form.linkedin} onChange={handleChange} className={inputClass} />
        </Field>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-8 rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}