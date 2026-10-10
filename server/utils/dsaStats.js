import { TOPICS } from '../models/DsaProblem.js'

const DAY = 86400000
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

const keyToMs = (key) => Date.parse(`${key}T00:00:00Z`)
const msToKey = (ms) => new Date(ms).toISOString().slice(0, 10)

// The browser sends its own local "today"; fall back to the server date if it is missing or invalid
export const parseTodayKey = (value) => {
  if (typeof value === 'string' && DATE_KEY.test(value)) {
    const ms = keyToMs(value)
    if (!Number.isNaN(ms) && msToKey(ms) === value) return value
  }
  return msToKey(Date.now())
}

export const buildDsaStats = (problems, todayKey, weeklyGoal) => {
  const todayMs = keyToMs(todayKey)

  const difficulty = { Easy: 0, Medium: 0, Hard: 0 }
  const topicCounts = Object.fromEntries(TOPICS.map((t) => [t, 0]))
  const dayCounts = new Map()

  for (const p of problems) {
    difficulty[p.difficulty] += 1
    topicCounts[p.topic] += 1
    const key = msToKey(p.solvedDate.getTime())
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1)
  }

  // Current streak: stays alive until a full day passes with nothing solved
  let cursor = todayMs
  if (!dayCounts.has(msToKey(cursor))) cursor -= DAY
  let current = 0
  while (dayCounts.has(msToKey(cursor))) {
    current += 1
    cursor -= DAY
  }

  // Longest streak
  let longest = 0
  let run = 0
  let prev = null
  for (const key of [...dayCounts.keys()].sort()) {
    const ms = keyToMs(key)
    run = prev !== null && ms - prev === DAY ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = ms
  }

  // Last 14 days
  const daily = []
  for (let i = 13; i >= 0; i--) {
    const key = msToKey(todayMs - i * DAY)
    daily.push({ date: key, count: dayCounts.get(key) || 0 })
  }

  // Last 8 weeks (weeks start on Monday)
  const weekStartMs = todayMs - ((new Date(todayMs).getUTCDay() + 6) % 7) * DAY
  const weekly = []
  for (let i = 7; i >= 0; i--) {
    const start = weekStartMs - i * 7 * DAY
    let count = 0
    for (let d = 0; d < 7; d++) {
      count += dayCounts.get(msToKey(start + d * DAY)) || 0
    }
    weekly.push({ weekStart: msToKey(start), count })
  }

  return {
    total: problems.length,
    difficulty,
    topics: TOPICS.map((topic) => ({ topic, count: topicCounts[topic] })),
    daily,
    weekly,
    streak: { current, longest },
    goal: {
      weekly: weeklyGoal,
      solvedThisWeek: weekly[weekly.length - 1].count,
    },
  }
}