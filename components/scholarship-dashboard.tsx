'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'

type Status = 'Approved' | 'Under review' | 'Correction required' | 'Draft'

type Application = {
  id: string
  title: string
  organization: string
  submitted: string
  deadline: string
  status: Status
  amount: string
  initials: string
  tone: string
}

const applications: Application[] = [
  { id: 'APP-2026-0184', title: 'Merit Excellence Scholarship', organization: 'National Education Trust', submitted: '12 Oct 2026', deadline: '31 Oct 2026', status: 'Under review', amount: '₹50,000', initials: 'ME', tone: 'bg-blue-100 text-blue-700' },
  { id: 'APP-2026-0167', title: 'STEM Women Fellowship', organization: 'Future Foundation', submitted: '08 Oct 2026', deadline: '25 Oct 2026', status: 'Approved', amount: '₹75,000', initials: 'SW', tone: 'bg-emerald-100 text-emerald-700' },
  { id: 'APP-2026-0142', title: 'State Higher Education Grant', organization: 'Department of Education', submitted: '02 Oct 2026', deadline: '20 Oct 2026', status: 'Correction required', amount: '₹35,000', initials: 'SH', tone: 'bg-amber-100 text-amber-700' },
]

const scholarships = [
  { name: 'Merit Excellence Scholarship', provider: 'National Education Trust', amount: '₹50,000', deadline: '31 Oct 2026', tag: 'Engineering', color: 'bg-sky-50 text-sky-700' },
  { name: 'STEM Women Fellowship', provider: 'Future Foundation', amount: '₹75,000', deadline: '25 Oct 2026', tag: 'Women in STEM', color: 'bg-violet-50 text-violet-700' },
  { name: 'State Higher Education Grant', provider: 'Department of Education', amount: '₹35,000', deadline: '20 Oct 2026', tag: 'All courses', color: 'bg-amber-50 text-amber-700' },
]

function StatusPill({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    'Under review': 'bg-blue-50 text-blue-700 ring-blue-200',
    'Correction required': 'bg-amber-50 text-amber-700 ring-amber-200',
    Draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}><span className="size-1.5 rounded-full bg-current" />{status}</span>
}

