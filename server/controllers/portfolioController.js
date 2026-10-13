import Portfolio, { RESERVED_SLUGS } from '../models/Portfolio.js'
import User from '../models/User.js'
import Project from '../models/Project.js'
import Certificate from '../models/Certificate.js'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const BOOLEANS = ['isPublic', 'showEmail', 'showEducation', 'showSkills', 'showProjects', 'showCertificates']

const line = (v, max) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001F]/g, ' ').trim().slice(0, max) : ''

const block = (v, max) =>
  typeof v === 'string'
    ? v
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .trim()
        .slice(0, max)
    : ''

// Returns a safe http(s) link, or an empty string. Anything else (such as javascript:) is dropped.
const toUrl = (value) => {
  let s = typeof value === 'string' ? value.trim() : ''
  if (!s) return ''
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s}`
  try {
    const url = new URL(s)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href.slice(0, 300) : ''
  } catch {
    return ''
  }
}

const parseSlug = (raw) => {
  const slug = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (slug.length < 3 || slug.length > 30) {
    return { error: 'The link name must be 3 to 30 characters long' }
  }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      error: 'Use only lowercase letters, numbers and single hyphens, and do not start or end with a hyphen',
    }
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return { error: 'That link name is reserved. Please choose another one' }
  }
  return { slug }
}

const toSettings = (p) => ({
  slug: p.slug,
  isPublic: p.isPublic,
  headline: p.headline,
  bio: p.bio,
  showEmail: p.showEmail,
  showEducation: p.showEducation,
  showSkills: p.showSkills,
  showProjects: p.showProjects,
  showCertificates: p.showCertificates,
})

// ---------- the student's own settings ----------

export const getMyPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id }).lean()
    res.json({ portfolio: portfolio ? toSettings(portfolio) : null })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const saveMyPortfolio = async (req, res) => {
  try {
    const body = req.body || {}

    const { slug, error } = parseSlug(body.slug)
    if (error) return res.status(400).json({ message: error })

    for (const key of BOOLEANS) {
      if (typeof body[key] !== 'boolean') {
        return res.status(400).json({ message: `Invalid value for ${key}` })
      }
    }

    const data = {
      slug,
      headline: line(body.headline, 100),
      bio: block(body.bio, 500),
    }
    for (const key of BOOLEANS) data[key] = body[key]

    const portfolio = await Portfolio.findOneAndUpdate({ user: req.user._id }, data, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    })

    res.json({ portfolio: toSettings(portfolio) })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'That link name is already taken. Please choose another one' })
    }
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// ---------- the public page (no login needed) ----------

export const getPublicPortfolio = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store')

    const notFound = () => res.status(404).json({ message: 'Portfolio not found' })

    const slug = typeof req.params.slug === 'string' ? req.params.slug.toLowerCase() : ''
    if (slug.length > 30 || !SLUG_PATTERN.test(slug)) return notFound()

    // A private portfolio and a missing one give the same answer
    const portfolio = await Portfolio.findOne({ slug, isPublic: true }).lean()
    if (!portfolio) return notFound()

    const [user, projects, certificates] = await Promise.all([
      User.findById(portfolio.user)
        .select('name email college degree branch graduationYear cgpa skills targetRole github linkedin')
        .lean(),
      portfolio.showProjects
        ? Project.find({ user: portfolio.user, status: { $ne: 'Planned' } })
            .sort({ createdAt: -1 })
            .limit(12)
            .lean()
        : [],
      portfolio.showCertificates
        ? Certificate.find({ user: portfolio.user }).sort({ issueDate: -1 }).limit(12).lean()
        : [],
    ])
    if (!user) return notFound()

    // The response is built field by field, so nothing private can leak by accident
    res.json({
      name: user.name,
      headline: portfolio.headline,
      bio: portfolio.bio,
      targetRole: user.targetRole || '',
      email: portfolio.showEmail ? user.email : null,
      links: {
        github: toUrl(user.github),
        linkedin: toUrl(user.linkedin),
      },
      education: portfolio.showEducation
        ? {
            college: user.college || '',
            degree: user.degree || '',
            branch: user.branch || '',
            graduationYear: user.graduationYear || null,
            cgpa: user.cgpa ?? null,
          }
        : null,
      skills: portfolio.showSkills ? (user.skills || []).slice(0, 40) : [],
      projects: projects.map((p) => ({
        name: p.name,
        description: p.description || '',
        technologies: p.technologies || [],
        status: p.status,
        githubUrl: toUrl(p.githubUrl),
        liveUrl: toUrl(p.liveUrl),
      })),
      certificates: certificates.map((c) => ({
        name: c.name,
        organization: c.organization,
        year: new Date(c.issueDate).getUTCFullYear(),
        relatedSkill: c.relatedSkill || '',
        credentialUrl: toUrl(c.credentialUrl),
      })),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}