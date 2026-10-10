import express from 'express'
import { getResume, saveResume, autofillResume } from '../controllers/resumeController.js'
import {
  receivePdf,
  uploadResume,
  getUpload,
  deleteUpload,
} from '../controllers/resumeUploadController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getResume).put(saveResume)
router.post('/autofill', autofillResume)
router.route('/upload').get(getUpload).post(receivePdf, uploadResume).delete(deleteUpload)

export default router