import Project from '../models/Project.js'
import Certificate from '../models/Certificate.js'
import DsaProblem from '../models/DsaProblem.js'
import Roadmap from '../models/Roadmap.js'
import ResumeAnalysis from '../models/ResumeAnalysis.js'
import UploadedResume from '../models/UploadedResume.js'
import { buildDsaStats } from '../utils/dsaStats.js'
import { getProfileCompletion } from '../utils/profileCompletion.js'

const TAGS = [
  'profile',
  'skills',
  'projects',
  'certificates',
  'dsa_summary',
  'roadmap',
  'resume_review',
  'resume_text',
  'conversation',
  'student_message',
  'interview_setup',
  'interview_transcript',
]
const TAG_PATTERN = new RegExp(`</?(?:${TAGS.join('|')})>`, 'gi')

// Removes our data tags from untrusted text. It repeats until nothing is left to remove,
// so nested text like "</resume_<resume_text>text>" cannot rebuild a tag.
export const stripTags = (value) => {
  let text = String(value ?? '')
  let previous
  do {
    previous = text
    text = text.replace(TAG_PATTERN, '')
  } while (text !== previous)
  return text
}

const short = (value, max = 200) =>
  stripTags(typeof value === 'string' ? value.replace(/[\u0000-\u001F]/g, ' ').trim().slice(0, max) : '')

const list = (items, empty = 'none') => (items.length ? items.join(', ') : empty)

const MAX_RESUME_CHARS = 6000

export const loadStudentContext = async (user, todayKey) => {
  const [projects, certificates, problems, roadmap, analysis, upload] = await Promise.all([
    Project.find({ user: user._id })
      .select('name technologies status')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Certificate.find({ user: user._id })
      .select('name organization')
      .sort({ issueDate: -1 })
      .limit(10)
      .lean(),
    DsaProblem.find({ user: user._id }).select('solvedDate difficulty topic').limit(5000).lean(),
    Roadmap.findOne({ user: user._id }).lean(),
    ResumeAnalysis.findOne({ user: user._id }).lean(),
    UploadedResume.findOne({ user: user._id }).select('text').lean(),
  ])

  const dsa = buildDsaStats(problems, todayKey, user.dsaWeeklyGoal)
  const completion = getProfileCompletion(user)

  const started = dsa.topics.filter((t) => t.count > 0).map((t) => `${t.topic} (${t.count})`)
  const notStarted = dsa.topics
    .filter((t) => t.count === 0 && t.topic !== 'Other')
    .map((t) => t.topic)

  const projectLines = projects.length
    ? projects
        .map((p) => {
          const tech = (p.technologies || []).slice(0, 10).map((t) => short(t, 40))
          return `- ${short(p.name, 100)} (${p.status}): ${list(tech, 'no technologies listed')}`
        })
        .join('\n')
    : 'None yet'

  let roadmapText = 'No roadmap generated yet'
  if (roadmap && roadmap.milestones?.length) {
    const done = roadmap.milestones.filter((m) => m.completed).length
    const next = roadmap.milestones.find((m) => !m.completed)
    roadmapText = [
      `Target role: ${short(roadmap.targetRole, 100)}`,
      `Progress: ${done} of ${roadmap.milestones.length} milestones done`,
      `Next milestone: ${next ? short(next.title, 120) : 'all done'}`,
      ...roadmap.milestones.map(
        (m, i) => `${i + 1}. [${m.completed ? 'done' : 'todo'}] ${short(m.title, 120)} (${m.category})`
      ),
    ].join('\n')
  }

  const reviewText = analysis
    ? [
        `Score: ${analysis.overallScore}/100 for ${short(analysis.targetRole, 100)}`,
        `Summary: ${short(analysis.summary, 400)}`,
        `Skill gaps: ${list((analysis.skillGaps || []).map((s) => short(s, 100)))}`,
        `Missing keywords: ${list((analysis.missingKeywords || []).map((s) => short(s, 80)))}`,
        `Weak sections: ${list((analysis.weakSections || []).map((w) => short(w.section, 100)))}`,
      ].join('\n')
    : 'No AI resume analysis yet'

  const resumeText = upload ? stripTags(upload.text.slice(0, MAX_RESUME_CHARS)) : 'No resume uploaded yet'

  return `<profile>
First name: ${short(String(user.name || '').split(/\s+/)[0], 40) || 'unknown'}
College: ${short(user.college, 100) || 'not set'}
Degree and branch: ${short([user.degree, user.branch].filter(Boolean).join(', '), 150) || 'not set'}
Graduation year: ${user.graduationYear || 'not set'}
CGPA: ${user.cgpa ?? 'not set'}
Target role: ${short(user.targetRole, 100) || 'not set'}
Experience level: ${user.experienceLevel || 'not set'}
Career interests: ${list((user.careerInterests || []).slice(0, 10).map((s) => short(s, 40)), 'not set')}
Profile completion: ${completion.percentage}% (missing: ${list(completion.missing)})
</profile>
<skills>${list((user.skills || []).slice(0, 30).map((s) => short(s, 40)), 'none listed')}</skills>
<projects>
${projectLines}
</projects>
<certificates>${list(certificates.map((c) => short(c.name, 100)), 'none yet')}</certificates>
<dsa_summary>
Problems solved: ${dsa.total} (Easy ${dsa.difficulty.Easy}, Medium ${dsa.difficulty.Medium}, Hard ${dsa.difficulty.Hard})
Current streak: ${dsa.streak.current} days (longest ${dsa.streak.longest})
This week: ${dsa.goal.solvedThisWeek} of ${dsa.goal.weekly} weekly goal
Topics started: ${list(started)}
Topics not started: ${list(notStarted)}
</dsa_summary>
<roadmap>
${roadmapText}
</roadmap>
<resume_review>
${reviewText}
</resume_review>
<resume_text>
${resumeText}
</resume_text>`
}