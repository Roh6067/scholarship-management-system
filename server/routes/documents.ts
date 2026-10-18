import { Router } from 'express'
import multer from 'multer'
import { Document, Application, StudentProfile } from '../models'
import { allowRoles, requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()

/**
 * Upload limits and allowed MIME types.
 * Files are stored as Buffer in MongoDB (content field, select: false).
 * diskStorage is intentionally NOT used here:
 *   - The deployment uses MongoDB Atlas; there is no guaranteed persistent
 *     writable filesystem on the server host.
 *   - Existing documents are already stored as MongoDB Buffers.
 *   - Switching to diskStorage would break the current serve-from-DB flow
 *     and require a non-trivial data migration.
 *
 * Memory reduction is achieved by:
 *   1. Rejecting oversized/wrong-type files at the busboy layer (fileFilter +
 *      limits.fileSize) before the buffer is fully read.
 *   2. Nullifying req.file.buffer after it has been written to MongoDB so the
 *      GC can reclaim the heap allocation without waiting for the request to
 *      fully close.
 *   3. Serving file content via res.end() (single write, no extra copy)
 *      rather than res.send() which may clone the buffer.
 *
 * If the deployment is ever migrated to a VPS with a guaranteed writable
 * persistent volume, switch multer to diskStorage and update the Document
 * schema to store a `filePath` string instead of `content: Buffer`.
 */
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIMES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const allowedTypes = new Set([
  'marksheet',
  'income-certificate',
  'category-certificate',
  'domicile-certificate',
  'identity',
  'bank-proof',
  'other',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SIZE,
    files: 1,
    // Cap total field size to 1 KB (type name + form text) to prevent
    // memory exhaustion from large non-file fields.
    fieldSize: 1024,
    fields: 5,
  },
  fileFilter: (_req, file, callback) => {
    // Reject at the busboy layer — stops reading after the header is parsed,
    // before the body is buffered into memory.
    callback(null, ALLOWED_MIMES.has(file.mimetype))
  },
})

router.use(requireAuth, allowRoles('student', 'staff', 'officer', 'director', 'admin'))

// ─── GET /documents ──────────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const filter =
      req.user!.role === 'student'
        ? { owner: req.user!._id }
        : req.query.owner
          ? { owner: String(req.query.owner) }
          : {}
    res.json(await Document.find(filter).select('-content').sort({ createdAt: -1 }))
  } catch (error) {
    next(error)
  }
})

// ─── POST /documents ──────────────────────────────────────────────────────────
router.post(
  '/',
  allowRoles('student'),
  upload.single('file'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Upload a PDF, JPG, or PNG file under 10 MB.' })
      }

      const type = String(req.body.type ?? 'other')
      if (!allowedTypes.has(type)) {
        return res.status(400).json({ message: 'Choose a valid document type.' })
      }

      // Magic-byte validation — detect content-type spoofing.
      // We read from the already-buffered req.file.buffer (unavoidable with
      // memoryStorage) but we do not copy it.
      const bytes = req.file.buffer
      const isPdf = bytes.subarray(0, 5).toString() === '%PDF-'
      const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      const isJpeg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))

      if (
        (req.file.mimetype === 'application/pdf' && !isPdf) ||
        (req.file.mimetype === 'image/png' && !isPng) ||
        (req.file.mimetype === 'image/jpeg' && !isJpeg)
      ) {
        return res
          .status(400)
          .json({ message: 'The file contents do not match the selected file type.' })
      }

      const document = await Document.create({
        owner: req.user!._id,
        type,
        originalName: req.file.originalname.slice(0, 180),
        storedName: `${req.user!._id}-${Date.now()}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        content: req.file.buffer,
      })

      // Nullify the buffer reference immediately after writing to MongoDB.
      // This allows the GC to reclaim the heap allocation without waiting for
      // the request object to be garbage-collected.
      ;(req.file as any).buffer = null

      res.status(201).json(await Document.findById(document._id).select('-content'))
    } catch (error) {
      next(error)
    }
  },
)

// ─── GET /documents/:id/content ───────────────────────────────────────────────
router.get('/:id/content', async (req: AuthRequest, res, next) => {
  try {
    const document = await Document.findById(req.params.id).select('+content')
    if (!document) return res.status(404).json({ message: 'Document not found' })

    if (
      !['staff', 'officer', 'director', 'admin'].includes(req.user!.role) &&
      String(document.owner) !== String(req.user!._id)
    ) {
      return res.status(403).json({ message: 'You cannot access this document.' })
    }

    const safeFilename = String(document.originalName ?? 'document').replace(/["'\r\n\\]/g, '')
    res.setHeader('Content-Type', document.mimeType ?? 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`)
    res.setHeader('Content-Length', String((document.content as Buffer).length))
    res.setHeader('Cache-Control', 'private, max-age=300')

    // Use res.end() (single socket write) rather than res.send() to avoid
    // any intermediate buffer copy inside Express's send pipeline.
    res.end(document.content as Buffer)
  } catch (error) {
    next(error)
  }
})

// ─── DELETE /documents/:id ────────────────────────────────────────────────────
router.delete('/:id', allowRoles('student'), async (req: AuthRequest, res, next) => {
  try {
    const documentId = req.params.id

    // 1. Verify document existence
    const document = await Document.findById(documentId).select('_id owner originalName')
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' })
    }

    // 2. Verify document ownership
    if (String(document.owner) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'You are not authorized to delete this document.' })
    }

    // 3. Prevent deletion if linked to an application with a retention status
    const RETAINED_STATUSES = [
      'Submitted',
      'Under Department Verification',
      'Under Officer Verification',
      'Approved',
    ]

    const activeApplication = await Application.findOne({
      documents: document._id,
      status: { $in: RETAINED_STATUSES },
    }).select('_id applicationNumber status')

    if (activeApplication) {
      return res.status(409).json({
        message: `This document cannot be deleted because it is linked to application ${activeApplication.applicationNumber || activeApplication._id} which is currently in '${activeApplication.status}' status.`,
        applicationNumber: activeApplication.applicationNumber,
        status: activeApplication.status,
      })
    }

    // 4. Safe deletion — double-checks ownership atomically to prevent TOCTOU
    const deleted = await Document.findOneAndDelete({
      _id: document._id,
      owner: req.user!._id,
    })

    if (!deleted) {
      return res.status(404).json({ message: 'Document not found.' })
    }

    // 5. Remove references from non-retained applications (Draft, Correction Required)
    //    and student profile — best-effort, fire-and-forget in parallel.
    await Promise.all([
      Application.updateMany(
        {
          student: req.user!._id,
          documents: document._id,
          status: { $in: ['Draft', 'Correction Required'] },
        },
        { $pull: { documents: document._id } },
      ),
      StudentProfile.updateOne(
        { user: req.user!._id, documents: document._id },
        { $pull: { documents: document._id } },
      ),
    ])

    return res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
