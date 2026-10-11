import express from 'express'
import {
  getRoadmap,
  prepareRoadmapInput,
  generateRoadmap,
  updateMilestone,
} from '../controllers/roadmapController.js'
import { protect } from '../middleware/authMiddleware.js'
import { aiLimit } from '../middleware/aiLimit.js'

const router = express.Router()

router.use(protect)

router.get('/', getRoadmap)
router.post('/generate', prepareRoadmapInput, aiLimit, generateRoadmap)
router.patch('/milestones/:id', updateMilestone)

export default router