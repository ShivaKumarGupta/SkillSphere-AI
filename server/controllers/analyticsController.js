import DsaProblem from '../models/DsaProblem.js'
import InterviewSession from '../models/InterviewSession.js'
import Application from '../models/Application.js'
import Roadmap from '../models/Roadmap.js'
import ResumeAnalysis from '../models/ResumeAnalysis.js'
import Project from '../models/Project.js'
import Certificate from '../models/Certificate.js'
import { buildDsaStats, parseTodayKey } from '../utils/dsaStats.js'
import { buildInterviewStats, INTERVIEW_STATS_FIELDS } from '../utils/interviewStats.js'
import { buildApplicationStats, APPLICATION_STATS_FIELDS } from '../utils/applicationStats.js'
import { buildSkillStats } from '../utils/skillStats.js'
import { buildWeeklyActivity } from '../utils/weeklyActivity.js'

export const getAnalytics = async (req, res) => {
  try {
    const user = req.user
    const todayKey = parseTodayKey(req.query.today)

    const [problems, interviewDocs, applicationDocs, roadmap, analysis, projects, certificates] =
      await Promise.all([
        DsaProblem.find({ user: user._id }).select('solvedDate difficulty topic').limit(5000).lean(),
        InterviewSession.find({ user: user._id, status: 'completed' })
          .select(INTERVIEW_STATS_FIELDS)
          .sort({ completedAt: -1 })
          .limit(100)
          .lean(),
        Application.find({ user: user._id }).select(APPLICATION_STATS_FIELDS).limit(500).lean(),
        Roadmap.findOne({ user: user._id }).select('milestones').lean(),
        ResumeAnalysis.findOne({ user: user._id }).select('overallScore history updatedAt').lean(),
        Project.find({ user: user._id }).select('technologies').lean(),
        Certificate.find({ user: user._id }).select('relatedSkill').lean(),
      ])

    const dsa = buildDsaStats(problems, todayKey, user.dsaWeeklyGoal)
    const interviews = buildInterviewStats(interviewDocs)
    const applications = buildApplicationStats(applicationDocs, todayKey)
    const milestones = roadmap?.milestones || []

    // Older analyses were saved before history existed, so show them as a single point
    let scores = (analysis?.history || []).map((h) => ({ score: h.score, at: h.at }))
    if (scores.length === 0 && analysis) {
      scores = [{ score: analysis.overallScore, at: analysis.updatedAt }]
    }
    const resumeTrend = scores.map((h, i) => ({ number: i + 1, score: h.score, at: h.at }))

    const activity = buildWeeklyActivity(
      {
        dsa: problems.map((p) => p.solvedDate),
        interviews: interviewDocs.map((s) => s.completedAt),
        milestones: milestones.filter((m) => m.completed && m.completedAt).map((m) => m.completedAt),
        applications: applicationDocs.filter((a) => a.status !== 'Saved').map((a) => a.applicationDate),
      },
      todayKey
    )

    res.json({
      skills: buildSkillStats(user.skills, projects, certificates),
      dsa: { total: dsa.total, difficulty: dsa.difficulty, streak: dsa.streak, goal: dsa.goal },
      interviews: {
        total: interviews.total,
        average: interviews.average,
        best: interviews.best,
        latest: interviews.latest,
        trend: interviews.trend,
      },
      resume: {
        latest: resumeTrend.length ? resumeTrend[resumeTrend.length - 1].score : null,
        change: resumeTrend.length >= 2 ? resumeTrend[resumeTrend.length - 1].score - resumeTrend[0].score : null,
        trend: resumeTrend,
      },
      applications: {
        applied: applications.applied,
        active: applications.active,
        selected: applications.selected,
        rejected: applications.rejected,
        interviewRate: applications.interviewRate,
        funnel: applications.funnel,
      },
      roadmap: {
        total: milestones.length,
        done: milestones.filter((m) => m.completed).length,
      },
      activity,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}