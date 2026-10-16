import { Router } from 'express'
import { Scholarship } from '../models'
import { requireAuth, allowRoles } from '../middleware/auth'
const router = Router()
router.get('/', async (req, res, next) => { try { const query: any = { published: true, deadline: { $gte: new Date() } }; if (req.query.search) query.$or = [{ name: new RegExp(String(req.query.search), 'i') }, { provider: new RegExp(String(req.query.search), 'i') }]; res.json(await Scholarship.find(query).sort({ deadline: 1 })) } catch (e) { next(e) } })
router.get('/:id', async (req, res, next) => { try { const item = await Scholarship.findOne({ _id: req.params.id, published: true }); if (!item) return res.status(404).json({ message: 'Scholarship not found' }); res.json(item) } catch (e) { next(e) } })
router.post('/', requireAuth, allowRoles('admin'), async (req, res, next) => { try { res.status(201).json(await Scholarship.create(req.body)) } catch (e) { next(e) } })
router.patch('/:id', requireAuth, allowRoles('admin'), async (req, res, next) => { try { res.json(await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })) } catch (e) { next(e) } })
export default router
