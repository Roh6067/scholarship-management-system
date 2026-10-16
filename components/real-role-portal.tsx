'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, FileCheck2, GraduationCap, LogOut, ShieldCheck, Users } from 'lucide-react'
import { authApi, dashboardApi } from '@/lib/api'

type Role = 'student' | 'staff' | 'officer' | 'director' | 'admin'
type User = { id: string; name: string; email: string; role: Role; department?: string }

const roles: Role[] = ['student', 'staff', 'officer', 'director', 'admin']
const labels: Record<Role, string> = { student: 'Student', staff: 'Department Staff', officer: 'Scholarship Officer', director: 'Director', admin: 'Administrator' }
const descriptions: Record<Role, string> = {
  student: 'Apply for scholarships, manage documents, and track decisions.',
  staff: 'Verify applications assigned to your department and request corrections.',
  officer: 'Review verified applications and recommend approval or rejection.',
  director: 'Make final decisions and oversee scholarship operations.',
  admin: 'Manage users, scholarships, reports, and audit activity.',
}
const paths: Record<Role, string> = { student: '/student', staff: '/staff', officer: '/officer', director: '/admin', admin: '/admin' }

export default function RealRolePortal() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<Role>('student')
  const [form, setForm] = useState({ name: '', studentId: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [stats, setStats] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    authApi.me().then(({ data }) => {
      const nextUser = data.user as User
      setUser(nextUser)
      redirectForRole(nextUser.role)
    }).catch(() => undefined).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (user) dashboardApi.stats().then(({ data }) => setStats(data.stats ?? data)).catch(() => setStats(null))
  }, [user])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      if (mode === 'register') {
        const response = await authApi.register(form)
        setUser(response.data.user)
        redirectForRole(response.data.user.role)
        setNotice('Student account created successfully.')
      } else {
        const response = await authApi.login({ email: form.email, password: form.password, expectedRole: role })
        setUser(response.data.user)
        redirectForRole(response.data.user.role)
      }
    } catch (cause: any) {
      setError(cause.response?.data?.message ?? 'Unable to complete the request. Please try again.')
    }
  }

  function redirectForRole(nextRole: Role) {
    const path = paths[nextRole]
    if (typeof window !== 'undefined' && window.location.pathname !== path) window.history.replaceState({}, '', path)
  }

  async function signOut() {
    await authApi.logout().catch(() => undefined)
    setUser(null)
    setStats(null)
    if (typeof window !== 'undefined') window.history.replaceState({}, '', '/')
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc] text-[#123b68]"><div className="flex items-center gap-3 text-sm font-semibold"><span className="size-3 animate-pulse rounded-full bg-[#26808a]" />Restoring your secure session...</div></main>
  if (!user) return <Login mode={mode} role={role} setRole={setRole} setMode={setMode} form={form} setForm={setForm} error={error} notice={notice} submit={submit} />
  return <Portal user={user} stats={stats} signOut={signOut} />
}

function Login({ mode, role, setRole, setMode, form, setForm, error, notice, submit }: any) {
  return <main className="min-h-screen bg-[#f5f8fc] px-5 py-10 text-slate-900"><div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1fr_440px]"><section className="hidden lg:block"><Brand /><h1 className="mt-10 max-w-xl text-5xl font-bold leading-tight tracking-tight text-[#0f2d4f]">One secure place for every scholarship journey.</h1><p className="mt-5 max-w-lg text-lg leading-8 text-slate-500">A transparent workflow for students, staff, officers, directors, and administrators.</p><div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">{(['student', 'staff', 'officer', 'director', 'admin'] as Role[]).map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-bold text-[#123b68]">{labels[item]}</p><p className="mt-1 text-xs leading-5 text-slate-500">{descriptions[item]}</p></div>)}</div></section><section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-9"><div className="lg:hidden"><Brand /></div><p className="mt-8 text-sm font-semibold text-[#26808a]">{mode === 'login' ? 'Welcome back' : 'Student registration'}</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0f2d4f]">{mode === 'login' ? 'Sign in to your workspace' : 'Start your application journey'}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'login' ? 'Your selected role is checked against your secured account.' : 'Public registration creates student accounts only.'}</p>{error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}{notice && <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}<form onSubmit={submit} className="mt-6 flex flex-col gap-4">{mode === 'login' && <label className="text-sm font-semibold text-slate-700">Sign in as<select value={role} onChange={(event) => setRole(event.target.value as Role)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-[#26808a]">{roles.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>}{mode === 'register' && <><label className="text-sm font-semibold text-slate-700">Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label><label className="text-sm font-semibold text-slate-700">Student ID<input required value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label></>}<label className="text-sm font-semibold text-slate-700">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label><label className="text-sm font-semibold text-slate-700">Password<input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label><button className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#123b68] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#0f2d4f]">{mode === 'login' ? 'Sign in securely' : 'Create student account'}<ArrowRight className="size-4" /></button></form><button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="mt-5 w-full text-center text-sm font-semibold text-[#26808a]">{mode === 'login' ? 'Need a student account? Register' : 'Already registered? Sign in'}</button></section></div></main>
}

function Portal({ user, stats, signOut }: { user: User; stats: Record<string, number> | null; signOut: () => void }) {
  const actions = user.role === 'student' ? ['Browse scholarships', 'My applications', 'Profile & documents'] : user.role === 'staff' ? ['Department queue', 'Verify documents', 'Correction requests'] : user.role === 'officer' ? ['Officer review queue', 'Recommendations', 'Completed reviews'] : ['Final approvals', 'Scholarship management', 'Users & audit logs']
  const statEntries = stats ? Object.entries(stats).slice(0, 4) : [['pending', 0], ['inReview', 0], ['approved', 0], ['notifications', 0]]
  return <main className="min-h-screen bg-[#f5f8fc] text-slate-900"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-10"><Brand /><div className="flex items-center gap-4"><div className="hidden text-right sm:block"><p className="text-sm font-bold text-[#123b68]">{user.name}</p><p className="text-xs text-slate-500">{labels[user.role]}{user.department ? ` · ${user.department}` : ''}</p></div><button onClick={signOut} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><LogOut className="size-4" />Sign out</button></div></header><div className="mx-auto max-w-7xl px-5 py-10 sm:px-10"><p className="text-sm font-semibold text-[#26808a]">{labels[user.role]} workspace</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-[#0f2d4f]">{user.role === 'student' ? 'Your scholarship overview' : `${labels[user.role]} dashboard`}</h1><p className="mt-3 max-w-2xl text-slate-500">{descriptions[user.role]} Your permissions are enforced by the server for every action.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{statEntries.map(([key, value]) => <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm capitalize text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</p><p className="mt-3 text-3xl font-bold text-[#123b68]">{value}</p></div>)}</div><section className="mt-8 grid gap-4 md:grid-cols-3">{actions.map((action, index) => <div key={action} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="flex size-10 items-center justify-center rounded-xl bg-[#eaf1f8] text-[#123b68]">{index === 0 ? <FileCheck2 className="size-5" /> : index === 1 ? <ShieldCheck className="size-5" /> : user.role === 'admin' ? <Users className="size-5" /> : <CheckCircle2 className="size-5" />}</span><h2 className="mt-5 font-bold text-[#123b68]">{action}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Open the secure workflow for your role.</p></div>)}</section></div></main>
}

function Brand() { return <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-[#123b68] text-white"><GraduationCap className="size-6" /></div><div><p className="text-lg font-bold text-[#123b68]">ScholarFlow</p><p className="text-xs text-slate-400">Scholarship portal</p></div></div> }

export { labels }
export type { Role }
