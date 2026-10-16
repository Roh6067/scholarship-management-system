import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { User, StudentProfile } from '../models'
import { requireAuth, type AuthRequest } from '../middleware/auth'
const router = Router()
const validate = (req: any, res: any, next: any) => { const errors = validationResult(req); return errors.isEmpty() ? next() : res.status(400).json({ message: errors.array()[0].msg }) }
router.post('/register', body('name').trim().notEmpty(), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 8 }), body('studentId').trim().notEmpty(), validate, async (req, res, next) => { try { const passwordHash = await bcrypt.hash(req.body.password, 12); const user = await User.create({ name: req.body.name, email: req.body.email, passwordHash, studentId: req.body.studentId }); await StudentProfile.create({ user: user._id }); res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }) } catch (e) { next(e) } })
router.post('/login', body('email').isEmail().normalizeEmail(), body('password').notEmpty(), validate, async (req, res, next) => { try { const user = await User.findOne({ email: req.body.email }); if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password' }); const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '7d' }); res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400000 }); res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }) } catch (e) { next(e) } })
router.post('/logout', (_req, res) => { res.clearCookie('token'); res.status(204).end() })
router.get('/me', requireAuth, (req: AuthRequest, res) => res.json({ user: req.user }))
export default router
