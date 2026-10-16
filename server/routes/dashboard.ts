import { Router } from 'express'
import { Application, User, Scholarship } from '../models'
import { requireAuth, allowRoles } from '../middleware/auth'
const router = Router()
router.get('/stats', requireAuth, allowRoles('staff','officer','admin'), async (_req, res, next) => { try { const [students, applications, scholarships, byStatus] = await Promise.all([User.countDocuments({ role: 'student' }), Application.countDocuments(), Scholarship.countDocuments(), Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])]); res.json({ students, applications, scholarships, byStatus: Object.fromEntries(byStatus.map((row) => [row._id, row.count])) }) } catch (e) { next(e) } })
export default router