export default function ScholarshipDashboard() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('All applications')

  const filteredApplications = useMemo(() => applications.filter((application) => {
    const matchesQuery = `${application.title} ${application.organization} ${application.id}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = selectedFilter === 'All applications' || application.status === selectedFilter
    return matchesQuery && matchesFilter
  }), [query, selectedFilter])

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Scholarships', icon: CircleDollarSign },
    { label: 'My applications', icon: FileText },
    { label: 'Documents', icon: FileCheck2 },
    { label: 'Profile', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#123b68] text-white shadow-sm"><GraduationCap className="size-5" /></div>
          <div><p className="text-[15px] font-bold tracking-tight text-[#123b68]">ScholarFlow</p><p className="text-[11px] text-slate-400">Scholarship portal</p></div>
          <button className="ml-auto rounded-lg p-1 text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="size-5" /></button>
        </div>
        <div className="mt-10 flex flex-1 flex-col">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <nav className="mt-3 flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActiveNav(label); setMobileOpen(false) }} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${activeNav === label ? 'bg-[#eaf1f8] text-[#123b68]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><Icon className="size-[18px]" />{label}{label === 'My applications' && <span className="ml-auto rounded-full bg-[#123b68] px-2 py-0.5 text-[10px] font-bold text-white">3</span>}</button>)}
          </nav>
          <p className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Support</p>
          <nav className="mt-3 flex flex-col gap-1"><button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"><ShieldCheck className="size-[18px]" />Help center</button><button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"><Settings className="size-[18px]" />Settings</button></nav>
        </div>
        <div className="rounded-2xl bg-[#123b68] p-4 text-white"><div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-white/15"><BookOpen className="size-4" /></div><p className="text-sm font-semibold">Need help applying?</p><p className="mt-1 text-xs leading-5 text-blue-100">Get guidance from your scholarship coordinator.</p><button className="mt-3 text-xs font-bold text-white underline underline-offset-4">Visit help center</button></div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" />}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
          <button className="rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></button>
          <div className="hidden lg:block"><p className="text-sm font-medium text-slate-400">Wednesday, 16 October 2026</p></div>
          <div className="ml-auto flex items-center gap-4"><button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="size-[19px]" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-rose-500" /></button><div className="h-7 w-px bg-slate-200" /><button className="flex items-center gap-2"><div className="flex size-9 items-center justify-center rounded-full bg-[#d8e7f4] text-xs font-bold text-[#123b68]">AS</div><div className="hidden text-left sm:block"><p className="text-sm font-semibold text-slate-800">Aarav Sharma</p><p className="text-[11px] text-slate-400">Student</p></div><ChevronDown className="hidden size-4 text-slate-400 sm:block" /></button></div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#26808a]">Good morning, Aarav</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Your scholarship overview</h1><p className="mt-2 text-sm text-slate-500">Track your applications and discover new opportunities.</p></div><button className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#123b68] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d2d50]"><Search className="size-4" />Find scholarships</button></div>
          {noticeOpen && <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#c6e1e5] bg-[#edf9fa] px-4 py-3.5 text-sm text-[#216a73]"><div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#cdecef]"><Check className="size-3.5" /></div><p className="flex-1 leading-6"><span className="font-bold">Your profile is 85% complete.</span> Add your bank details and domicile certificate to unlock more matches.</p><button onClick={() => setNoticeOpen(false)} className="p-1 text-[#55959c]" aria-label="Dismiss notice"><X className="size-4" /></button></div>}
          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={FileText} label="Total applications" value="3" detail="1 active application" tone="blue" /><StatCard icon={Clock3} label="Under review" value="1" detail="Updated 2 days ago" tone="violet" /><StatCard icon={Check} label="Approved" value="1" detail="₹75,000 awarded" tone="green" /><StatCard icon={CalendarDays} label="Closing soon" value="4" detail="Within the next 14 days" tone="amber" /></section>
          <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_330px]">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)]"><div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Recent applications</h2><p className="mt-1 text-xs text-slate-400">Your latest scholarship activity</p></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applications" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none ring-[#123b68] placeholder:text-slate-400 focus:ring-2 sm:w-44" /></div><button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600" onClick={() => setSelectedFilter(selectedFilter === 'All applications' ? 'Under review' : 'All applications')}><SlidersHorizontal className="size-3.5" />{selectedFilter === 'All applications' ? 'Filter' : selectedFilter}</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Scholarship</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{filteredApplications.map((application) => <tr key={application.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${application.tone}`}>{application.initials}</div><div><p className="font-semibold text-slate-800">{application.title}</p><p className="mt-0.5 text-xs text-slate-400">{application.id} · {application.organization}</p></div></div></td><td className="px-5 py-4 text-xs text-slate-500">{application.submitted}</td><td className="px-5 py-4 font-semibold text-slate-700">{application.amount}</td><td className="px-5 py-4"><StatusPill status={application.status} /></td><td className="px-5 py-4 text-right"><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#123b68]" aria-label={`View ${application.title}`}><ArrowUpRight className="size-4" /></button></td></tr>)}</tbody></table>{filteredApplications.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">No applications match your search.</p>}</div><div className="border-t border-slate-100 px-5 py-4"><button onClick={() => setActiveNav('My applications')} className="text-xs font-bold text-[#236885] hover:underline">View all applications <span aria-hidden="true">→</span></button></div></section>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5"><div><h2 className="font-bold text-slate-900">Recommended for you</h2><p className="mt-1 text-xs text-slate-400">Based on your profile</p></div><button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="View all recommendations"><ArrowUpRight className="size-4" /></button></div><div className="flex flex-col divide-y divide-slate-100">{scholarships.map((scholarship) => <button key={scholarship.name} className="group px-5 py-4 text-left transition hover:bg-slate-50"><div className="flex items-start justify-between gap-2"><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${scholarship.color}`}>{scholarship.tag}</span><ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-[#123b68]" /></div><p className="mt-3 text-sm font-bold leading-5 text-slate-800">{scholarship.name}</p><p className="mt-1 text-xs text-slate-400">{scholarship.provider}</p><div className="mt-3 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{scholarship.amount}</span><span className="text-slate-400">Closes {scholarship.deadline}</span></div></button>)}</div><div className="border-t border-slate-100 px-5 py-4"><button onClick={() => setActiveNav('Scholarships')} className="text-xs font-bold text-[#236885] hover:underline">Explore all scholarships <span aria-hidden="true">→</span></button></div></section>
          </div>
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Application journey</h2><p className="mt-1 text-xs text-slate-400">Merit Excellence Scholarship · APP-2026-0184</p></div><span className="text-xs font-semibold text-[#236885]">Step 3 of 5</span></div><div className="mt-6 flex items-start"><JourneyStep number="1" label="Applied" complete /><JourneyStep number="2" label="Documents" complete /><JourneyStep number="3" label="Department review" active /><JourneyStep number="4" label="Officer review" /><JourneyStep number="5" label="Decision" last /></div></section>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, detail, tone }: { icon: typeof FileText; label: string; value: string; detail: string; tone: string }) { const tones: Record<string, string> = { blue: 'bg-blue-50 text-blue-700', violet: 'bg-violet-50 text-violet-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700' }; return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between"><div className={`flex size-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="size-[18px]" /></div><span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span></div><p className="mt-4 text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div> }

function JourneyStep({ number, label, complete, active, last }: { number: string; label: string; complete?: boolean; active?: boolean; last?: boolean }) { return <div className={`relative flex flex-1 flex-col items-center text-center ${!last ? 'after:absolute after:left-1/2 after:top-3.5 after:h-px after:w-full after:bg-slate-200' : ''}`}><div className={`relative z-10 flex size-7 items-center justify-center rounded-full text-[11px] font-bold ${complete ? 'bg-emerald-500 text-white' : active ? 'bg-[#123b68] text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}>{complete ? <Check className="size-3.5" /> : number}</div><p className={`mt-2 max-w-24 text-[10px] font-semibold leading-4 ${active ? 'text-[#123b68]' : complete ? 'text-slate-700' : 'text-slate-400'}`}>{label}</p></div> }
