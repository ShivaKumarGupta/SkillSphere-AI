import express from 'express'
import {
  getChat,
  prepareMessage,
  sendMessage,
  clearChat,
} from '../controllers/assistantController.js'
import { protect } from '../middleware/authMiddleware.js'
import { aiLimit } from '../middleware/aiLimit.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getChat).delete(clearChat)
router.post('/message', prepareMessage, aiLimit, sendMessage)

export default router