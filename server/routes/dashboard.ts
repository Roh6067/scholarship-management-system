
import { Router } from 'express'
import { Application, User, Scholarship, AuditLog } from '../models'
import { requireAuth } from '../middleware/auth'

const router = Router()

function getLastSixMonths() {
  const months: { year: number; month: number; label: string }[] = []
  const now = new Date()

  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)

    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: date.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    })
  }

  return months
}

async function getMonthlyTrend(studentId?: unknown) {
  const months = getLastSixMonths()
  const firstMonth = months[0]

  const startDate = new Date(firstMonth.year, firstMonth.month - 1, 1)
  const nextMonth = new Date(
    months[months.length - 1].year,
    months[months.length - 1].month,
    1,
  )

  const match: Record<string, unknown> = {
    submittedAt: { $gte: startDate, $lt: nextMonth },
  }

  if (studentId) {
    match.student = studentId
  }

  const results = await Application.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$submittedAt' },
          month: { $month: '$submittedAt' },
        },
        count: { $sum: 1 },
      },
    },
  ])

  const counts = new Map(
    results.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item.count,
    ]),
  )

  return months.map((item) => ({
    month: item.label,
    applications: counts.get(`${item.year}-${item.month}`) ?? 0,
  }))
}


async function getRoleActivityTrend(role: string) {
  const months = getLastSixMonths()
  const firstMonth = months[0]

  const startDate = new Date(firstMonth.year, firstMonth.month - 1, 1)
  const nextMonth = new Date(
    months[months.length - 1].year,
    months[months.length - 1].month,
    1,
  )

  const roleActions: Record<string, string[]> = {
    staff: ['Under Department Verification', 'Correction Required'],
    officer: ['Under Officer Verification', 'Correction Required', 'Rejected'],
    director: ['Approved', 'Rejected'],
    admin: ['Approved', 'Rejected', 'Correction Required'],
  }

  const allowedStatuses = roleActions[role] ?? []

  const results = await Application.aggregate([
    { $unwind: '$verifications' },
    {
      $match: {
        'verifications.role': role,
        'verifications.status': { $in: allowedStatuses },
        'verifications.createdAt': { $gte: startDate, $lt: nextMonth },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$verifications.createdAt' },
          month: { $month: '$verifications.createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ])

  const counts = new Map(
    results.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item.count,
    ]),
  )

  return months.map((item) => ({
    month: item.label,
    applications: counts.get(`${item.year}-${item.month}`) ?? 0,
  }))
}


router.get('/stats', requireAuth, async (req: any, res, next) => {
  try {
    if (req.user.role === 'student') {
      const [applications, scholarships, byStatus, monthlyTrend] =
        await Promise.all([
          Application.find({ student: req.user._id }).select('status'),
          Scholarship.countDocuments({
            published: true,
            deadline: { $gte: new Date() },
          }),
          Application.aggregate([
            { $match: { student: req.user._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          getMonthlyTrend(req.user._id),
        ])

      const statusCounts = Object.fromEntries(
        byStatus.map((row) => [row._id, row.count]),
      ) as Record<string, number>
      const roleActivityTrend =
  req.user.role === 'admin'
    ? await getRoleActivityTrend('admin')
    : await getRoleActivityTrend(req.user.role)

      return res.json({
        scholarships,
        applications: applications.length,
        totalApplications: applications.length,
        drafts: statusCounts.Draft ?? 0,
        awaitingVerification:
          (statusCounts.Submitted ?? 0) +
          (statusCounts['Under Department Verification'] ?? 0) +
          (statusCounts['Under Officer Verification'] ?? 0),
        correctionRequired: statusCounts['Correction Required'] ?? 0,
        approved: statusCounts.Approved ?? 0,
        rejected: statusCounts.Rejected ?? 0,
        byStatus: statusCounts,
        monthlyTrend,
        roleActivityTrend,
      })
    }

    const [
      users,
      students,
      applications,
      scholarships,
      byStatus,
      monthlyTrend,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Application.countDocuments(),
      Scholarship.countDocuments({
        published: true,
        deadline: { $gte: new Date() },
      }),
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      getMonthlyTrend(),
    ])

    const statusCounts = Object.fromEntries(
      byStatus.map((row) => [row._id, row.count]),
    ) as Record<string, number>

    return res.json({
      users,
      students,
      applications,
      totalApplications: applications,
      scholarships,
      pending:
        (statusCounts.Submitted ?? 0) +
        (statusCounts['Under Department Verification'] ?? 0) +
        (statusCounts['Under Officer Verification'] ?? 0),
      inReview:
        (statusCounts['Under Department Verification'] ?? 0) +
        (statusCounts['Under Officer Verification'] ?? 0),
      approved: statusCounts.Approved ?? 0,
      rejected: statusCounts.Rejected ?? 0,
      correctionRequired: statusCounts['Correction Required'] ?? 0,
      byStatus: statusCounts,
      monthlyTrend,
      roleActivityTrend
    })
  } catch (error) {
    next(error)
  }
})

export default router
