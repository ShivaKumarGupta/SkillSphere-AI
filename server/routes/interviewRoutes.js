import express from 'express'
import {
  prepareStart,
  startInterview,
  getActiveInterview,
  saveAnswer,
  deleteInterview,
  prepareComplete,
  completeInterview,
  listInterviews,
  getInterview,
} from '../controllers/interviewController.js'
import { getInterviewAnalytics } from '../controllers/interviewAnalyticsController.js'
import { protect } from '../middleware/authMiddleware.js'
import { aiLimit } from '../middleware/aiLimit.js'

const router = express.Router()

router.use(protect)

router.post('/', prepareStart, aiLimit, startInterview)
router.get('/', listInterviews)
router.get('/active', getActiveInterview)
router.get('/analytics', getInterviewAnalytics)
router.get('/:id', getInterview)
router.post('/:id/complete', prepareComplete, aiLimit, completeInterview)
router.patch('/:id/answer', saveAnswer)
router.delete('/:id', deleteInterview)

export default router