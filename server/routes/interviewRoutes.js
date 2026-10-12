import express from 'express'
import {
  prepareStart,
  startInterview,
  getActiveInterview,
  saveAnswer,
  deleteInterview,
} from '../controllers/interviewController.js'
import { protect } from '../middleware/authMiddleware.js'
import { aiLimit } from '../middleware/aiLimit.js'

const router = express.Router()

router.use(protect)

router.post('/', prepareStart, aiLimit, startInterview)
router.get('/active', getActiveInterview)
router.patch('/:id/answer', saveAnswer)
router.delete('/:id', deleteInterview)

export default router