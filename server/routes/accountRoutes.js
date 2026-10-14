import express from 'express'
import { changePassword, deleteAccount } from '../controllers/accountController.js'
import { protect } from '../middleware/authMiddleware.js'
import { sensitiveLimiter } from '../middleware/rateLimiters.js'

const router = express.Router()

router.use(protect)

router.put('/password', sensitiveLimiter, changePassword)
router.delete('/', sensitiveLimiter, deleteAccount)

export default router