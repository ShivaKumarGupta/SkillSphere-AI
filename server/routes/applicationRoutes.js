import express from 'express'
import {
  getApplications,
  createApplication,
  updateApplication,
  updateStatus,
  deleteApplication,
} from '../controllers/applicationController.js'
import { getApplicationAnalytics } from '../controllers/applicationAnalyticsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getApplications).post(createApplication)
router.get('/analytics', getApplicationAnalytics)
router.route('/:id').put(updateApplication).delete(deleteApplication)
router.patch('/:id/status', updateStatus)

export default router