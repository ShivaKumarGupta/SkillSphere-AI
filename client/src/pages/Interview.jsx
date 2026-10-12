import { useState, useEffect } from 'react'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'
import { todayKey } from '../utils/date'
import InterviewResults from '../components/InterviewResults'
import InterviewHistory from '../components/InterviewHistory'
import { Link } from 'react-router-dom'

const TYPES = [
  ['Technical', 'Technical: concepts and your projects'],
  ['HR', 'HR: behavioural and communication'],
  ['Mixed', 'Mixed: both'],
]
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const COUNTS = [3, 5, 8]
const MAX_ANSWER = 2000

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500'

const CATEGORY_STYLES = {
  Technical: 'bg-indigo-100 text-indigo-700',
  HR: 'bg-purple-100 text-purple-700',
}

const answersOf = (session) => Object.fromEntries(session.questions.map((q) => [q.id, q.answer]))

const summaryOf = (s) => ({
  id: s.id,
  role: s.role,
  type: s.type,
  difficulty: s.difficulty,
  questionCount: s.questions.length,
  overallScore: s.evaluation?.overallScore ?? 0,
  completedAt: s.completedAt,
})

function Setup({ defaultRole, onStart, starting }) {
  const [form, setForm] = useState({
    role: defaultRole,
    type: 'Mixed',
    difficulty: 'Medium',
    count: 5,
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    onStart({ ...form, count: Number(form.count) })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-slate-800">Set up your mock interview</h2>
      <p className="mt-1 text-sm text-slate-500">
        Questions are written for you, using your skills, projects and resume.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Job role</label>
          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="e.g. Full-Stack Developer"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Interview type</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            {TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Difficulty</label>
          <select name="difficulty" value={form.difficulty} onChange={handleChange} className={inputClass}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Number of questions</label>
          <select name="count" value={form.count} onChange={handleChange} className={inputClass}>
            {COUNTS.map((c) => (
              <option key={c} value={c}>
                {c} questions
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={starting}
        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {starting ? 'Preparing your questions...' : 'Start interview'}
      </button>
      {starting && (
        <p className="mt-3 text-sm text-slate-500">This can take up to a minute. Please don't close the page.</p>
      )}
    </form>
  )
}

function Runner({ session, onDiscarded, onFinished }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(() => answersOf(session))
  const [saved, setSaved] = useState(() => answersOf(session))
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')

  const total = session.questions.length
  const question = session.questions[index]
  const text = answers[question.id] ?? ''
  const isSaved = text === saved[question.id]
  const answeredCount = session.questions.filter((q) => (answers[q.id] || '').trim()).length
  const busy = saving || finishing

  const saveCurrent = async () => {
    if (isSaved) return true
    setSaving(true)
    try {
      await api.patch(`/interviews/${session.id}/answer`, { questionId: question.id, answer: text })
      setSaved((s) => ({ ...s, [question.id]: text }))
      setError('')
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your answer')
      return false
    } finally {
      setSaving(false)
    }
  }

  const goTo = async (next) => {
    if (next < 0 || next >= total || next === index) return
    if (await saveCurrent()) setIndex(next)
  }

  const finish = async () => {
    if (answeredCount === 0) {
      setError('Answer at least one question before finishing')
      return
    }

    const unanswered = total - answeredCount
    const message =
      unanswered > 0
        ? `${unanswered} ${unanswered === 1 ? 'question is' : 'questions are'} unanswered and will score 0. Finish anyway?`
        : 'Finish the interview and get your feedback?'
    if (!window.confirm(message)) return

    if (!(await saveCurrent())) return

    setError('')
    setFinishing(true)
    try {
      const res = await api.post(`/interviews/${session.id}/complete`)
      onFinished(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not finish the interview. Your answers are saved.')
    } finally {
      setFinishing(false)
    }
  }

  const discard = async () => {
    if (!window.confirm('Discard this interview? Your answers will be deleted.')) return
    try {
      await api.delete(`/interviews/${session.id}`)
      onDiscarded()
    } catch {
      setError('Could not discard the interview')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{session.role}</span> · {session.type} ·{' '}
          {session.difficulty}
        </p>
        <p className="text-sm text-slate-500">
          {answeredCount} of {total} answered
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-500">
            Question {index + 1} of {total}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[question.category]}`}
          >
            {question.category}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
            {question.topic}
          </span>
        </div>

        <p className="mt-4 text-lg font-medium text-slate-800">{question.text}</p>

        <textarea
          value={text}
          onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
          onBlur={saveCurrent}
          disabled={finishing}
          rows={8}
          maxLength={MAX_ANSWER}
          placeholder="Type your answer here, as you would say it in an interview..."
          className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-50"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>{saving ? 'Saving...' : isSaved ? 'Saved' : 'Unsaved changes. They save when you move on.'}</span>
          <span>
            {text.length}/{MAX_ANSWER}
          </span>
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => goTo(index - 1)}
              disabled={index === 0 || busy}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => goTo(index + 1)}
              disabled={index === total - 1 || busy}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={saveCurrent}
              disabled={isSaved || busy}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Save
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {session.questions.map((q, i) => {
              const filled = (answers[q.id] || '').trim().length > 0
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  disabled={busy}
                  aria-label={`Go to question ${i + 1}`}
                  className={`h-8 w-8 rounded-full text-xs font-semibold ${
                    i === index
                      ? 'bg-indigo-600 text-white'
                      : filled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            onClick={finish}
            disabled={busy || answeredCount === 0}
            className="rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {finishing ? 'Evaluating your answers...' : 'Finish and get feedback'}
          </button>
          {finishing && (
            <p className="mt-2 text-sm text-slate-500">
              This can take up to a minute. Please don't close the page.
            </p>
          )}
          {!finishing && answeredCount === 0 && (
            <p className="mt-2 text-xs text-slate-400">Answer at least one question to finish.</p>
          )}
        </div>
      </div>

      <button onClick={discard} disabled={finishing} className="text-sm text-slate-500 hover:text-red-600 disabled:opacity-50">
        Discard this interview
      </button>
    </div>
  )
}

export default function Interview() {
  const { user } = useAuth()
  const [session, setSession] = useState(undefined) // undefined = loading, null = none in progress
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    api
      .get('/interviews/active')
      .then((res) => setSession(res.data))
      .catch(() => {
        setError('Could not load your interview')
        setSession(null)
      })

    api
      .get('/interviews')
      .then((res) => setHistory(res.data))
      .catch(() => {})
  }, [])

  const start = async (setup) => {
    setError('')
    setStarting(true)
    try {
      const res = await api.post('/interviews', { ...setup, today: todayKey() })
      setSession(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setStarting(false)
    }
  }

  const handleFinished = (completed) => {
    setResult(completed)
    setSession(null)
    setHistory((h) => [summaryOf(completed), ...h.filter((x) => x.id !== completed.id)])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const viewPast = async (id) => {
    setError('')
    setBusyId(id)
    try {
      const res = await api.get(`/interviews/${id}`)
      setResult(res.data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Could not open that interview')
    } finally {
      setBusyId(null)
    }
  }

  const deletePast = async (item) => {
    if (!window.confirm(`Delete this ${item.role} interview? This cannot be undone.`)) return
    setError('')
    setBusyId(item.id)
    try {
      await api.delete(`/interviews/${item.id}`)
      setHistory((h) => h.filter((x) => x.id !== item.id))
    } catch {
      setError('Could not delete the interview')
    } finally {
      setBusyId(null)
    }
  }

  if (session === undefined) return <p className="text-slate-500">Loading...</p>

  return (
    <div className="space-y-6">
     <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Mock Interview</h1>
          <p className="mt-1 text-slate-500">Practise with questions written for your profile.</p>
        </div>
        <Link
          to="/interview/analytics"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          View analytics
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {result ? (
        <InterviewResults session={result} onBack={() => setResult(null)} />
      ) : session ? (
        <Runner
          key={session.id}
          session={session}
          onDiscarded={() => setSession(null)}
          onFinished={handleFinished}
        />
      ) : (
        <>
          <Setup defaultRole={user.targetRole || ''} onStart={start} starting={starting} />
          <InterviewHistory items={history} onView={viewPast} onDelete={deletePast} busyId={busyId} />
        </>
      )}

      <p className="text-xs text-slate-400">
        AI-written questions and scores are for practice and may not match a real interview. Your
        profile data, resume text and answers are sent to an AI provider, and starting and
        finishing an interview each use one of your daily AI requests.
      </p>
    </div>
  )
}