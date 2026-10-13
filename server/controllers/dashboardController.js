import Project from '../models/Project.js'
import Certificate from '../models/Certificate.js'
import DsaProblem from '../models/DsaProblem.js'
import { buildDsaStats, parseTodayKey } from '../utils/dsaStats.js'
import { getProfileCompletion } from '../utils/profileCompletion.js'
import Roadmap from '../models/Roadmap.js'
import InterviewSession from '../models/InterviewSession.js'
import { buildInterviewStats, INTERVIEW_STATS_FIELDS } from '../utils/interviewStats.js'
import Application from '../models/Application.js'
import ResumeAnalysis from '../models/ResumeAnalysis.js'

const ratio = (value, target) => (target > 0 ? Math.min(1, value / target) : 0)
const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase()

export const getDashboard = async (req, res) => {
  try {
    const user = req.user
    const todayKey = parseTodayKey(req.query.today)

    const [projects, certificates, problems, roadmapDoc, interviewDocs, applicationDocs, analysisDoc] =
      await Promise.all([
        Project.find({ user: user._id }).select('name technologies status').lean(),
        Certificate.find({ user: user._id }).select('relatedSkill').lean(),
        DsaProblem.find({ user: user._id }).select('solvedDate difficulty topic').lean(),
        Roadmap.findOne({ user: user._id }).select('milestones').lean(),
        InterviewSession.find({ user: user._id, status: 'completed' })
          .select(INTERVIEW_STATS_FIELDS)
          .sort({ completedAt: -1 })
          .limit(50)
          .lean(),
        Application.find({ user: user._id }).select('company status interviews').lean(),
        ResumeAnalysis.findOne({ user: user._id }).select('overallScore').lean(),
      ])

    const profile = getProfileCompletion(user)
    const dsa = buildDsaStats(problems, todayKey, user.dsaWeeklyGoal)

    // Which skills are backed by a project or a certificate?
    const skills = user.skills.map((skill) => ({
      skill,
      projects: projects.filter((p) => p.technologies.some((t) => same(t, skill))).length,
      certificates: certificates.filter((c) => same(c.relatedSkill, skill)).length,
    }))
    const provenSkills = skills.filter((s) => s.projects + s.certificates > 0)
    const unprovenSkills = skills.filter((s) => s.projects + s.certificates === 0)

    const byStatus = { Planned: 0, 'In Progress': 0, Completed: 0 }
    for (const p of projects) byStatus[p.status] += 1

    // Overall readiness: each area has a weight, and the weights add up to 100
    const interviewStats = buildInterviewStats(interviewDocs)
    const appliedCount = applicationDocs.filter((a) => a.status !== 'Saved').length

    const areas = [
      { key: 'profile', label: 'Profile', weight: 15, score: profile.percentage / 100 },
      { key: 'skills', label: 'Skills with proof', weight: 10, score: ratio(provenSkills.length, skills.length) },
      { key: 'projects', label: 'Completed projects', weight: 15, score: ratio(byStatus.Completed, 3) },
      { key: 'certificates', label: 'Certificates', weight: 5, score: ratio(certificates.length, 3) },
      {
        key: 'dsa',
        label: 'DSA practice',
        weight: 20,
        score: 0.7 * ratio(dsa.total, 100) + 0.3 * ratio(dsa.goal.solvedThisWeek, dsa.goal.weekly),
      },
      {
        key: 'resume',
        label: 'Resume (AI review)',
        weight: 15,
        score: analysisDoc ? analysisDoc.overallScore / 100 : 0,
      },
      {
        key: 'interviews',
        label: 'Mock interviews',
        weight: 12,
        score: interviewStats.total > 0 ? interviewStats.average / 100 : 0,
      },
      { key: 'applications', label: 'Applications', weight: 8, score: ratio(appliedCount, 5) },
    ]

    const readiness = {
      percentage: Math.round(areas.reduce((sum, a) => sum + a.weight * a.score, 0)),
      areas: areas.map((a) => ({
        key: a.key,
        label: a.label,
        weight: a.weight,
        percentage: Math.round(a.score * 100),
      })),
    }

    // "What to work on next": simple rules, lowest priority number comes first
    const actions = []
    const add = (priority, title, detail, link) => actions.push({ priority, title, detail, link })

    if (profile.percentage < 100) {
      add(
        profile.percentage < 60 ? 1 : 5,
        'Complete your profile',
        `Still missing: ${profile.missing.join(', ')}`,
        '/profile'
      )
    }

    if (projects.length === 0) {
      add(2, 'Add your first project', 'Projects are the first thing recruiters look at, so start building your portfolio.', '/projects')
    } else {
      const inProgress = projects.find((p) => p.status === 'In Progress')
      if (inProgress) {
        add(4, `Finish "${inProgress.name}"`, 'Mark it Completed once it is done and on GitHub.', '/projects')
      }
    }

    if (unprovenSkills.length > 0) {
      const names = unprovenSkills.slice(0, 5).map((s) => s.skill)
      add(
        3,
        'Back your skills with proof',
        `No project or certificate yet for: ${names.join(', ')}. Build something with ${names[0]} or add a related certificate.`,
        '/projects'
      )
    }

    if (certificates.length === 0) {
      add(6, 'Add a certificate', 'A verifiable course or credential adds credibility to your skills.', '/certificates')
    }

    if (dsa.total === 0) {
      add(2, 'Log your first DSA problem', 'Start your streak and unlock your topic-wise progress.', '/dsa')
    } else {
      if (dsa.streak.current === 0) {
        add(3, 'Restart your streak', 'Solve one problem today to start a new streak.', '/dsa')
      }

      const remaining = dsa.goal.weekly - dsa.goal.solvedThisWeek
      if (remaining > 0) {
        add(
          4,
          `Solve ${remaining} more ${remaining === 1 ? 'problem' : 'problems'} this week`,
          `You have solved ${dsa.goal.solvedThisWeek} of your ${dsa.goal.weekly} weekly goal.`,
          '/dsa'
        )
      }

      const nextTopic = dsa.topics.find((t) => t.count === 0 && t.topic !== 'Other')
      if (nextTopic) {
        add(5, `Start ${nextTopic.topic}`, 'This is the next topic on the learning path that you have not touched yet.', '/dsa')
      }
    }

    const milestones = roadmapDoc?.milestones || []
    const doneMilestones = milestones.filter((m) => m.completed).length
    const nextMilestone = milestones.find((m) => !m.completed)

    if (milestones.length === 0) {
      if (user.targetRole) {
        add(3, 'Generate your career roadmap', 'Get a step-by-step plan for your target role, based on what you already know.', '/roadmap')
      }
    } else if (nextMilestone) {
      add(4, `Next milestone: ${nextMilestone.title}`, `${doneMilestones} of ${milestones.length} roadmap milestones done.`, '/roadmap')
    }

    if (user.targetRole) {
      if (interviewStats.total === 0) {
        add(5, 'Take your first mock interview', 'Practise with questions written for your profile and get scored feedback.', '/interview')
      } else if (interviewStats.latest < 60 && interviewStats.weakTopics.length > 0) {
        add(
          4,
          `Practise ${interviewStats.weakTopics[0].topic}`,
          `Your latest interview scored ${interviewStats.latest}/100, and this is your weakest topic so far.`,
          '/interview'
        )
      }
    }
    const ACTIVE = ['Applied', 'Online Assessment', 'Technical Interview', 'HR Interview']
    const now = Date.now()

    const upcoming = applicationDocs
      .filter((a) => ACTIVE.includes(a.status))
      .flatMap((a) =>
        (a.interviews || []).map((iv) => ({ company: a.company, round: iv.round, date: iv.date }))
      )
      .filter((iv) => iv.date.getTime() > now)
      .sort((a, b) => a.date - b.date)
    const nextInterview = upcoming[0] || null

    if (nextInterview) {
      const days = Math.ceil((nextInterview.date.getTime() - now) / 86400000)
      if (days <= 7) {
        add(
          1,
          `Prepare for your ${nextInterview.round} at ${nextInterview.company}`,
          `It is ${days <= 1 ? 'in the next 24 hours' : `in ${days} days`}. Practise with a mock interview or ask the assistant for likely questions.`,
          '/interview'
        )
      }
    }

    if (applicationDocs.length === 0 && user.targetRole) {
      add(6, 'Track your first application', 'Keep every company, stage and interview date in one place.', '/applications')
    }
    if (!analysisDoc && user.targetRole) {
      add(5, 'Get your resume reviewed by AI', 'Upload your resume and see your score, skill gaps and missing keywords.', '/resume/analysis')
    }
    const nextActions = actions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 4)
      .map(({ title, detail, link }) => ({ title, detail, link }))

    res.json({
      readiness,
      profile: { percentage: profile.percentage, missing: profile.missing },
      skills,
      projects: { total: projects.length, byStatus },
      certificates: { total: certificates.length },
      dsa: { total: dsa.total, streak: dsa.streak, goal: dsa.goal },
      roadmap: {
        total: milestones.length,
        done: doneMilestones,
        next: nextMilestone ? nextMilestone.title : null,
      },
      interviews: {
        total: interviewStats.total,
        average: interviewStats.average,
        latest: interviewStats.latest,
        weakestTopic: interviewStats.weakTopics[0]?.topic || null,
      },
      applications: {
        total: applicationDocs.length,
        active: applicationDocs.filter((a) => ACTIVE.includes(a.status)).length,
        selected: applicationDocs.filter((a) => a.status === 'Selected').length,
        nextInterview: nextInterview
          ? { company: nextInterview.company, round: nextInterview.round, date: nextInterview.date }
          : null,
      },
      resume: { score: analysisDoc ? analysisDoc.overallScore : null },
      nextActions,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}