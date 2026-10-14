import User from '../models/User.js'
import Project from '../models/Project.js'
import Certificate from '../models/Certificate.js'
import DsaProblem from '../models/DsaProblem.js'
import Resume from '../models/Resume.js'
import UploadedResume from '../models/UploadedResume.js'
import ResumeAnalysis from '../models/ResumeAnalysis.js'
import Roadmap from '../models/Roadmap.js'
import Conversation from '../models/Conversation.js'
import InterviewSession from '../models/InterviewSession.js'
import Application from '../models/Application.js'
import Portfolio from '../models/Portfolio.js'
import File from '../models/File.js'
import generateToken from '../utils/generateToken.js'

const MIN_PASSWORD = 8

// Every collection that stores a student's data. A new collection with a "user" field must be added here.
const USER_DATA = [
  Project,
  Certificate,
  DsaProblem,
  Resume,
  UploadedResume,
  ResumeAnalysis,
  Roadmap,
  Conversation,
  InterviewSession,
  Application,
  Portfolio,
  File,
]

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please fill in both password fields' })
    }
    if (newPassword.length < MIN_PASSWORD) {
      return res.status(400).json({ message: `The new password must be at least ${MIN_PASSWORD} characters` })
    }
    // bcrypt only uses the first 72 bytes of a password
    if (Buffer.byteLength(newPassword) > 72) {
      return res.status(400).json({ message: 'The new password is too long (72 characters at most)' })
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'The new password must be different from the current one' })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Your current password is incorrect' })
    }

    user.password = newPassword
    user.passwordChangedAt = new Date()
    await user.save()

    // Older tokens stop working. This new one keeps the current session signed in.
    res.json({ message: 'Password updated', token: generateToken(user._id) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body || {}
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Please enter your password to confirm' })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ message: 'Your password is incorrect' })
    }

    // The data goes first and the user record last, so a failure midway can simply be retried
    await Promise.all(USER_DATA.map((Model) => Model.deleteMany({ user: user._id })))
    await User.deleteOne({ _id: user._id })

    res.json({ message: 'Your account and all your data have been deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}