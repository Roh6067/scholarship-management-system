import { Router } from 'express'
import { Notification } from '../models'
import { requireAuth, type AuthRequest } from '../middleware/auth'
const router = Router()
router.use(requireAuth)
router.get('/', async (req: AuthRequest, res, next) => { try { const items = await Notification.find({ user: req.user!._id }).sort({ createdAt: -1 }).limit(50); res.json({ items, unread: items.filter((item) => !item.read).length }) } catch (error) { next(error) } })
router.patch('/:id/read', async (req: AuthRequest, res, next) => { try { const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user!._id }, { read: true }, { new: true }); if (!item) return res.status(404).json({ message: 'Notification not found' }); res.json(item) } catch (error) { next(error) } })
export default router
