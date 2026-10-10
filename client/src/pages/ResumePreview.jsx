import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ResumeDocument from '../components/ResumeDocument'
import { checkResume } from '../utils/resumeCheck'

const scoreLabel = (score) => {
  if (score < 50) return 'Needs work'
  if (score < 75) return 'Getting there'
  if (score < 90) return 'Good'
  return 'Strong'
}

const ICONS = { pass: '✓', warn: '!', fail: '✗' }
const ICON_STYLES = {
  pass: 'bg-green-100 text-green-700',
  warn: 'bg-amber-100 text-amber-700',
  fail: 'bg-red-100 text-red-700',
}

export default function ResumePreview() {
  const [resume, setResume] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/resume')
      .then((res) => setResume(res.data))
      .catch(() => setError('Could not load your resume'))
  }, [])

  const handleDownload = () => {
    const previousTitle = document.title
    const name = resume.contact?.fullName?.trim()
    // The browser suggests the page title as the PDF file name
    document.title = name ? `${name} - Resume` : 'Resume'
    try {
      window.print()
    } finally {
      document.title = previousTitle
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
  if (!resume) return <p className="text-slate-500">Loading your resume...</p>

  const { score, checks } = checkResume(resume)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Resume preview</h1>
          <p className="mt-1 text-slate-500">This is your last saved version.</p>
        </div>
        <div className="flex gap-3">
            <Link
            to="/resume/upload"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Upload existing resume
          </Link>
          <Link
            to="/resume"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Edit resume
          </Link>
          <button
            onClick={handleDownload}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">ATS readiness (basic check)</p>
            <p className="mt-1 text-4xl font-bold text-indigo-600">
              {score}
              <span className="text-lg font-medium text-slate-400"> / 100</span>
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">{scoreLabel(score)}</p>
          </div>
          <p className="max-w-sm text-xs text-slate-400">
            Our template already uses a single column, standard headings and real selectable text,
            which are the basics ATS software needs. This score checks your content. It is a simple
            rule-based check, and deeper AI feedback comes later.
          </p>
        </div>

        <ul className="mt-5 space-y-2">
          {checks.map((ch) => (
            <li key={ch.label} className="flex gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ICON_STYLES[ch.status]}`}
              >
                {ICONS[ch.status]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {ch.label}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {ch.points}/{ch.max}
                  </span>
                </p>
                <p className="text-sm text-slate-500">{ch.message}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ResumeDocument resume={resume} />

      <p className="text-center text-xs text-slate-400 print:hidden">
        Tip: in the print window choose "Save as PDF" as the destination, and untick "Headers and
        footers" for a clean result.
      </p>
    </div>
  )
}