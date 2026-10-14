import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import RoadmapTrail from '../components/RoadmapTrail'



const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export default function Roadmap() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    api
      .get('/roadmap')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load your roadmap'))
  }, [])

  const generate = async () => {
    if (data?.roadmap) {
      const ok = window.confirm(
        'Generating a new roadmap replaces your current one and resets your progress. Continue?'
      )
      if (!ok) return
    }

    setError('')
    setGenerating(true)
    try {
      const res = await api.post('/roadmap/generate')
      setData({ roadmap: res.data, stale: false, problem: null })
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const toggle = async (milestone) => {
    setError('')
    setTogglingId(milestone.id)
    try {
      const res = await api.patch(`/roadmap/milestones/${milestone.id}`, {
        completed: !milestone.completed,
      })
      setData((d) => ({ ...d, roadmap: res.data }))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the milestone')
    } finally {
      setTogglingId(null)
    }
  }

  if (!data && !error) return <p className="text-slate-500">Loading...</p>
  if (!data) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>

  const { roadmap, stale, problem } = data
  const nextId = roadmap?.milestones.find((m) => !m.completed)?.id

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Career Roadmap</h1>
          <p className="mt-1 text-slate-500">A step-by-step plan for your target role.</p>
        </div>
        {!problem && (
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {generating ? 'Generating...' : roadmap ? 'Regenerate roadmap' : 'Generate roadmap'}
          </button>
        )}
      </div>

      {generating && (
        <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
          Building your plan from your skills, projects and DSA progress. This can take up to a
          minute.
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {problem && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6">
          <p className="text-sm text-slate-600">
            Set your target job role in your profile so the roadmap knows where you are heading.
          </p>
          <Link
            to="/profile"
            className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go to profile
          </Link>
        </div>
      )}

      {!roadmap && !problem && !generating && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">
            No roadmap yet. Click "Generate roadmap" to get a plan based on what you already have.
          </p>
        </div>
      )}

      {roadmap && (
        <>
          {stale && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Your target role, experience level or skills have changed since this roadmap was
              made. Regenerate it to update the plan. This resets your progress.
            </p>
          )}

          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-500">Roadmap for {roadmap.targetRole}</p>
              <p className="text-sm font-semibold text-indigo-600">
                {roadmap.progress.done} of {roadmap.progress.total} done
              </p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${roadmap.progress.percentage}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-slate-700">{roadmap.summary}</p>
            <p className="mt-3 text-xs text-slate-400">
              About {roadmap.totalWeeks} weeks in total · generated{' '}
              {formatDateTime(roadmap.generatedAt)} · {roadmap.model}
            </p>
          </div>

          <ol className="space-y-4">
            <RoadmapTrail
            milestones={roadmap.milestones}
            nextId={nextId}
            togglingId={togglingId}
            onToggle={toggle}
            targetRole={roadmap.targetRole}
          />
          </ol>

          <p className="text-xs text-slate-400">
            This plan is generated by AI from your profile data. Timings are rough estimates, so
            adjust them to your own pace.
          </p>
        </>
      )}
    </div>
  )
}