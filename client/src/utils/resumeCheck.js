const has = (value) => typeof value === 'string' && value.trim().length > 0

const statusOf = (points, max) => (points >= max ? 'pass' : points <= 0 ? 'fail' : 'warn')

// Returns a score out of 100 and a list of checks, each with a tip when it is not fully met
export const checkResume = (resume) => {
  const c = resume.contact || {}
  const education = resume.education || []
  const skills = resume.skills || []
  const projects = resume.projects || []
  const experience = resume.experience || []
  const certifications = resume.certifications || []
  const achievements = resume.achievements || []
  const codingProfiles = resume.codingProfiles || []

  const entries = [...projects, ...experience]
  const bullets = entries.flatMap((e) => e.bullets || [])

  const checks = []
  const add = (label, max, points, ok, tip) =>
    checks.push({
      label,
      max,
      points,
      status: statusOf(points, max),
      message: points >= max ? ok : tip,
    })

  // 1. Contact details (10)
  const hasNameEmail = has(c.fullName) && has(c.email)
  add(
    'Contact details',
    10,
    hasNameEmail ? (has(c.phone) ? 10 : 6) : 0,
    'Name, email and phone are all present.',
    hasNameEmail ? 'Add a phone number.' : 'Add your name and email so recruiters can reach you.'
  )

  // 2. Professional links (5)
  add(
    'Professional links',
    5,
    has(c.linkedin) || has(c.github) ? 5 : 0,
    'LinkedIn or GitHub link found.',
    'Add your LinkedIn or GitHub link.'
  )

  // 3. Summary (10)
  const summaryLength = (resume.summary || '').trim().length
  add(
    'Professional summary',
    10,
    summaryLength === 0 ? 0 : summaryLength < 80 ? 5 : 10,
    'A summary is present.',
    summaryLength === 0
      ? 'Add a 2 to 3 line summary mentioning your target role and key skills.'
      : 'Your summary is very short. Aim for 2 to 3 lines.'
  )

  // 4. Education (10)
  const educationComplete = education.some((e) => has(e.institution) && has(e.degree))
  add(
    'Education',
    10,
    educationComplete ? 10 : education.length > 0 ? 5 : 0,
    'Education with institution and degree found.',
    'Add your college and degree.'
  )

  // 5. Skills (15)
  add(
    'Skills',
    15,
    skills.length >= 6 ? 15 : skills.length >= 1 ? 8 : 0,
    `${skills.length} skills listed.`,
    'List at least 6 relevant skills. ATS software matches these against job descriptions.'
  )

  // 6. Projects or experience (15)
  add(
    'Projects or experience',
    15,
    entries.length >= 3 ? 15 : entries.length >= 1 ? 8 : 0,
    `${entries.length} projects and experience entries found.`,
    'Include at least 3 projects or experience entries. Projects count for freshers.'
  )

  // 7. Every entry has bullets (10)
  const withBullets = entries.filter((e) => (e.bullets || []).length > 0).length
  add(
    'Descriptions for each entry',
    10,
    entries.length === 0 ? 0 : Math.round((withBullets / entries.length) * 10),
    'Every project and experience entry has description bullets.',
    entries.length === 0
      ? 'Add projects or experience first.'
      : 'Some entries have no description. Add 2 to 3 bullets to each one.'
  )

  // 8. Numbers in bullets (5)
  add(
    'Measurable results',
    5,
    bullets.some((b) => /\d/.test(b)) ? 5 : 0,
    'At least one bullet includes a number.',
    'Add numbers to your bullets, such as users, speed-ups, percentages or size of data.'
  )

  // 9. Concise bullets (5)
  const longBullets = bullets.filter((b) => b.length > 250).length
  add(
    'Concise bullets',
    5,
    bullets.length === 0 ? 0 : longBullets === 0 ? 5 : 2,
    'Bullets are a good length.',
    bullets.length === 0
      ? 'There are no bullets to check yet.'
      : 'Shorten bullets longer than about 250 characters. Recruiters skim.'
  )

  // 10. Dates complete (5)
  const missingDates =
    education.filter((e) => !has(e.endYear)).length +
    experience.filter((x) => !has(x.startDate) || (!x.current && !has(x.endDate))).length
  add(
    'Dates',
    5,
    education.length + experience.length === 0 ? 0 : missingDates === 0 ? 5 : 2,
    'Dates are filled in.',
    education.length + experience.length === 0
      ? 'Add education or experience with dates.'
      : 'Some education or experience entries are missing dates.'
  )

  // 11. Extra proof (10)
  const extraPoints =
    (certifications.length > 0 || achievements.length > 0 ? 5 : 0) +
    (codingProfiles.length > 0 ? 5 : 0)
  add(
    'Certificates, achievements and coding profiles',
    10,
    extraPoints,
    'Extra proof of your skills is included.',
    'Add certifications or achievements, and links to your coding profiles.'
  )

  const score = checks.reduce((sum, ch) => sum + ch.points, 0)
  return { score, checks }
}