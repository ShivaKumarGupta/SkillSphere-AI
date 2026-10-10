const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatMonth = (value) => {
  if (!value) return ''
  const [year, month] = value.split('-')
  return `${MONTHS[Number(month) - 1] || ''} ${year}`.trim()
}

const monthRange = (start, end, current) =>
  [formatMonth(start), current ? 'Present' : formatMonth(end)].filter(Boolean).join(' – ')

const yearRange = (start, end) => [start, end].filter(Boolean).join(' – ')

const shortUrl = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

function Section({ title, children }) {
  return (
    <section className="mt-4">
      <h2 className="border-b border-slate-400 pb-0.5 text-[11pt] font-bold uppercase tracking-wide">
        {title}
      </h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}

function Bullets({ items }) {
  if (!items || items.length === 0) return null
  return (
    <ul className="ml-5 mt-0.5 list-disc space-y-0.5">
      {items.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  )
}

function Link({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-black underline">
      {children}
    </a>
  )
}

export default function ResumeDocument({ resume }) {
  const c = resume.contact || {}
  const education = resume.education || []
  const skills = resume.skills || []
  const projects = resume.projects || []
  const experience = resume.experience || []
  const achievements = resume.achievements || []
  const certifications = resume.certifications || []
  const codingProfiles = resume.codingProfiles || []

  const contactItems = [
    c.email && { text: c.email, href: `mailto:${c.email}` },
    c.phone && { text: c.phone },
    c.location && { text: c.location },
    c.linkedin && { text: shortUrl(c.linkedin), href: c.linkedin },
    c.github && { text: shortUrl(c.github), href: c.github },
    c.portfolio && { text: shortUrl(c.portfolio), href: c.portfolio },
  ].filter(Boolean)

  return (
    <div
      className="mx-auto w-full max-w-[210mm] bg-white p-8 text-[10pt] leading-snug text-black shadow print:max-w-none print:p-0 print:shadow-none"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <header className="text-center">
        <h1 className="text-[22pt] font-bold leading-tight">{c.fullName || 'Your Name'}</h1>
        {contactItems.length > 0 && (
          <p className="mt-1">
            {contactItems.map((item, i) => (
              <span key={i}>
                {i > 0 && ' | '}
                {item.href ? <Link href={item.href}>{item.text}</Link> : item.text}
              </span>
            ))}
          </p>
        )}
      </header>

      {resume.summary && (
        <Section title="Summary">
          <p>{resume.summary}</p>
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          {education.map((e, i) => (
            <div key={i} className="break-inside-avoid">
              <div className="flex justify-between gap-4">
                <span className="font-semibold">{e.institution}</span>
                <span>{yearRange(e.startYear, e.endYear)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>{[e.degree, e.field].filter(Boolean).join(', ')}</span>
                <span>{e.score}</span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <p>{skills.join(', ')}</p>
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <div key={i} className="break-inside-avoid">
              <div className="flex justify-between gap-4">
                <span className="font-semibold">{p.name}</span>
                {p.link && <Link href={p.link}>{shortUrl(p.link)}</Link>}
              </div>
              {p.technologies?.length > 0 && <p className="italic">{p.technologies.join(', ')}</p>}
              <Bullets items={p.bullets} />
            </div>
          ))}
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((x, i) => (
            <div key={i} className="break-inside-avoid">
              <div className="flex justify-between gap-4">
                <span className="font-semibold">{x.role}</span>
                <span>{monthRange(x.startDate, x.endDate, x.current)}</span>
              </div>
              <p className="italic">{x.company}</p>
              <Bullets items={x.bullets} />
            </div>
          ))}
        </Section>
      )}

      {achievements.length > 0 && (
        <Section title="Achievements">
          <Bullets items={achievements} />
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title="Certifications">
          {certifications.map((cert, i) => (
            <p key={i}>
              <span className="font-semibold">{cert.name}</span>
              {cert.organization && `, ${cert.organization}`}
              {cert.year && ` (${cert.year})`}
            </p>
          ))}
        </Section>
      )}

      {codingProfiles.length > 0 && (
        <Section title="Coding Profiles">
          {codingProfiles.map((p, i) => (
            <p key={i}>
              <span className="font-semibold">{p.platform}</span>
              {p.url && (
                <>
                  {p.platform && ': '}
                  <Link href={p.url}>{shortUrl(p.url)}</Link>
                </>
              )}
            </p>
          ))}
        </Section>
      )}
    </div>
  )
}