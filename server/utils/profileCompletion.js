const checks = [
  { label: 'College', done: (u) => !!u.college },
  { label: 'Degree', done: (u) => !!u.degree },
  { label: 'Branch', done: (u) => !!u.branch },
  { label: 'Graduation year', done: (u) => typeof u.graduationYear === 'number' },
  { label: 'CGPA', done: (u) => typeof u.cgpa === 'number' },
  { label: 'Skills', done: (u) => u.skills.length > 0 },
  { label: 'Career interests', done: (u) => u.careerInterests.length > 0 },
  { label: 'Target role', done: (u) => !!u.targetRole },
  { label: 'Experience level', done: (u) => !!u.experienceLevel },
  { label: 'GitHub or LinkedIn link', done: (u) => !!u.github || !!u.linkedin },
]

export const getProfileCompletion = (user) => {
  const missing = checks.filter((c) => !c.done(user)).map((c) => c.label)
  const percentage = Math.round(((checks.length - missing.length) / checks.length) * 100)
  return { percentage, missing }
}