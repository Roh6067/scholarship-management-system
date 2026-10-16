'use client'

import { FormEvent, useEffect, useState } from 'react'
import { GraduationCap, LockKeyhole, Mail, ShieldCheck, Users, ArrowRight, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api'
import ScholarshipDashboard from './scholarship-dashboard'

type Role = 'student' | 'staff' | 'director'
type UserRole = Role | 'officer' | 'admin'
type User = { id: string; name: string; email: string; role: UserRole }

const roleDetails: Record<Role, { label: string; description: string; icon: typeof GraduationCap }> = {
  student: { label: 'Student', description: 'Find scholarships and track applications', icon: GraduationCap },
  staff: { label: 'Staff', description: 'Review applications and verify documents', icon: Users },
  director: { label: 'Director', description: 'Approve awards and oversee the portal', icon: ShieldCheck },
}

export default function RoleLogin() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    authApi.me().then(({ data }) => setUser(data.user)).catch(() => undefined).finally(() => setChecking(false))
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login({ email, password })
      const loggedInUser = data.user as User
      const authenticatedRole: Role = loggedInUser.role === 'admin' || loggedInUser.role === 'officer' ? 'director' : loggedInUser.role
      if (authenticatedRole !== role) {
        setError(`This account is registered as ${roleDetails[authenticatedRole].label}. Select that role to continue.`)
        return
      }
      setUser(loggedInUser)
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Unable to connect to the scholarship portal.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-sm text-slate-500">Checking your session...</div>
  if (user?.role === 'student') return <ScholarshipDashboard />
  if (user) return <RoleWorkspace user={user} />

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_460px]">
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-[#123b68] text-white"><GraduationCap className="size-6" /></div><div><p className="text-lg font-bold text-[#123b68]">ScholarFlow</p><p className="text-xs text-slate-400">Scholarship portal</p></div></div>
          <p className="max-w-xl text-5xl font-bold leading-tight tracking-tight text-slate-900">One secure place for every scholarship journey.</p>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">Connect students, staff, and directors with a clear, accountable application workflow.</p>
          <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3">{Object.entries(roleDetails).map(([key, detail]) => { const Icon = detail.icon; return <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4"><Icon className="size-5 text-[#236885]" /><p className="mt-4 text-sm font-bold">{detail.label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail.description}</p></div> })}</div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-9">
          <div className="mb-8 lg:hidden"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#123b68] text-white"><GraduationCap className="size-5" /></div><div><p className="font-bold text-[#123b68]">ScholarFlow</p><p className="text-xs text-slate-400">Scholarship portal</p></div></div></div>
          <p className="text-sm font-semibold text-[#26808a]">Welcome back</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Sign in to your workspace</h1><p className="mt-2 text-sm leading-6 text-slate-500">Use your institutional account to continue.</p>
          <div className="mt-7 grid grid-cols-3 gap-2">{(Object.keys(roleDetails) as Role[]).map((item) => { const Icon = roleDetails[item].icon; return <button type="button" key={item} onClick={() => setRole(item)} className={`rounded-xl border px-2 py-3 text-center transition ${role === item ? 'border-[#123b68] bg-[#eaf1f8] text-[#123b68]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Icon className="mx-auto size-4" /><span className="mt-1 block text-xs font-semibold">{roleDetails[item].label}</span></button> })}</div>
          <form className="mt-7 flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Email address<div className="relative"><Mail className="absolute left-3 top-3 size-4 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@institution.edu" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#123b68] focus:ring-2 focus:ring-blue-100" /></div></label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Password<div className="relative"><LockKeyhole className="absolute left-3 top-3 size-4 text-slate-400" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#123b68] focus:ring-2 focus:ring-blue-100" /></div></label>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
            <button disabled={loading} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#123b68] text-sm font-bold text-white transition hover:bg-[#0d2d50] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <Loader2 className="size-4 animate-spin" /> : <>Continue as {roleDetails[role].label}<ArrowRight className="size-4" /></>}</button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">Access is managed by your institution. Contact the portal administrator if you need an account.</p>
        </section>
      </div>
    </main>
  )
}

function RoleWorkspace({ user }: { user: User }) {
  const isDirector = user.role === 'director' || (user.role as string) === 'admin' || (user.role as string) === 'officer'
  return <main className="min-h-screen bg-[#f6f8fb] text-slate-900"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 sm:px-10"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#123b68] text-white"><GraduationCap className="size-5" /></div><div><p className="font-bold text-[#123b68]">ScholarFlow</p><p className="text-xs text-slate-400">{isDirector ? 'Director workspace' : 'Staff workspace'}</p></div></div><button onClick={() => authApi.logout().then(() => window.location.reload())} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Sign out</button></header><div className="mx-auto max-w-6xl px-6 py-10 sm:px-10"><p className="text-sm font-semibold text-[#26808a]">Good morning, {user.name}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{isDirector ? 'Director overview' : 'Staff review queue'}</h1><p className="mt-2 text-sm text-slate-500">{isDirector ? 'Monitor scholarship decisions, approvals, and institution-wide progress.' : 'Review student applications and verify supporting documents.'}</p><div className="mt-8 grid gap-4 sm:grid-cols-3"><WorkspaceCard label="Pending applications" value={isDirector ? '24' : '18'} /><WorkspaceCard label="Documents to verify" value={isDirector ? '9' : '12'} /><WorkspaceCard label={isDirector ? 'Awards approved' : 'Reviewed this week'} value={isDirector ? '₹4.8L' : '37'} /></div><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">{isDirector ? 'Approval center' : 'Review queue'}</h2><p className="mt-1 text-sm text-slate-500">Role-based access is active for this workspace.</p></div><ShieldCheck className="size-6 text-[#26808a]" /></div><div className="mt-6 rounded-xl bg-[#edf9fa] p-4 text-sm text-[#216a73]">You are signed in as <strong>{isDirector ? 'Director' : 'Staff'}</strong>. Protected actions are limited to your role.</div></div></div></main>
}
function WorkspaceCard({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-[#123b68]">{value}</p></div> }

export { roleDetails }
