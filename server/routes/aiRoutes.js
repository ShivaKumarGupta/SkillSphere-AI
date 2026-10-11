import express from 'express'
import { testAi } from '../controllers/aiController.js'
import {
  getAnalysis,
  prepareAnalysisInput,
  analyzeResume,
} from '../controllers/resumeAnalysisController.js'
import { protect } from '../middleware/authMiddleware.js'
import { aiLimit } from '../middleware/aiLimit.js'

const router = express.Router()

router.use(protect)

router.post('/test', aiLimit, testAi)
router
  .route('/resume-analysis')
  .get(getAnalysis)
  .post(prepareAnalysisInput, aiLimit, analyzeResume)

export default router