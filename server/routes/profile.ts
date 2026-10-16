import { Router } from 'express'
import { StudentProfile } from '../models'
import { requireAuth, allowRoles, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth, allowRoles('student'))
router.get('/', async (req: AuthRequest, res, next) => { try { res.json(await StudentProfile.findOne({ user: req.user!._id }).populate('documents')) } catch (error) { next(error) } })
router.put('/', async (req: AuthRequest, res, next) => { try { const allowed = ['course', 'academicYear', 'semester', 'percentage', 'familyIncome', 'category', 'bankDetails']; const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key))); const profile = await StudentProfile.findOneAndUpdate({ user: req.user!._id }, { $set: data }, { new: true, upsert: true, runValidators: true }); res.json(profile) } catch (error) { next(error) } })
export default router
