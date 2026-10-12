import InterviewSession from '../models/InterviewSession.js'
import { buildInterviewStats, INTERVIEW_STATS_FIELDS } from '../utils/interviewStats.js'

export const getInterviewAnalytics = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id, status: 'completed' })
      .select(INTERVIEW_STATS_FIELDS)
      .sort({ completedAt: -1 })
      .limit(100)
      .lean()

    res.json(buildInterviewStats(sessions))
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}