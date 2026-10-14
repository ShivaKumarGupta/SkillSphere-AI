import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'

const STATUS_STYLES = {
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
}

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 hover:underline"
    >
      {children}
    </a>
  )
}

export default function PublicPortfolio() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | missing | error

  useEffect(() => {
    api
      .get(`/public/portfolio/${encodeURIComponent(slug)}`)
      .then((res) => {
        setData(res.data)
        setState('ready')
      })
      .catch((err) => setState(err.response?.status === 404 ? 'missing' : 'error'))
  }, [slug])

  useEffect(() => {
    if (!data) return undefined
    const previous = document.title
    document.title = `${data.name} | Portfolio`
    return () => {
      document.title = previous
    }
  }, [data])

  if (state === 'loading') {
    return <p className="p-10 text-center text-slate-500">Loading...</p>
  }

  if (state !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-slate-800">
            {state === 'missing' ? 'Portfolio not found' : 'Something went wrong'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {state === 'missing'
              ? 'This portfolio does not exist, or its owner has made it private.'
              : 'We could not load this portfolio. Please try again in a moment.'}
          </p>
        </div>
      </div>
    )
  }

  const initials = data.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const { education } = data
  const educationLine = education
    ? [[education.degree, education.branch].filter(Boolean).join(', '), education.college]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="rounded-3xl bg-indigo-900 p-8 text-white shadow sm:p-10">
          <div className="flex flex-wrap items-center gap-5">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-400 font-display text-2xl font-bold text-indigo-900"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-bold">{data.name}</h1>
              {data.targetRole && <p className="mt-1 text-amber-300">{data.targetRole}</p>}
            </div>
          </div>

          {data.headline && <p className="mt-5 text-lg text-slate-100">{data.headline}</p>}
          {data.bio && (
            <p className="mt-3 whitespace-pre-wrap break-words text-slate-200">{data.bio}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {data.links.github && (
              <a
                href={data.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20"
              >
                GitHub
              </a>
            )}
            {data.links.linkedin && (
              <a
                href={data.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20"
              >
                LinkedIn
              </a>
            )}
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                className="rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20"
              >
                {data.email}
              </a>
            )}
          </div>
        </header>

        {education && (educationLine || education.graduationYear || education.cgpa !== null) && (
          <Section title="Education">
            <div className="rounded-2xl bg-white p-5 shadow">
              {educationLine && <p className="font-medium text-slate-800">{educationLine}</p>}
              <p className="mt-1 text-sm text-slate-500">
                {[
                  education.graduationYear && `Class of ${education.graduationYear}`,
                  education.cgpa !== null && `CGPA ${education.cgpa}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </Section>
        )}

        {data.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s, i) => (
                <span key={i} className="rounded-full bg-indigo-100 px-3 py-1.5 text-sm text-indigo-700">
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {data.projects.length > 0 && (
          <Section title="Projects">
            <div className="grid gap-4 sm:grid-cols-2">
              {data.projects.map((p, i) => (
                <div key={i} className="flex flex-col rounded-2xl bg-white p-5 shadow">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="break-words font-semibold text-slate-800">{p.name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{p.description}</p>
                  )}
                  {p.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.technologies.map((t, j) => (
                        <span key={j} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                {p.screenshots.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {p.screenshots.map((id) => {
                        const src = `/api/public/portfolio/${encodeURIComponent(slug)}/files/${id}`
                        return (
                          <a key={id} href={src} target="_blank" rel="noopener noreferrer">
                            <img
                              src={src}
                              alt={`${p.name} screenshot`}
                              loading="lazy"
                              className="h-20 w-full rounded-lg border border-slate-200 object-cover"
                            />
                          </a>
                        )
                      })}
                    </div>
                  )}
                  <div className="mt-auto flex gap-4 pt-4 text-sm">
                    {p.githubUrl && <ExternalLink href={p.githubUrl}>Code</ExternalLink>}
                    {p.liveUrl && <ExternalLink href={p.liveUrl}>Live demo</ExternalLink>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.certificates.length > 0 && (
          <Section title="Certificates">
            <div className="space-y-3">
              {data.certificates.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-5 shadow">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-slate-800">{c.name}</p>
                    <p className="text-sm text-slate-500">
                      {c.organization} · {c.year}
                      {c.relatedSkill && ` · ${c.relatedSkill}`}
                    </p>
                  </div>
                    {(c.credentialUrl || c.fileId) && (
                    <span className="flex gap-4 text-sm">
                      {c.fileId && (
                        <ExternalLink
                          href={`/api/public/portfolio/${encodeURIComponent(slug)}/files/${c.fileId}`}
                        >
                          View file
                        </ExternalLink>
                      )}
                      {c.credentialUrl && <ExternalLink href={c.credentialUrl}>Verify</ExternalLink>}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        <p className="mt-12 text-center text-xs text-slate-400">
          Built with{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            SkillSphere AI
          </Link>
        </p>
      </div>
    </div>
  )
}