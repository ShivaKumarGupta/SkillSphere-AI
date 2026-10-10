import express from 'express'
import { getResume, saveResume, autofillResume } from '../controllers/resumeController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getResume).put(saveResume)
router.post('/autofill', autofillResume)

export default router