import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { Application, AuditLog, Scholarship, User } from '../models'
import { allowRoles, requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth, allowRoles('admin'))
const validate = (req: any, res: any, next: any) => { const result = validationResult(req); return result.isEmpty() ? next() : res.status(400).json({ message: result.array()[0].msg }) }
const safeUser = (user: any) => ({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, studentId: user.studentId })
const audit = (req: AuthRequest, action: string, entity: string, entityId?: string) => AuditLog.create({ actor: req.user?._id, action, entity, entityId }).catch(() => undefined)

router.get('/scholarships', async (_req, res, next) => { try { res.json(await Scholarship.find().sort({ createdAt: -1 })) } catch (e) { next(e) } })
router.post('/scholarships', body('name').trim().notEmpty(), body('provider').trim().notEmpty(), body('amount').isFloat({ min: 0 }), body('deadline').isISO8601(), validate, async (req: AuthRequest, res, next) => { try { const item = await Scholarship.create(req.body); await audit(req, 'created', 'scholarship', item.id); res.status(201).json(item) } catch (e) { next(e) } })
router.patch('/scholarships/:id', async (req: AuthRequest, res, next) => { try { const item = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!item) return res.status(404).json({ message: 'Scholarship not found' }); await audit(req, 'updated', 'scholarship', item.id); res.json(item) } catch (e) { next(e) } })
router.delete('/scholarships/:id', async (req: AuthRequest, res, next) => { try { const item = await Scholarship.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ message: 'Scholarship not found' }); await audit(req, 'deleted', 'scholarship', String(req.params.id)); res.status(204).end() } catch (e) { next(e) } })
router.get('/users', async (_req, res, next) => { try { res.json((await User.find().select('-passwordHash').sort({ createdAt: -1 })).map(safeUser)) } catch (e) { next(e) } })
router.post('/users', body('name').trim().notEmpty(), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 8 }), body('role').isIn(['staff', 'officer', 'director']), validate, async (req: AuthRequest, res, next) => { try { const passwordHash = await bcrypt.hash(req.body.password, 12); const user = await User.create({ name: req.body.name, email: req.body.email, passwordHash, role: req.body.role, department: req.body.department }); await audit(req, 'created', 'user', user.id); res.status(201).json({ user: safeUser(user) }) } catch (e) { next(e) } })
router.get('/applications', async (_req, res, next) => { try { res.json(await Application.find().populate('student', 'name email studentId').populate('scholarship', 'name provider amount').sort({ createdAt: -1 })) } catch (e) { next(e) } })
router.get('/audit', async (_req, res, next) => { try { res.json(await AuditLog.find().populate('actor', 'name email role').sort({ createdAt: -1 }).limit(100)) } catch (e) { next(e) } })
export default router
