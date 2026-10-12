// The fields the statistics need, so every query loads the same data
export const INTERVIEW_STATS_FIELDS =
  'role type difficulty completedAt evaluation questions.topic questions.category questions.score questions.answer'

const round1 = (n) => Math.round(n * 10) / 10
const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null)
const keyOf = (topic) => String(topic || '').toLowerCase().replace(/\s+/g, ' ').trim()
const answered = (q) => typeof q.answer === 'string' && q.answer.trim().length > 0

const EMPTY = {
  total: 0,
  average: null,
  best: null,
  latest: null,
  changeSinceFirst: null,
  averages: { technical: null, communication: null },
  byCategory: [],
  trend: [],
  topics: [],
  weakTopics: [],
  strongTopics: [],
  studyTopics: [],
}

// sessions: completed interviews in any order
export const buildInterviewStats = (sessions) => {
  const sorted = [...sessions]
    .filter((s) => s.evaluation)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))

  const total = sorted.length
  if (total === 0) return EMPTY

  const scores = sorted.map((s) => s.evaluation.overallScore ?? 0)

  // Last 10 interviews, oldest first, numbered by their position over all interviews
  const trend = sorted
    .map((s, i) => ({
      id: String(s._id),
      number: i + 1,
      completedAt: s.completedAt,
      score: scores[i],
      technical: s.evaluation.technicalScore ?? null,
      communication: s.evaluation.communicationScore ?? null,
      role: s.role,
      type: s.type,
      difficulty: s.difficulty,
    }))
    .slice(-10)

  // Topic and category performance, counting only questions the student answered
  const topicMap = new Map()
  const categoryScores = { Technical: [], HR: [] }

  for (const s of sorted) {
    const weakHere = new Set()
    for (const q of s.questions || []) {
      if (!answered(q)) continue
      const score = Number(q.score) || 0

      if (categoryScores[q.category]) categoryScores[q.category].push(score)

      const key = keyOf(q.topic)
      if (!key) continue

      const t = topicMap.get(key) || { topic: String(q.topic).trim(), attempts: 0, total: 0, weakSessions: 0 }
      t.attempts += 1
      t.total += score
      if (score <= 5 && !weakHere.has(key)) {
        t.weakSessions += 1
        weakHere.add(key)
      }
      topicMap.set(key, t)
    }
  }

  // Weakest first
  const topics = [...topicMap.values()]
    .map((t) => ({
      topic: t.topic,
      attempts: t.attempts,
      average: round1(t.total / t.attempts),
      weakSessions: t.weakSessions,
      recurring: t.weakSessions >= 2,
    }))
    .sort((a, b) => a.average - b.average || b.attempts - a.attempts)

  // Study topics from the three most recent interviews, without duplicates
  const seen = new Set()
  const studyTopics = []
  for (const s of [...sorted].reverse().slice(0, 3)) {
    for (const t of s.evaluation.studyTopics || []) {
      const key = keyOf(t)
      if (key && !seen.has(key)) {
        seen.add(key)
        studyTopics.push(String(t).trim())
      }
    }
  }

  const technicalScores = sorted.map((s) => s.evaluation.technicalScore).filter((v) => typeof v === 'number')
  const communicationScores = sorted
    .map((s) => s.evaluation.communicationScore)
    .filter((v) => typeof v === 'number')

  return {
    total,
    average: Math.round(mean(scores)),
    best: Math.max(...scores),
    latest: scores[total - 1],
    changeSinceFirst: total >= 2 ? scores[total - 1] - scores[0] : null,
    averages: {
      technical: technicalScores.length ? round1(mean(technicalScores)) : null,
      communication: communicationScores.length ? round1(mean(communicationScores)) : null,
    },
    byCategory: Object.entries(categoryScores)
      .filter(([, list]) => list.length > 0)
      .map(([category, list]) => ({ category, average: round1(mean(list)), questions: list.length })),
    trend,
    topics,
    weakTopics: topics.filter((t) => t.average <= 5).slice(0, 8),
    strongTopics: topics.filter((t) => t.average >= 7).reverse().slice(0, 5),
    studyTopics: studyTopics.slice(0, 10),
  }
}