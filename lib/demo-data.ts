export type DemoRole = 'student' | 'staff' | 'director'
export type ApplicationStatus = 'Pending' | 'Under Review' | 'Verified' | 'Approved' | 'Correction Required' | 'Rejected'

export type DemoUser = { id: string; name: string; email: string; password: string; role: DemoRole; department: string }
export type DemoApplication = { id: string; student: string; scholarship: string; department: string; amount: number; submitted: string; status: ApplicationStatus; remarks?: string }

export const demoUsers: DemoUser[] = [
  { id: 'STU-1042', name: 'Aarav Sharma', email: 'student@scholarship.demo', password: 'Student@123', role: 'student', department: 'Computer Science' },
  { id: 'STF-018', name: 'Priya Nair', email: 'staff@scholarship.demo', password: 'Staff@123', role: 'staff', department: 'Student Welfare' },
  { id: 'DIR-001', name: 'Dr. Meera Iyer', email: 'director@scholarship.demo', password: 'Director@123', role: 'director', department: 'Academic Affairs' },
]

export const scholarships = [
  { name: 'National Merit Scholarship', provider: 'Ministry of Education', amount: 50000, deadline: '30 Nov 2026', applicants: 128 },
  { name: 'AICTE Pragati Scholarship', provider: 'AICTE', amount: 50000, deadline: '15 Dec 2026', applicants: 86 },
  { name: 'Azim Premji Foundation Award', provider: 'APF', amount: 75000, deadline: '20 Jan 2027', applicants: 54 },
]

export const initialApplications: DemoApplication[] = [
  { id: 'APP-2026-1042', student: 'Aarav Sharma', scholarship: 'National Merit Scholarship', department: 'Computer Science', amount: 50000, submitted: '12 Oct 2026', status: 'Under Review' },
  { id: 'APP-2026-1036', student: 'Ishita Rao', scholarship: 'AICTE Pragati Scholarship', department: 'Electronics', amount: 50000, submitted: '10 Oct 2026', status: 'Verified' },
  { id: 'APP-2026-1029', student: 'Rohan Das', scholarship: 'National Merit Scholarship', department: 'Mechanical Engineering', amount: 50000, submitted: '08 Oct 2026', status: 'Correction Required', remarks: 'Please upload the latest income certificate.' },
  { id: 'APP-2026-1017', student: 'Nisha Patel', scholarship: 'Azim Premji Foundation Award', department: 'Computer Science', amount: 75000, submitted: '03 Oct 2026', status: 'Approved' },
]

export const notifications = ['Income certificate deadline is approaching on 30 Nov 2026.', 'Your application APP-2026-1042 is now under review.', 'New scholarship opportunity: Azim Premji Foundation Award.']

export const analyticsData = {
  monthly: [{ month: 'Jun', applications: 32 }, { month: 'Jul', applications: 48 }, { month: 'Aug', applications: 41 }, { month: 'Sep', applications: 67 }, { month: 'Oct', applications: 82 }],
  status: [{ name: 'Pending', value: 24 }, { name: 'Under Review', value: 18 }, { name: 'Verified', value: 12 }, { name: 'Approved', value: 37 }, { name: 'Correction', value: 9 }],
  departments: [{ name: 'Computer Science', value: 42 }, { name: 'Electronics', value: 28 }, { name: 'Mechanical', value: 19 }, { name: 'Civil', value: 14 }],
}

export const formatINR = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

export function getDemoUser(email: string, password: string, role: DemoRole) {
  return demoUsers.find((user) => user.email === email && user.password === password && user.role === role) ?? null
}

export function getStoredApplications() {
  if (typeof window === 'undefined') return initialApplications
  try { return JSON.parse(sessionStorage.getItem('scholarship-demo-applications') ?? 'null') ?? initialApplications } catch { return initialApplications }
}

export function saveStoredApplications(applications: DemoApplication[]) {
  sessionStorage.setItem('scholarship-demo-applications', JSON.stringify(applications))
}

export function clearDemoSession() {
  sessionStorage.removeItem('scholarship-demo-user')
  sessionStorage.removeItem('scholarship-demo-applications')
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(sessionStorage.getItem('scholarship-demo-user') ?? 'null') as DemoUser | null } catch { return null }
}

export function saveDemoUser(user: DemoUser) { sessionStorage.setItem('scholarship-demo-user', JSON.stringify(user)) }
export function isDemoEnabled() { return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true' }

export function statusTone(status: ApplicationStatus) {
  return status === 'Approved' || status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : status === 'Rejected' ? 'bg-rose-50 text-rose-700' : status === 'Correction Required' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
}

export function rolePath(role: DemoRole) { return `/${role}/dashboard` }

export function isAuthorizedPath(role: DemoRole, path: string) { return path.startsWith(`/${role}/`) || path === `/${role}` }

export const roleLabels: Record<DemoRole, string> = { student: 'Student', staff: 'Staff', director: 'Director' }

