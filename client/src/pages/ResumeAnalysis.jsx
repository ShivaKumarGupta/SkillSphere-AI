import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const scoreLabel = (s) => (s < 40 ? 'Weak' : s < 60 ? 'Needs work' : s < 80 ? 'Good' : 'Strong')
const scoreColor = (s) =>
  s < 40 ? 'text-red-600' : s < 60 ? 'text-amber-600' : s < 80 ? 'text-indigo-600' : 'text-green-600'

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

const PROBLEM_HELP = {
  no_role: {
    text: 'Set your target job role in your profile so the AI knows what to compare your resume against.',
    to: '/profile',
    label: 'Go to profile',
  },
  no_upload: {
    text: 'Upload your resume as a PDF first. The AI reads the text we extract from it.',
    to: '/resume/upload',
    label: 'Upload resume',
  },
}

function Card({ title, hint, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function Bullets({ items, empty }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">{empty}</p>
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

function Chips({ items, empty, className }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">{empty}</p>
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`rounded-full px-3 py-1 text-sm ${className}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

export default function ResumeAnalysis() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    api
      .get('/ai/resume-analysis')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load your analysis'))
  }, [])

  const runAnalysis = async () => {
    setError('')
    setAnalyzing(true)
    try {
      const res = await api.post('/ai/resume-analysis')
      setData({ analysis: res.data, stale: false, problem: null })
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setAnalyzing(false)
    }
  }

  if (!data && !error) return <p className="text-slate-500">Loading...</p>
  if (!data) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>

  const { analysis, stale, problem } = data
  const help = problem ? PROBLEM_HELP[problem] : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Resume Analyzer</h1>
          <p className="mt-1 text-slate-500">
            Your uploaded resume, reviewed against your target role.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/resume/upload"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Upload resume
          </Link>
          {!problem && (
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {analyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze my resume'}
            </button>
          )}
        </div>
      </div>

      {analyzing && (
        <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
          Reading your resume. This usually takes 10 to 30 seconds.
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {help && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6">
          <p className="text-sm text-slate-600">{help.text}</p>
          <Link
            to={help.to}
            className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {help.label}
          </Link>
        </div>
      )}

      {!analysis && !problem && !analyzing && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">
            No analysis yet. Click "Analyze my resume" to get your score and feedback.
          </p>
        </div>
      )}

      {analysis && (
        <>
          {stale && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Your resume, target role or skills have changed since this analysis. Click
              "Re-analyze" to update it.
            </p>
          )}

          {analysis.hiddenInstructionsDetected && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Your resume contains text that looks like instructions to an AI. We ignored it, but
              recruiters' software may flag such text too, so consider removing it.
            </p>
          )}

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">Resume score for {analysis.targetRole}</p>
            <p className={`mt-1 text-5xl font-bold ${scoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}
              <span className="text-xl font-medium text-slate-400"> / 100</span>
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">
              {scoreLabel(analysis.overallScore)}
            </p>
            <p className="mt-4 text-sm text-slate-700">{analysis.summary}</p>
            <p className="mt-4 text-xs text-slate-400">
              {analysis.fileName} · analyzed {formatDateTime(analysis.analyzedAt)} · {analysis.model}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Strengths">
              <Bullets items={analysis.strengths} empty="No specific strengths were listed." />
            </Card>
            <Card title="Skill gaps" hint="Expected for this role, but not shown in your resume.">
              <Chips
                items={analysis.skillGaps}
                empty="No skill gaps found."
                className="bg-red-50 text-red-700"
              />
            </Card>
          </div>

          <Card title="Missing keywords" hint="Terms recruiters and ATS software often search for.">
            <Chips
              items={analysis.missingKeywords}
              empty="No missing keywords found."
              className="bg-amber-50 text-amber-800"
            />
          </Card>

          <Card title="Weak sections">
            {analysis.weakSections.length === 0 ? (
              <p className="text-sm text-slate-400">No weak sections were found.</p>
            ) : (
              <div className="space-y-3">
                {analysis.weakSections.map((s, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">{s.section}</p>
                    <p className="mt-1 text-sm text-slate-600">{s.issue}</p>
                    {s.suggestion && (
                      <p className="mt-2 text-sm text-indigo-700">Fix: {s.suggestion}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Recommendations for your role">
              <Bullets items={analysis.roleRecommendations} empty="No recommendations." />
            </Card>
            <Card title="ATS and formatting">
              <Bullets items={analysis.atsAndFormatting} empty="No formatting issues found." />
            </Card>
          </div>

          <p className="text-xs text-slate-400">
            AI feedback can be wrong, so treat it as guidance and not as a verdict. Your resume
            text is sent to an AI provider to produce this review.
          </p>
        </>
      )}
    </div>
  )
}