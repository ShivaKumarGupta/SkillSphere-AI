import mongoose from 'mongoose'
import DsaProblem, { PLATFORMS, DIFFICULTIES, TOPICS } from '../models/DsaProblem.js'
import { buildDsaStats, parseTodayKey } from '../utils/dsaStats.js'

const DAY = 86400000
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

const keyToMs = (key) => Date.parse(`${key}T00:00:00Z`)
const msToKey = (ms) => new Date(ms).toISOString().slice(0, 10)
const text = (value) => (typeof value === 'string' ? value.trim() : '')

const isHttpUrl = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const parseProblem = (body) => {
  const title = text(body.title)
  if (!title) return { error: 'Problem title is required' }

  const platform = body.platform || 'LeetCode'
  if (!PLATFORMS.includes(platform)) return { error: 'Invalid platform' }
  if (!DIFFICULTIES.includes(body.difficulty)) return { error: 'Please choose a difficulty' }
  if (!TOPICS.includes(body.topic)) return { error: 'Please choose a topic' }

  const dateText = text(body.solvedDate)
  const ms = keyToMs(dateText)
  if (!DATE_KEY.test(dateText) || Number.isNaN(ms) || msToKey(ms) !== dateText) {
    return { error: 'Please enter a valid date' }
  }
  if (ms > Date.now() + DAY) return { error: 'Date cannot be in the future' }

  const link = text(body.link)
  if (link && !isHttpUrl(link)) {
    return { error: 'Link must start with http:// or https://' }
  }

  return {
    data: {
      title,
      platform,
      difficulty: body.difficulty,
      topic: body.topic,
      solvedDate: new Date(ms),
      link,
    },
  }
}

export const getProblems = async (req, res) => {
  try {
    const problems = await DsaProblem.find({ user: req.user._id })
      .sort({ solvedDate: -1, createdAt: -1 })
      .limit(500)
    res.json(problems)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createProblem = async (req, res) => {
  try {
    const { data, error } = parseProblem(req.body)
    if (error) return res.status(400).json({ message: error })

    const problem = await DsaProblem.create({ ...data, user: req.user._id })
    res.status(201).json(problem)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateProblem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Problem not found' })
    }

    const { data, error } = parseProblem(req.body)
    if (error) return res.status(400).json({ message: error })

    const problem = await DsaProblem.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      data,
      { new: true, runValidators: true }
    )

    if (!problem) return res.status(404).json({ message: 'Problem not found' })
    res.json(problem)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteProblem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Problem not found' })
    }

    const problem = await DsaProblem.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!problem) return res.status(404).json({ message: 'Problem not found' })
    res.json({ message: 'Problem deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getStats = async (req, res) => {
  try {
    const todayKey = parseTodayKey(req.query.today)

    const problems = await DsaProblem.find({ user: req.user._id })
      .select('solvedDate difficulty topic')
      .lean()

    res.json(buildDsaStats(problems, todayKey, req.user.dsaWeeklyGoal))
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateGoal = async (req, res) => {
  try {
    const goal = Number(req.body.weeklyGoal)
    if (!Number.isInteger(goal) || goal < 1 || goal > 200) {
      return res.status(400).json({ message: 'Weekly goal must be a whole number from 1 to 200' })
    }

    req.user.dsaWeeklyGoal = goal
    await req.user.save()
    res.json({ weeklyGoal: goal })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}