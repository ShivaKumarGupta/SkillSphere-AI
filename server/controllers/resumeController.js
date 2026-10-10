import Resume from '../models/Resume.js'
import Project from '../models/Project.js'
import Certificate from '../models/Certificate.js'

// ---------- small validation helpers ----------

const fail = (message) => {
  const error = new Error(message)
  error.status = 400
  throw error
}

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max).map(obj) : [])

const lines = (v, maxItems, maxLen) =>
  Array.isArray(v)
    ? v
        .filter((x) => typeof x === 'string')
        .map((x) => x.trim().slice(0, maxLen))
        .filter(Boolean)
        .slice(0, maxItems)
    : []

const tags = (v, maxItems) => [...new Set(lines(v, 100, 50))].slice(0, maxItems)

const url = (v, label) => {
  const s = str(v, 300)
  if (!s) return ''
  try {
    const u = new URL(s)
    if (u.protocol === 'http:' || u.protocol === 'https:') return s
  } catch {
    // falls through to the error below
  }
  return fail(`${label} must start with http:// or https://`)
}

const year = (v, label) => {
  const s = str(v, 10)
  if (s && !/^\d{4}$/.test(s)) fail(`${label} must be a 4-digit year`)
  return s
}

const month = (v, label) => {
  const s = str(v, 10)
  if (s && !/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) fail(`${label} is not a valid month`)
  return s
}

const handleError = (res, error) => {
  if (error.status === 400) return res.status(400).json({ message: error.message })
  console.error(error)
  return res.status(500).json({ message: 'Server error' })
}

// ---------- validate and clean what the student sends ----------

const parseResume = (body) => {
  const c = obj(body.contact)
  const email = str(c.email, 100)
  if (email && !/^\S+@\S+\.\S+$/.test(email)) fail('Enter a valid email address')

  return {
    contact: {
      fullName: str(c.fullName, 100),
      email,
      phone: str(c.phone, 30),
      location: str(c.location, 100),
      linkedin: url(c.linkedin, 'LinkedIn link'),
      github: url(c.github, 'GitHub link'),
      portfolio: url(c.portfolio, 'Portfolio link'),
    },
    summary: str(body.summary, 600),
    education: list(body.education, 6)
      .map((e) => ({
        institution: str(e.institution, 150),
        degree: str(e.degree, 100),
        field: str(e.field, 100),
        startYear: year(e.startYear, 'Education start year'),
        endYear: year(e.endYear, 'Education end year'),
        score: str(e.score, 30),
      }))
      .filter((e) => e.institution || e.degree),
    skills: tags(body.skills, 40),
    projects: list(body.projects, 8)
      .map((p) => ({
        name: str(p.name, 100),
        technologies: tags(p.technologies, 15),
        link: url(p.link, 'Project link'),
        bullets: lines(p.bullets, 6, 400),
      }))
      .filter((p) => p.name),
    experience: list(body.experience, 8)
      .map((x) => {
        const current = x.current === true
        return {
          company: str(x.company, 100),
          role: str(x.role, 100),
          startDate: month(x.startDate, 'Start date'),
          endDate: current ? '' : month(x.endDate, 'End date'),
          current,
          bullets: lines(x.bullets, 6, 400),
        }
      })
      .filter((x) => x.company || x.role),
    achievements: lines(body.achievements, 10, 300),
    certifications: list(body.certifications, 10)
      .map((cert) => ({
        name: str(cert.name, 150),
        organization: str(cert.organization, 100),
        year: year(cert.year, 'Certificate year'),
      }))
      .filter((cert) => cert.name),
    codingProfiles: list(body.codingProfiles, 8)
      .map((p) => ({
        platform: str(p.platform, 50),
        url: url(p.url, 'Coding profile link'),
      }))
      .filter((p) => p.platform || p.url),
  }
}

// ---------- pull data from the rest of SkillSphere ----------

const toUrl = (v) => {
  let s = typeof v === 'string' ? v.trim() : ''
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`
  try {
    return new URL(s).href.slice(0, 300)
  } catch {
    return ''
  }
}

const buildFromSkillSphere = async (user) => {
  const [projects, certificates] = await Promise.all([
    Project.find({ user: user._id, status: { $ne: 'Planned' } })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Certificate.find({ user: user._id }).sort({ issueDate: -1 }).limit(8).lean(),
  ])

  return {
    contact: {
      fullName: user.name,
      email: user.email,
      linkedin: toUrl(user.linkedin),
      github: toUrl(user.github),
    },
    education:
      user.college || user.degree
        ? [
            {
              institution: user.college,
              degree: user.degree,
              field: user.branch,
              endYear: user.graduationYear ? String(user.graduationYear) : '',
              score: user.cgpa != null ? `CGPA ${user.cgpa}` : '',
            },
          ]
        : [],
    skills: [...user.skills],
    projects: projects.map((p) => ({
      name: p.name,
      technologies: p.technologies,
      link: toUrl(p.githubUrl || p.liveUrl),
      bullets: p.description ? [p.description.slice(0, 400)] : [],
    })),
    certifications: certificates.map((c) => ({
      name: c.name,
      organization: c.organization,
      year: String(c.issueDate.getUTCFullYear()),
    })),
  }
}

const saveOptions = { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }

// ---------- route handlers ----------

export const getResume = async (req, res) => {
  try {
    let resume = await Resume.findOne({ user: req.user._id })

    if (!resume) {
      try {
        const fresh = await buildFromSkillSphere(req.user)
        resume = await Resume.create({ user: req.user._id, ...fresh })
      } catch (error) {
        // two requests arrived at the same moment; the other one already created it
        if (error.code !== 11000) throw error
        resume = await Resume.findOne({ user: req.user._id })
      }
    }

    res.json(resume)
  } catch (error) {
    handleError(res, error)
  }
}

export const saveResume = async (req, res) => {
  try {
    const data = parseResume(obj(req.body))
    const resume = await Resume.findOneAndUpdate({ user: req.user._id }, data, saveOptions)
    res.json(resume)
  } catch (error) {
    handleError(res, error)
  }
}

// Refreshes education, skills, projects and certifications from SkillSphere.
// Summary, experience, achievements and coding profiles are left untouched.
export const autofillResume = async (req, res) => {
  try {
    const fresh = await buildFromSkillSphere(req.user)
    const existing = await Resume.findOne({ user: req.user._id })
    const current = existing?.contact || {}
    const pick = (key) => current[key] || fresh.contact[key] || ''

    const contact = {
      fullName: pick('fullName'),
      email: pick('email'),
      phone: current.phone || '',
      location: current.location || '',
      linkedin: pick('linkedin'),
      github: pick('github'),
      portfolio: current.portfolio || '',
    }

    const resume = await Resume.findOneAndUpdate(
      { user: req.user._id },
      {
        contact,
        education: fresh.education,
        skills: fresh.skills,
        projects: fresh.projects,
        certifications: fresh.certifications,
      },
      saveOptions
    )

    res.json(resume)
  } catch (error) {
    handleError(res, error)
  }
}