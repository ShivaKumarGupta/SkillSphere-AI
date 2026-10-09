import express from 'express'
import {
  getCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from '../controllers/certificateController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getCertificates).post(createCertificate)
router.route('/:id').put(updateCertificate).delete(deleteCertificate)

export default router