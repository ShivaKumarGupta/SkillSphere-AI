import toUserResponse from '../utils/userResponse.js'

const TEXT_FIELDS = ['college', 'degree', 'branch', 'targetRole', 'github', 'linkedin']
const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced']

const cleanList = (value) => {
  if (!Array.isArray(value)) return []
  const items = value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim().slice(0, 40))
    .filter(Boolean)
  return [...new Set(items)].slice(0, 30)
}

export const updateProfile = async (req, res) => {
  try {
    const user = req.user
    const body = req.body

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' })
      }
      user.name = body.name.trim()
    }

    for (const field of TEXT_FIELDS) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'string') {
          return res.status(400).json({ message: `Invalid value for ${field}` })
        }
        user[field] = body[field].trim()
      }
    }

    if (body.cgpa !== undefined) {
      if (body.cgpa === '' || body.cgpa === null) {
        user.cgpa = undefined
      } else {
        const cgpa = Number(body.cgpa)
        if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
          return res.status(400).json({ message: 'CGPA must be between 0 and 10' })
        }
        user.cgpa = cgpa
      }
    }

    if (body.graduationYear !== undefined) {
      if (body.graduationYear === '' || body.graduationYear === null) {
        user.graduationYear = undefined
      } else {
        const year = Number(body.graduationYear)
        if (!Number.isInteger(year) || year < 2000 || year > 2100) {
          return res.status(400).json({ message: 'Enter a valid graduation year' })
        }
        user.graduationYear = year
      }
    }

    if (body.experienceLevel !== undefined) {
      if (!LEVELS.includes(body.experienceLevel)) {
        return res.status(400).json({ message: 'Invalid experience level' })
      }
      user.experienceLevel = body.experienceLevel
    }

    if (body.skills !== undefined) user.skills = cleanList(body.skills)
    if (body.careerInterests !== undefined) user.careerInterests = cleanList(body.careerInterests)

    await user.save()
    res.json(toUserResponse(user))
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}