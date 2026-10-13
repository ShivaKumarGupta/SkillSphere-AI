const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase()

// A skill counts as proven when a project uses it or a certificate is linked to it
export const buildSkillStats = (skills, projects, certificates) => {
  const items = (skills || []).map((skill) => ({
    skill,
    projects: projects.filter((p) => (p.technologies || []).some((t) => same(t, skill))).length,
    certificates: certificates.filter((c) => same(c.relatedSkill, skill)).length,
  }))

  return {
    total: items.length,
    proven: items.filter((s) => s.projects + s.certificates > 0).length,
    items,
  }
}