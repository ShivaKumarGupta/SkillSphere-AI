import express from 'express'
import {
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  getStats,
  updateGoal,
} from '../controllers/dsaController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.route('/problems').get(getProblems).post(createProblem)
router.route('/problems/:id').put(updateProblem).delete(deleteProblem)
router.get('/stats', getStats)
router.put('/goal', updateGoal)

export default router