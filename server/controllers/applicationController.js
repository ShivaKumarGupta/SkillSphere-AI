import mongoose from 'mongoose'
import Application, { STATUSES } from '../models/Application.js'

const DAY = 86400000
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/

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

const isHttpUrl = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const parseApplication = (body) => {
  const company = line(body.company, 100)
  if (!company) return { error: 'Company name is required' }

  const role = line(body.role, 100)
  if (!role) return { error: 'Job role is required' }

  const status = body.status || 'Applied'
  if (!STATUSES.includes(status)) return { error: 'Invalid status' }

  const dateText = line(body.applicationDate, 10)
  const ms = Date.parse(`${dateText}T00:00:00Z`)
  if (!DATE_KEY.test(dateText) || Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== dateText) {
    return { error: 'Please enter a valid application date' }
  }
  if (ms > Date.now() + DAY) return { error: 'The application date cannot be in the future' }

  let packageLpa = null
  if (body.packageLpa !== undefined && body.packageLpa !== null && body.packageLpa !== '') {
    const n = Number(body.packageLpa)
    if (!Number.isFinite(n) || n < 0 || n > 500) {
      return { error: 'Package must be a number between 0 and 500 (in LPA)' }
    }
    packageLpa = Math.round(n * 100) / 100
  }

  const jobUrl = line(body.jobUrl, 300)
  if (jobUrl && !isHttpUrl(jobUrl)) {
    return { error: 'Job link must start with http:// or https://' }
  }

  const rawInterviews = Array.isArray(body.interviews) ? body.interviews : []
  if (rawInterviews.length > 10) return { error: 'You can add up to 10 interviews' }

  const interviews = []
  for (const iv of rawInterviews) {
    const when = typeof iv?.date === 'string' ? iv.date : ''
    const time = Date.parse(when)
    if (!ISO_UTC.test(when) || Number.isNaN(time)) {
      return { error: 'Each interview needs a valid date and time' }
    }
    interviews.push({ round: line(iv.round, 60) || 'Interview', date: new Date(time) })
  }
  interviews.sort((a, b) => a.date - b.date)

  return {
    data: {
      company,
      role,
      status,
      applicationDate: new Date(ms),
      packageLpa,
      jobUrl,
      notes: block(body.notes, 1000),
      interviews,
    },
  }
}

export const getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .sort({ applicationDate: -1, createdAt: -1 })
      .limit(500)
    res.json(applications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createApplication = async (req, res) => {
  try {
    const { data, error } = parseApplication(req.body || {})
    if (error) return res.status(400).json({ message: error })

    const application = await Application.create({
      ...data,
      user: req.user._id,
      statusHistory: [{ status: data.status }],
    })
    res.status(201).json(application)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Application not found' })
    }

    const { data, error } = parseApplication(req.body || {})
    if (error) return res.status(400).json({ message: error })

    const application = await Application.findOne({ _id: req.params.id, user: req.user._id })
    if (!application) return res.status(404).json({ message: 'Application not found' })

    const statusChanged = application.status !== data.status
    application.set(data)
    if (statusChanged) application.statusHistory.push({ status: data.status })

    await application.save()
    res.json(application)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Quick stage change from the dropdown on a card
export const updateStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Application not found' })
    }

    const status = req.body?.status
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' })

    const application = await Application.findOne({ _id: req.params.id, user: req.user._id })
    if (!application) return res.status(404).json({ message: 'Application not found' })

    if (application.status !== status) {
      application.status = status
      application.statusHistory.push({ status })
      await application.save()
    }
    res.json(application)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Application not found' })
    }

    const application = await Application.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!application) return res.status(404).json({ message: 'Application not found' })

    res.json({ message: 'Application deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}