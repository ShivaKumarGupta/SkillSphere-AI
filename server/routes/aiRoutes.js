import express from 'express'
import { testAi } from '../controllers/aiController.js'
import { protect } from '../middleware/authMiddleware.js'
import { aiLimit } from '../middleware/aiLimit.js'

const router = express.Router()

router.use(protect)

router.post('/test', aiLimit, testAi)

export default router