import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import { connectDatabase, databaseReady } from './lib/database'
import authRoutes from './routes/auth'
import scholarshipRoutes from './routes/scholarships'
import applicationRoutes from './routes/applications'
import dashboardRoutes from './routes/dashboard'
import profileRoutes from './routes/profile'
import notificationRoutes from './routes/notifications'
import adminRoutes from './routes/admin'
import documentRoutes from './routes/documents'
import { errorHandler } from './middleware/error'

const app = express()
const port = Number(process.env.PORT ?? 4000)
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }))

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/auth/login', authRateLimiter)
app.use('/api/auth/register', authRateLimiter)

app.get('/api/health', (_req, res) => res.status(databaseReady() ? 200 : 503).json({ ok: databaseReady(), service: 'scholarflow-api', database: databaseReady() ? 'connected' : 'disconnected' }))
app.use('/api/auth', authRoutes)
app.use('/api/scholarships', scholarshipRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/documents', documentRoutes)
app.use(errorHandler)

connectDatabase().then(() => app.listen(port, () => console.log(`[v0] API listening on ${port}`))).catch((error) => { console.error('[v0] Database connection failed', error); process.exit(1) })
