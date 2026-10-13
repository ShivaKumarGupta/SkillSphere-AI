const DAY = 86400000
const WEEKS = 8
const FIELDS = ['dsa', 'interviews', 'milestones', 'applications']

// Counts activity per week for the last 8 weeks (weeks start on Monday)
export const buildWeeklyActivity = (sources, todayKey) => {
  const todayMs = Date.parse(`${todayKey}T00:00:00Z`)
  const thisWeek = todayMs - ((new Date(todayMs).getUTCDay() + 6) % 7) * DAY
  const first = thisWeek - (WEEKS - 1) * 7 * DAY
  const end = thisWeek + 7 * DAY

  const weeks = Array.from({ length: WEEKS }, (_, i) => ({
    weekStart: new Date(first + i * 7 * DAY).toISOString().slice(0, 10),
    dsa: 0,
    interviews: 0,
    milestones: 0,
    applications: 0,
  }))

  for (const field of FIELDS) {
    for (const value of sources[field] || []) {
      const t = new Date(value).getTime()
      if (Number.isNaN(t) || t < first || t >= end) continue
      weeks[Math.floor((t - first) / (7 * DAY))][field] += 1
    }
  }

  return weeks.map((w) => ({ ...w, total: w.dsa + w.interviews + w.milestones + w.applications }))
}