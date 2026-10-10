import Project from '../models/Project.js'
import Certificate from '../models/Certificate.js'
import DsaProblem from '../models/DsaProblem.js'
import { buildDsaStats, parseTodayKey } from '../utils/dsaStats.js'
import { getProfileCompletion } from '../utils/profileCompletion.js'

const ratio = (value, target) => (target > 0 ? Math.min(1, value / target) : 0)
const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase()

export const getDashboard = async (req, res) => {
  try {
    const user = req.user
    const todayKey = parseTodayKey(req.query.today)

    const [projects, certificates, problems] = await Promise.all([
      Project.find({ user: user._id }).select('name technologies status').lean(),
      Certificate.find({ user: user._id }).select('relatedSkill').lean(),
      DsaProblem.find({ user: user._id }).select('solvedDate difficulty topic').lean(),
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
    const areas = [
      { key: 'profile', label: 'Profile', weight: 25, score: profile.percentage / 100 },
      { key: 'skills', label: 'Skills with proof', weight: 15, score: ratio(provenSkills.length, skills.length) },
      { key: 'projects', label: 'Completed projects', weight: 20, score: ratio(byStatus.Completed, 3) },
      { key: 'certificates', label: 'Certificates', weight: 10, score: ratio(certificates.length, 3) },
      {
        key: 'dsa',
        label: 'DSA practice',
        weight: 30,
        score: 0.7 * ratio(dsa.total, 100) + 0.3 * ratio(dsa.goal.solvedThisWeek, dsa.goal.weekly),
      },
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
      nextActions,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}