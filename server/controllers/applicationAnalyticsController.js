import Application from '../models/Application.js'
import { buildApplicationStats, APPLICATION_STATS_FIELDS } from '../utils/applicationStats.js'
import { parseTodayKey } from '../utils/dsaStats.js'

export const getApplicationAnalytics = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .select(APPLICATION_STATS_FIELDS)
      .limit(500)
      .lean()

    res.json(buildApplicationStats(applications, parseTodayKey(req.query.today)))
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}