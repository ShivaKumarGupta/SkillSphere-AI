import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import certificateRoutes from './routes/certificateRoutes.js'
import dsaRoutes from './routes/dsaRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillSphere AI server is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/dsa', dsaRoutes)
app.use('/api/dashboard', dashboardRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})