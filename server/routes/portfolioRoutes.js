import express from 'express'
import { getMyPortfolio, saveMyPortfolio } from '../controllers/portfolioController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getMyPortfolio).put(saveMyPortfolio)

export default router