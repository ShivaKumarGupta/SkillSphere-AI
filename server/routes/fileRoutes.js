import express from 'express'
import {
  receiveFile,
  listFiles,
  uploadProjectFile,
  uploadCertificateFile,
  getFile,
  deleteFile,
} from '../controllers/fileController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/', listFiles)
router.post('/projects/:projectId', receiveFile, uploadProjectFile)
router.post('/certificates/:certificateId', receiveFile, uploadCertificateFile)
router.get('/:id', getFile)
router.delete('/:id', deleteFile)

export default router