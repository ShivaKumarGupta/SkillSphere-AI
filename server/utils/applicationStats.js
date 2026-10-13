import { STATUSES } from '../models/Application.js'

export const APPLICATION_STATS_FIELDS = 'company status statusHistory packageLpa applicationDate'

// The path an application follows when it keeps moving forward
const PATH = ['Applied', 'Online Assessment', 'Technical Interview', 'HR Interview', 'Selected']
const OPEN_STAGES = ['Applied', 'Online Assessment', 'Technical Interview', 'HR Interview']

const round1 = (n) => Math.round(n * 10) / 10
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null)

// Every status the application has ever had, including the current one
const statusesOf = (a) => {
  const list = (a.statusHistory || []).map((h) => h.status)
  if (!list.includes(a.status)) list.push(a.status)
  return list
}

export const buildApplicationStats = (applications, todayKey) => {
  // The last 6 months, ending with the student's current month
  const year = Number(todayKey.slice(0, 4))
  const month = Number(todayKey.slice(5, 7))
  const monthly = []
  for (let i = 5; i >= 0; i--) {
    monthly.push({
      month: new Date(Date.UTC(year, month - 1 - i, 1)).toISOString().slice(0, 7),
      count: 0,
    })
  }
  const monthIndex = new Map(monthly.map((m, i) => [m.month, i]))

  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0]))
  const furthest = []
  const rejections = Object.fromEntries(OPEN_STAGES.map((s) => [s, 0]))
  const packages = []
  const offers = []

  for (const a of applications) {
    if (a.status in statusCounts) statusCounts[a.status] += 1

    const history = statusesOf(a)
    // Jobs that were only saved never counted as applications
    if (!history.some((s) => s !== 'Saved')) continue

    // How far along the path did it get? Rejected-only entries count as having applied.
    furthest.push(Math.max(0, ...history.map((s) => PATH.indexOf(s))))

    const idx = monthIndex.get(new Date(a.applicationDate).toISOString().slice(0, 7))
    if (idx !== undefined) monthly[idx].count += 1

    if (typeof a.packageLpa === 'number') packages.push(a.packageLpa)
    if (a.status === 'Selected' && typeof a.packageLpa === 'number') {
      offers.push({ company: a.company, packageLpa: a.packageLpa })
    }

    // Where was the application when it was rejected?
    if (a.status === 'Rejected') {
      let before = 'Applied'
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i] !== 'Rejected') {
          before = history[i]
          break
        }
      }
      if (before === 'Saved') before = 'Applied'
      if (before in rejections) rejections[before] += 1
    }
  }

  const applied = furthest.length
  const funnel = PATH.map((stage, i) => ({
    stage,
    count: furthest.filter((f) => f >= i).length,
  }))
  const bestOffer = offers.sort((a, b) => b.packageLpa - a.packageLpa)[0] || null

  return {
    total: applications.length,
    saved: statusCounts.Saved,
    applied,
    active: OPEN_STAGES.reduce((sum, s) => sum + statusCounts[s], 0),
    selected: statusCounts.Selected,
    rejected: statusCounts.Rejected,
    interviewRate: percent(funnel[2].count, applied),
    offerRate: percent(statusCounts.Selected, applied),
    funnel,
    rejectionsByStage: OPEN_STAGES.map((stage) => ({ stage, count: rejections[stage] })),
    monthly,
    package: {
      tracked: packages.length,
      average: packages.length ? round1(packages.reduce((a, b) => a + b, 0) / packages.length) : null,
      highest: packages.length ? Math.max(...packages) : null,
      offers: offers.length,
      highestOffer: bestOffer,
    },
  }
}