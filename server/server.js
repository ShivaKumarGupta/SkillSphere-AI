import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import { checkEnv } from './config/checkEnv.js'
import {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  publicLimiter,
} from './middleware/rateLimiters.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import certificateRoutes from './routes/certificateRoutes.js'
import dsaRoutes from './routes/dsaRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import roadmapRoutes from './routes/roadmapRoutes.js'
import assistantRoutes from './routes/assistantRoutes.js'
import interviewRoutes from './routes/interviewRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import portfolioRoutes from './routes/portfolioRoutes.js'
import fileRoutes from './routes/fileRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import accountRoutes from './routes/accountRoutes.js'
import { getPublicPortfolio } from './controllers/portfolioController.js'
import { getPublicFile } from './controllers/fileController.js'

dotenv.config()
checkEnv()
connectDB()

const app = express()

// Behind a hosting proxy (such as Render) this makes rate limits see the real visitor address
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY))

// This server only returns JSON and files, never web pages, so page-level CSP is left to the frontend host
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
app.use(cors({ origin: allowedOrigins }))

app.use('/api', apiLimiter)
app.use(express.json({ limit: '200kb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillSphere AI server is running' })
})

app.use('/api/auth/login', loginLimiter)
app.use('/api/auth/register', registerLimiter)
app.use('/api/public', publicLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/dsa', dsaRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/roadmap', roadmapRoutes)
app.use('/api/assistant', assistantRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/account', accountRoutes)

// The only routes that work without logging in
app.get('/api/public/portfolio/:slug', getPublicPortfolio)
app.get('/api/public/portfolio/:slug/files/:id', getPublicFile)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})