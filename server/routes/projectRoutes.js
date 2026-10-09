import express from 'express'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getProjects).post(createProject)
router.route('/:id').put(updateProject).delete(deleteProject)

export default router