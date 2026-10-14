import { ACCENTS } from '../constants/resume'

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

// Every template is a single column of real text with standard headings, which is what ATS software reads best
const VARIANTS = {
  classic: {
    font: 'Arial, Helvetica, sans-serif',
    text: 'text-[10pt] leading-snug',
    header: 'text-center',
    name: 'text-[22pt] font-bold leading-tight',
    contact: 'mt-1',
    section: 'mt-4',
    heading: 'border-b border-slate-400 pb-0.5 text-[11pt] font-bold uppercase tracking-wide',
    body: 'mt-2 space-y-2',
    bullets: 'ml-5 mt-0.5 list-disc space-y-0.5',
  },
  modern: {
    font: '"Source Sans 3", Arial, Helvetica, sans-serif',
    text: 'text-[10.5pt] leading-snug',
    header: 'text-left',
    name: 'text-[26pt] font-bold leading-tight',
    contact: 'mt-1.5',
    section: 'mt-5',
    heading: 'border-l-4 pl-2.5 text-[12pt] font-bold',
    body: 'mt-2 space-y-2.5',
    bullets: 'ml-5 mt-1 list-disc space-y-0.5',
  },
  compact: {
    font: 'Georgia, "Times New Roman", serif',
    text: 'text-[9.5pt] leading-tight',
    header: 'text-center',
    name: 'text-[20pt] font-bold leading-tight tracking-wide',
    contact: 'mt-0.5',
    section: 'mt-3',
    heading: 'border-b pb-px text-[10pt] font-bold uppercase tracking-[0.08em]',
    body: 'mt-1.5 space-y-1.5',
    bullets: 'ml-4 mt-0.5 list-disc space-y-0',
  },
}

function Link({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-black underline">
      {children}
    </a>
  )
}

export default function ResumeDocument({ resume }) {
  const key = VARIANTS[resume.template] ? resume.template : 'classic'
  const v = VARIANTS[key]
  const accent = ACCENTS[resume.accent] || ACCENTS.teal

  const nameStyle = key === 'classic' ? undefined : { color: accent }
  const headingStyle = key === 'classic' ? undefined : { borderColor: accent, color: accent }

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

  const section = (title, children) => (
    <section className={v.section}>
      <h2 className={v.heading} style={headingStyle}>
        {title}
      </h2>
      <div className={v.body}>{children}</div>
    </section>
  )

  const bullets = (items) =>
    items && items.length > 0 ? (
      <ul className={v.bullets}>
        {items.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    ) : null

  return (
    <div
      className={`resume-doc mx-auto w-full max-w-[210mm] bg-white p-[14mm] text-black shadow print:max-w-none print:p-0 print:shadow-none ${v.text}`}
      style={{ fontFamily: v.font }}
    >
      <header className={v.header}>
        <h1 className={v.name} style={nameStyle}>
          {c.fullName || 'Your Name'}
        </h1>
        {contactItems.length > 0 && (
          <p className={v.contact}>
            {contactItems.map((item, i) => (
              <span key={i}>
                {i > 0 && ' | '}
                {item.href ? <Link href={item.href}>{item.text}</Link> : item.text}
              </span>
            ))}
          </p>
        )}
      </header>

      {resume.summary && section('Summary', <p>{resume.summary}</p>)}

      {education.length > 0 &&
        section(
          'Education',
          education.map((e, i) => (
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
          ))
        )}

      {skills.length > 0 && section('Skills', <p>{skills.join(', ')}</p>)}

      {projects.length > 0 &&
        section(
          'Projects',
          projects.map((p, i) => (
            <div key={i} className="break-inside-avoid">
              <div className="flex justify-between gap-4">
                <span className="font-semibold">{p.name}</span>
                {p.link && <Link href={p.link}>{shortUrl(p.link)}</Link>}
              </div>
              {p.technologies?.length > 0 && <p className="italic">{p.technologies.join(', ')}</p>}
              {bullets(p.bullets)}
            </div>
          ))
        )}

      {experience.length > 0 &&
        section(
          'Experience',
          experience.map((x, i) => (
            <div key={i} className="break-inside-avoid">
              <div className="flex justify-between gap-4">
                <span className="font-semibold">{x.role}</span>
                <span>{monthRange(x.startDate, x.endDate, x.current)}</span>
              </div>
              <p className="italic">{x.company}</p>
              {bullets(x.bullets)}
            </div>
          ))
        )}

      {achievements.length > 0 && section('Achievements', bullets(achievements))}

      {certifications.length > 0 &&
        section(
          'Certifications',
          certifications.map((cert, i) => (
            <p key={i}>
              <span className="font-semibold">{cert.name}</span>
              {cert.organization && `, ${cert.organization}`}
              {cert.year && ` (${cert.year})`}
            </p>
          ))
        )}

      {codingProfiles.length > 0 &&
        section(
          'Coding Profiles',
          codingProfiles.map((p, i) => (
            <p key={i}>
              <span className="font-semibold">{p.platform}</span>
              {p.url && (
                <>
                  {p.platform && ': '}
                  <Link href={p.url}>{shortUrl(p.url)}</Link>
                </>
              )}
            </p>
          ))
        )}
    </div>
  )
}