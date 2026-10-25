"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  UserRound,
  X,
  Bell,
  Upload,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  adminApi,
  applicationApi,
  authApi,
  dashboardApi,
  documentApi,
  notificationApi,
  profileApi,
  scholarshipApi,
} from "@/lib/api";
import AdminManagement from "@/components/admin-management";
import { StudentLanguageProvider, useStudentLanguage } from "@/lib/student-i18n";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

type Role = "student" | "staff" | "officer" | "director" | "admin";
type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  department?: string;
};
type Scholarship = {
  _id: string;
  name: string;
  provider: string;
  amount: number;
  description?: string;
  deadline: string;
  eligibility?: {
    minPercentage?: number;
    maxFamilyIncome?: number;
    courses?: string[];
    categories?: string[];
    academicYears?: string[];
  };
  requiredDocuments?: string[];
};
type Application = {
  _id: string;
  applicationNumber?: string;
  status: string;
  submittedAt?: string;
  createdAt?: string;
  student?: { name?: string; email?: string };
  scholarship?: Scholarship;
  documents?: string[];
  remarks?: string;
};
type DocumentRecord = {
  _id: string;
  originalName: string;
  type: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
};
type Profile = {
  course?: string;
  academicYear?: string;
  semester?: number;
  percentage?: number;
  familyIncome?: number;
  category?: string;
  documents?: DocumentRecord[];
};
type Notification = {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};
type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export const labels: Record<Role, string> = {
  student: "Student",
  staff: "Department Staff",
  officer: "Scholarship Officer",
  director: "Director",
  admin: "Administrator",
};
const paths: Record<Role, string> = {
  student: "/student",
  staff: "/staff",
  officer: "/officer",
  director: "/admin",
  admin: "/admin",
};
const navByRole: Record<Role, string[]> = {
  student: [
    "Overview",
    "My applications",
    "Scholarships",
    "Documents",
    "My profile",
    "Notifications",
  ],
  staff: ["Overview", "Verification queue", "Correction requests"],
  officer: ["Overview", "Review queue", "Recommendations"],
  director: ["Overview", "Final decisions", "Reports"],
  admin: [
    "Overview",
    "Scholarships",
    "User management",
    "Applications",
    "Audit logs",
  ],
};

const pageTitles: Record<string, string> = {
  Overview: "Dashboard",
  "My applications": "My Applications",
  Scholarships: "Scholarships",
  Documents: "Documents",
  "My profile": "My Profile",
  Notifications: "Notifications",
  "Verification queue": "Verification Queue",
  "Correction requests": "Correction Requests",
  "Review queue": "Review Queue",
  Recommendations: "Recommendations",
  "Final decisions": "Final Decisions",
  Reports: "Reports",
  "User management": "User Management",
  Applications: "Applications",
  "Audit logs": "Audit Logs",
};

const statusBadgeClasses: Record<string, string> = {
  Draft: "border-slate-200 bg-slate-100 text-slate-700",
  Submitted: "border-blue-200 bg-blue-50 text-blue-800",
  "Under Department Verification":
    "border-violet-200 bg-violet-50 text-violet-800",
  "Under Officer Verification":
    "border-indigo-200 bg-indigo-50 text-indigo-800",
  "Correction Required": "border-amber-200 bg-amber-50 text-amber-900",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

function readablePageTitle(role: Role, active: string) {
  const title = pageTitles[active] ?? active;
  return active === "Overview" ? `${labels[role]} Dashboard` : title;
}

export default function RealRolePortal() {
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [mode, setMode] = useState<"login" | "register">("login"),
    [role, setRole] = useState<Role>("student"),
    [form, setForm] = useState({
      name: "",
      studentId: "",
      email: "",
      password: "",
    }),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    authApi
      .me()
      .then(({ data }) => {
        setUser(data.user);
        redirectForRole(data.user.role);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));

    const handleAuthExpired = () => {
      setUser(null);
      setError("Your session has expired. Please log in again.");
      setNotice("");
      setMode("login");
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/");
      }
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);
  function redirectForRole(nextRole: Role) {
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== paths[nextRole]
    )
      window.history.replaceState({}, "", paths[nextRole]);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const response =
        mode === "register"
          ? await authApi.register(form)
          : await authApi.login({
              email: form.email,
              password: form.password,
              expectedRole: role,
            });
      setUser(response.data.user);
      redirectForRole(response.data.user.role);
      if (mode === "register")
        setNotice("Student account created successfully.");
    } catch (cause: any) {
      setError(
        cause.response?.data?.message ?? "Unable to complete the request.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function signOut() {
    await authApi.logout().catch(() => undefined);
    setUser(null);
    if (typeof window !== "undefined") window.history.replaceState({}, "", "/");
  }
  if (checking)
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-600">
          Restoring your secure session...
        </p>
      </main>
    );
  if (!user)
    return (
      <Login
        mode={mode}
        role={role}
        setRole={setRole}
        setMode={setMode}
        form={form}
        setForm={setForm}
        error={error}
        notice={notice}
        submitting={submitting}
        submit={submit}
      />
    );
  return (
    <StudentLanguageProvider>
      <Dashboard user={user} signOut={signOut} />
    </StudentLanguageProvider>
  );
}

function Login({
  mode,
  role,
  setRole,
  setMode,
  form,
  setForm,
  error,
  notice,
  submitting,
  submit,
}: any) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8FAFC] px-4 py-6 text-[#0F172A] sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[1fr_440px] lg:gap-12">
        <section className="hidden lg:block">
          <Brand />
          <h1 className="mt-10 max-w-xl text-5xl font-bold leading-tight tracking-tight text-slate-800">
            One secure place for every scholarship journey.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-500">
            A transparent workflow for students, staff, officers, directors, and
            administrators.
          </p>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-9">
          <div className="lg:hidden">
            <Brand />
          </div>
          <p className="mt-8 text-sm font-semibold text-teal-600">
            {mode === "login" ? "Welcome back" : "Student registration"}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {mode === "login"
              ? "Sign in to your workspace"
              : "Start your application journey"}
          </h2>
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {notice}
            </div>
          )}
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            {mode === "login" && (
              <label className="text-sm font-semibold">
                Sign in as
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"
                >
                  {Object.entries(labels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {mode === "register" && (
              <label className="text-sm font-semibold text-slate-700">
                Full name
                <input
                  id="full-name"
                  required
                  autoComplete="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"
                />
              </label>
            )}
            {mode === "register" && (
              <label className="text-sm font-semibold text-slate-700">
                Student ID{" "}
                <span className="font-normal text-slate-400">(optional)</span>
                <input
                  id="student-id"
                  placeholder="Student ID (optional)"
                  value={form.studentId}
                  onChange={(e) =>
                    setForm({ ...form, studentId: e.target.value })
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"
                />
              </label>
            )}
            <label
              htmlFor="email"
              className="text-sm font-semibold text-slate-700"
            >
              Email address
              <input
                id="email"
                autoComplete="email"
                required
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"
              />
            </label>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-slate-700"
            >
              Password
              <span className="relative mt-2 block">
                <input
                  id="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="min-h-12 w-full rounded-xl border border-slate-200 px-3 py-3 pr-12 font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </span>
            </label>
            <button
              disabled={submitting}
              className="min-h-12 cursor-pointer rounded-xl bg-[#0D9488] px-4 py-3 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Securing your session…"
                : mode === "login"
                  ? "Sign in securely"
                  : "Create student account"}
            </button>
          </form>
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            type="button"
            className="mt-5 min-h-11 cursor-pointer text-left text-sm font-bold text-teal-700 hover:underline"
          >
            {mode === "login"
              ? "New student? Create an account"
              : "Already registered? Sign in"}
          </button>
        </section>
      </div>
    </main>
  );
}

const APP_PAGE_LIMIT = 20;

function Dashboard({ user, signOut }: { user: User; signOut: () => void }) {
  const languageContext = useStudentLanguage();
  const t = languageContext.t;
  const [active, setActive] = useState("Overview"),
    [open, setOpen] = useState(false),
    [applications, setApplications] = useState<Application[]>([]),
    [scholarships, setScholarships] = useState<Scholarship[]>([]),
    [stats, setStats] = useState<any>({}),
    [documents, setDocuments] = useState<DocumentRecord[]>([]),
    [profile, setProfile] = useState<Profile>({}),
    [notifications, setNotifications] = useState<Notification[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");

  // ── Pagination state ───��──────────────────────────────────────────────────
  const [applPage, setApplPage] = useState(1);
  const [applStatus, setApplStatus] = useState("");
  const [applPagination, setApplPagination] = useState<Pagination | null>(null);

  const isStudent = user.role === "student";

  const loadApplications = useCallback(
    async (page: number, status: string, silent: boolean) => {
      try {
        const params: { page: number; limit: number; status?: string } = {
          page,
          limit: APP_PAGE_LIMIT,
        };
        if (status) params.status = status;
        const apps = await applicationApi.list(params);
        const data = apps.data;
        // Support both paginated { applications, pagination } and legacy bare array
        if (Array.isArray(data)) {
          setApplications(data);
          setApplPagination(null);
        } else {
          setApplications(data.applications ?? []);
          setApplPagination(data.pagination ?? null);
        }
      } catch (cause: any) {
        if (!silent) {
          setError(
            cause.response?.data?.message ??
              "We could not load your latest workspace data.",
          );
        }
      }
    },
    [],
  );

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [stat, schol] = await Promise.all([
        dashboardApi.stats(),
        isStudent ? scholarshipApi.list() : Promise.resolve({ data: [] }),
      ]);
      setStats(stat.data.stats ?? stat.data);
      setScholarships(
        Array.isArray(schol.data)
          ? schol.data
          : (schol.data.scholarships ?? []),
      );
      await loadApplications(applPage, applStatus, silent);
      if (isStudent) {
        const [docs, prof, notes] = await Promise.all([
          documentApi.list(),
          profileApi.get(),
          notificationApi.list(),
        ]);
        setDocuments(docs.data.documents ?? docs.data);
        setProfile(prof.data.profile ?? prof.data ?? {});
        setNotifications(notes.data.items ?? []);
      }
    } catch (cause: any) {
      setError(
        cause.response?.data?.message ??
          "We could not load your latest workspace data.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch when page or status filter changes
  useEffect(() => {
    void loadApplications(applPage, applStatus, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applPage, applStatus]);

  useEffect(() => {
    void loadData();

    const refreshInterval = window.setInterval(() => {
      void loadData(true);
    }, 30_000);

    return () => window.clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent]);

  async function apply(scholarship: Scholarship) {
    try {
      await applicationApi.create(scholarship._id);
      setMessage(`Draft started for ${scholarship.name}.`);
      setActive("My applications");
      // Reset to page 1 so the new draft is visible immediately
      setApplPage(1);
      setApplStatus("");
      await loadApplications(1, "", false);
    } catch (cause: any) {
      setError(
        cause.response?.data?.message ?? "Unable to start this application.",
      );
    }
  }
  const [remarkDialog, setRemarkDialog] = useState<{
    open: boolean;
    applicationId: string;
    nextStatus: string;
    remarks: string;
    error?: string;
    submitting?: boolean;
  }>({
    open: false,
    applicationId: "",
    nextStatus: "",
    remarks: "",
  });

  async function executeStatusUpdate(
    id: string,
    status: string,
    remarks?: string,
  ) {
    setError("");
    setMessage("");
    try {
      await applicationApi.updateStatus(id, status, remarks);
      setMessage(
        status === "Correction Required"
          ? "Correction request sent to the student."
          : status === "Rejected"
            ? "Application marked as rejected."
            : `Application marked ${status.toLowerCase()}.`,
      );
      // Reload at the current page so pagination state is preserved
      await loadApplications(applPage, applStatus, true);
      return true;
    } catch (cause: any) {
      setError(
        cause.response?.data?.message ??
          "That action is not available for this role.",
      );
      return false;
    }
  }

  function handleStatusClick(id: string, status: string) {
    if (status === "Correction Required" || status === "Rejected") {
      setRemarkDialog({
        open: true,
        applicationId: id,
        nextStatus: status,
        remarks: "",
        error: undefined,
        submitting: false,
      });
      return;
    }
    void executeStatusUpdate(id, status);
  }

  async function submitRemarkDialog() {
    const trimmed = remarkDialog.remarks.trim();
    if (!trimmed) {
      setRemarkDialog((prev) => ({
        ...prev,
        error:
          prev.nextStatus === "Correction Required"
            ? "A correction reason or remark is required."
            : "A rejection reason or remark is required.",
      }));
      return;
    }

    setRemarkDialog((prev) => ({
      ...prev,
      submitting: true,
      error: undefined,
    }));
    const success = await executeStatusUpdate(
      remarkDialog.applicationId,
      remarkDialog.nextStatus,
      trimmed,
    );
    if (success) {
      setRemarkDialog({
        open: false,
        applicationId: "",
        nextStatus: "",
        remarks: "",
        submitting: false,
      });
    } else {
      setRemarkDialog((prev) => ({ ...prev, submitting: false }));
    }
  }

  async function submitApplication(id: string, currentStatus: string) {
    setError("");
    setMessage("");
    try {
      await applicationApi.submit(id);
      setMessage(
        currentStatus === "Correction Required"
          ? "Application resubmitted successfully!"
          : "Application submitted successfully!",
      );
      // Reload at current page — submitted app changes status so it may
      // disappear from a filtered view, which is correct.
      await loadApplications(applPage, applStatus, true);
    } catch (cause: any) {
      const data = cause.response?.data;
      const errorMsg = data?.missingTypes?.length
        ? `Missing documents: ${data.missingTypes.join(", ")}`
        : data?.reasons?.length
          ? data.reasons.join(". ")
          : (data?.message ?? "Application submission failed.");
      setError(errorMsg);
    }
  }
  // With server-side pagination active the server already filters by status
  // when applStatus is set. The filtered memo is kept for the Overview
  // tab which shows only the first 5 records as a summary.
  const filtered = useMemo(() => applications, [applications]);

  const cards: StatCardData[] = isStudent
    ? [
        {
          title: "My applications",
          value: applications.length,
          detail: "All saved and submitted applications",
          icon: FileText,
          tone: "teal",
        },
        {
          title: "Drafts",
          value: stats.drafts ?? 0,
          detail: "Applications still in progress",
          icon: FileCheck2,
          tone: "slate",
        },
        {
          title: "Awaiting verification",
          value: stats.awaitingVerification ?? 0,
          detail: "Submitted for review",
          icon: ClipboardCheck,
          tone: "blue",
        },
        {
          title: "Approved",
          value: stats.approved ?? 0,
          detail: "Applications approved",
          icon: CheckCircle2,
          tone: "green",
        },
        {
          title: "Correction requests",
          value: stats.correctionRequired ?? 0,
          detail: "Need your attention",
          icon: RefreshCw,
          tone: "amber",
        },
        {
          title: "Available scholarships",
          value: stats.scholarships ?? scholarships.length,
          detail: "Open opportunities",
          icon: GraduationCap,
          tone: "indigo",
        },
      ]
    : user.role === "staff"
      ? [
          {
            title: "Total applications",
            value: stats.totalApplications ?? applications.length,
            detail: "Across all scholarship cycles",
            icon: FileText,
            tone: "teal",
          },
          {
            title: "New submissions",
            value: stats.byStatus?.Submitted ?? 0,
            detail: "Ready for department review",
            icon: ClipboardCheck,
            tone: "blue",
          },
          {
            title: "Department verification",
            value: stats.byStatus?.["Under Department Verification"] ?? 0,
            detail: "Currently in your queue",
            icon: FileCheck2,
            tone: "violet",
          },
          {
            title: "Correction requests",
            value: stats.correctionRequired ?? 0,
            detail: "Applications needing updates",
            icon: RefreshCw,
            tone: "amber",
          },
        ]
      : user.role === "officer"
        ? [
            {
              title: "Total applications",
              value: stats.totalApplications ?? applications.length,
              detail: "All submitted applications",
              icon: FileText,
              tone: "teal",
            },
            {
              title: "Awaiting verification",
              value: stats.byStatus?.["Under Department Verification"] ?? 0,
              detail: "Pending department handoff",
              icon: ClipboardCheck,
              tone: "blue",
            },
            {
              title: "Awaiting final decision",
              value: stats.byStatus?.["Under Officer Verification"] ?? 0,
              detail: "Ready for officer review",
              icon: FileCheck2,
              tone: "violet",
            },
            {
              title: "Correction requests",
              value: stats.correctionRequired ?? 0,
              detail: "Returned to applicants",
              icon: RefreshCw,
              tone: "amber",
            },
          ]
        : user.role === "director"
          ? [
              {
                title: "Total applications",
                value: stats.totalApplications ?? applications.length,
                detail: "Current application volume",
                icon: FileText,
                tone: "teal",
              },
              {
                title: "Awaiting final decision",
                value: stats.byStatus?.["Under Officer Verification"] ?? 0,
                detail: "Pending your decision",
                icon: ClipboardCheck,
                tone: "blue",
              },
              {
                title: "Approved",
                value: stats.approved ?? 0,
                detail: "Successful decisions",
                icon: CheckCircle2,
                tone: "green",
              },
              {
                title: "Rejected",
                value: stats.rejected ?? 0,
                detail: "Decisions not approved",
                icon: X,
                tone: "rose",
              },
            ]
          : [
              {
                title: "Total applications",
                value: stats.totalApplications ?? applications.length,
                detail: "System-wide applications",
                icon: FileText,
                tone: "teal",
              },
              {
                title: "Pending review",
                value: stats.pending ?? 0,
                detail: "Across active queues",
                icon: ClipboardCheck,
                tone: "blue",
              },
              {
                title: "Approved",
                value: stats.approved ?? 0,
                detail: "Approved applications",
                icon: CheckCircle2,
                tone: "green",
              },
              {
                title: "Rejected",
                value: stats.rejected ?? 0,
                detail: "Rejected applications",
                icon: X,
                tone: "rose",
              },
            ];

  const statusColors: Record<string, string> = {
    Draft: "#94a3b8",
    Submitted: "#2563eb",
    "Under Department Verification": "#6366f1",
    "Under Officer Verification": "#0f766e",
    "Correction Required": "#b45309",
    Approved: "#047857",
    Rejected: "#be123c",
  };

  const statusChartData = Object.entries(stats.byStatus ?? {})
    .map(([name, value]) => ({
      name: isStudent ? t(name) : name,
      value: Number(value),
    }))
    .filter((item) => item.value > 0);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  return (
    <div className="min-h-screen bg-background text-foreground">
      {open && (
        <button
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(86vw,280px)] flex-col bg-[#0F172A] text-white shadow-2xl transition-transform duration-200 lg:w-72 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[84px] items-center justify-between border-b border-white/10 px-5">
          <Brand light />
          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mx-4 mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {labels[user.role]}
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {isStudent ? t("Workspace") : "Workspace"}
        </div>
        <nav
          aria-label={`${labels[user.role]} navigation`}
          className="flex flex-1 flex-col gap-1 px-3"
        >
          {navByRole[user.role].map((item) => (
            <button
              key={item}
              type="button"
              aria-current={active === item ? "page" : undefined}
              onClick={() => {
                setActive(item);
                setOpen(false);
              }}
              className={`group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === item ? "bg-teal-600 text-white shadow-lg shadow-teal-950/20" : "text-slate-400 hover:bg-white/[0.07] hover:text-white focus-visible:bg-white/[0.07]"}`}
            >
              {active === item && (
                <span className="absolute -left-3 h-7 w-1 rounded-r-full bg-teal-300" />
              )}
              <NavIcon item={item} />
              <span className="truncate">{isStudent ? t(item) : item}</span>
              {item === "Notifications" && unreadCount > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${active === item ? "bg-white/20 text-white" : "bg-rose-400 text-white"}`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            onClick={signOut}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.07] hover:text-white focus-visible:bg-white/[0.07]"
          >
            <LogOut className="size-5" />
            {isStudent ? t("Sign out") : "Sign out"}
          </button>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex min-h-[84px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <button
              onClick={() => setOpen(true)}
              className="cursor-pointer rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <div className="mb-1 hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
                <span>ScholarFlow</span>
                <span aria-hidden="true">/</span>
                <span>{isStudent ? t(labels[user.role]) : labels[user.role]}</span>
                <span aria-hidden="true">/</span>
                <span className="text-slate-600">
                  {isStudent ? t(pageTitles[active] ?? active) : pageTitles[active] ?? active}
                </span>
              </div>
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {isStudent ? t(readablePageTitle(user.role, active)) : readablePageTitle(user.role, active)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="mr-1 hidden h-8 w-px bg-slate-200 sm:block" />
            <button
              onClick={() => setActive("Notifications")}
              className="relative cursor-pointer rounded-xl p-2.5 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700 focus-visible:bg-teal-50"
              aria-label={
                unreadCount
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {isStudent && languageContext && (
              <label className="sr-only" htmlFor="student-language">Language</label>
            )}
            {isStudent && languageContext && (
              <select
                id="student-language"
                aria-label="Language / भाषा"
                value={languageContext.language}
                onChange={(event) => languageContext.setLanguage(event.target.value as "en" | "hi")}
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
            )}
            <div className="ml-1 hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
              <span className="flex size-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden lg:block">
                <p className="max-w-32 truncate text-sm font-semibold text-slate-800">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500">{labels[user.role]}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl space-y-6 bg-[#F8FAFC] p-5 sm:p-8">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              {error}
            </div>
          )}
          {message && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              {message}
            </div>
          )}
          {active === "Overview" && (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold text-teal-700">
                    {isStudent ? t(labels[user.role]) : labels[user.role]} {isStudent ? t("Workspace") : "workspace"}
                  </p>
                  <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {isStudent ? t("Good to see you, {name}.", { name: user.name.split(" ")[0] }) : `Good to see you, ${user.name.split(" ")[0]}.`}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                    {isStudent ? t("Here is the latest view of your scholarship activity and work queue.") : "Here is the latest view of your scholarship activity and work queue."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadData()}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
                >
                  <RefreshCw className="size-4" />
                  {isStudent ? t("Refresh data") : "Refresh data"}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                  <StatCard key={card.title} card={isStudent ? { ...card, title: t(card.title), detail: t(card.detail) } : card} loading={loading} />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-slate-800">
{user.role === "student"
                    ? t("My Application Status")
                        : user.role === "staff"
                          ? "Application Verification Overview"
                          : user.role === "officer"
                            ? "Officer Review Overview"
                            : user.role === "director"
                              ? "Final Decision Overview"
                              : "System-wide Application Status"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
{user.role === "student"
                    ? t("Track the status of your scholarship applications")
                        : user.role === "staff"
                          ? "Monitor application statuses and department verification"
                          : user.role === "officer"
                            ? "Monitor applications awaiting officer review"
                            : user.role === "director"
                              ? "Review application outcomes and pending final decisions"
                              : "Breakdown of all scholarship applications by status"}
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                      Loading analytics...
                    </div>
                  ) : statusChartData.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                      No application status data available yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={55}
                          paddingAngle={3}
                        >
                          {statusChartData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={statusColors[entry.name] ?? "#64748b"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "#0f172a",
                            boxShadow: "0 8px 24px rgb(15 23 42 / 0.10)",
                          }}
                          labelStyle={{ color: "#334155", fontWeight: 700 }}
                        />
                        <Legend wrapperStyle={{ color: "#475569", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-slate-800">
{user.role === "student"
                    ? t("My Monthly Applications")
                        : user.role === "staff"
                          ? "Monthly Verification Workload"
                          : user.role === "officer"
                            ? "Monthly Officer Review Trends"
                            : user.role === "director"
                              ? "Monthly Decision Trends"
                              : "Monthly System Application Trends"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Application submissions over the last six months
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                      Loading trends...
                    </div>
                  ) : !Array.isArray(stats.monthlyTrend) ? (
                    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                      Monthly trend data is not available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart
                        data={
                          user.role === "student"
                            ? stats.monthlyTrend
                            : (stats.roleActivityTrend ?? stats.monthlyTrend)
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#cbd5e1" }} tickLine={{ stroke: "#cbd5e1" }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#cbd5e1" }} tickLine={{ stroke: "#cbd5e1" }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "#0f172a",
                            boxShadow: "0 8px 24px rgb(15 23 42 / 0.10)",
                          }}
                          labelStyle={{ color: "#334155", fontWeight: 700 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="applications"
                          name={
                            user.role === "student"
                              ? "Submitted applications"
                              : "Verification / decision actions"
                          }
                          stroke="#0d9488"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </section>
              </div>

              <ApplicationTable
                applications={applications.slice(0, 5)}
                loading={loading}
                role={user.role}
                onStatus={handleStatusClick}
                onSubmitApplication={submitApplication}
                isOverviewSummary
              />
            </>
          )}
          {active === "Scholarships" && (
            <ScholarshipList
              scholarships={scholarships}
              applications={applications}
              loading={loading}
              onApply={apply}
            />
          )}
          {active === "Documents" && isStudent && (
            <Documents
              documents={documents}
              applications={applications}
              onChanged={loadData}
              setError={setError}
              setMessage={setMessage}
            />
          )}
          {active === "My profile" && isStudent && (
            <ProfileEditor
              profile={profile}
              user={user}
              onSaved={async () => {
                await loadData();
                setMessage(t("Profile saved successfully."));
              }}
            />
          )}
          {active === "Notifications" && isStudent && (
            <Notifications
              items={notifications}
              onRead={async (id) => {
                await notificationApi.markRead(id);
                setNotifications((items) =>
                  items.map((n) => (n._id === id ? { ...n, read: true } : n)),
                );
              }}
            />
          )}
          {(active === "My applications" ||
            (!isStudent &&
              active !== "Overview" &&
              active !== "Scholarships")) && (
            <ApplicationTable
              applications={filtered}
              loading={loading}
              role={user.role}
              onStatus={handleStatusClick}
              onSubmitApplication={submitApplication}
              pagination={applPagination}
              currentPage={applPage}
              currentStatus={applStatus}
              onPageChange={(p: number) => setApplPage(p)}
              onStatusChange={(s: string) => {
                setApplStatus(s);
                setApplPage(1);
              }}
            />
          )}
          {user.role === "admin" && active === "User management" && (
            <AdminManagement />
          )}

          {user.role === "admin" && active === "Audit logs" && (
            <AdminManagement auditOnly />
          )}
        </main>
      </div>

      {remarkDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {remarkDialog.nextStatus === "Correction Required"
                  ? "Request Application Correction"
                  : "Reject Application"}
              </h3>
              <button
                onClick={() =>
                  setRemarkDialog((prev) => ({ ...prev, open: false }))
                }
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              {remarkDialog.nextStatus === "Correction Required"
                ? "Specify the changes or missing documentation required from the applicant."
                : "Specify the reason for rejecting this application. This will be recorded and shared with the applicant."}
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                {remarkDialog.nextStatus === "Correction Required"
                  ? "Correction Remarks *"
                  : "Rejection Reason *"}
              </label>
              <textarea
                rows={4}
                value={remarkDialog.remarks}
                onChange={(e) =>
                  setRemarkDialog((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                    error: undefined,
                  }))
                }
                placeholder={
                  remarkDialog.nextStatus === "Correction Required"
                    ? "e.g. Please upload an updated income certificate with official seal..."
                    : "e.g. Criteria not met or documentation verified as invalid..."
                }
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              {remarkDialog.error && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {remarkDialog.error}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setRemarkDialog((prev) => ({ ...prev, open: false }))
                }
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={remarkDialog.submitting}
                onClick={submitRemarkDialog}
                className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                  remarkDialog.nextStatus === "Correction Required"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {remarkDialog.submitting
                  ? "Saving..."
                  : remarkDialog.nextStatus === "Correction Required"
                    ? "Send Correction Request"
                    : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Documents({
  documents,
  applications,
  onChanged,
  setError,
  setMessage,
}: any) {
  const { t } = useStudentLanguage();
  const [type, setType] = useState("marksheet"),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false);
  const types = [
    "marksheet",
    "income-certificate",
    "category-certificate",
    "domicile-certificate",
    "identity",
    "bank-proof",
    "other",
  ];

  async function upload() {
    if (!file) return setError("Choose a document first.");

    if (file.size > 10 * 1024 * 1024) {
      return setError("Files must be 10 MB or smaller.");
    }

    const data = new FormData();
    data.append("file", file);
    data.append("type", type);

    setBusy(true);

    try {
      // Step 1: Upload document
      const response = await documentApi.upload(data);
      const uploadedDocument = response.data;

      // Step 2: Find an editable application
      const draft = applications.find((app: Application) =>
        ["Draft", "Correction Required"].includes(app.status),
      );

      // Step 3: Attach uploaded document to that application
      if (draft) {
        const existingIds = (draft.documents ?? []).map((doc: any) =>
          typeof doc === "string" ? doc : doc._id,
        );

        const documentIds = [
          ...new Set([...existingIds, uploadedDocument._id]),
        ];

        await applicationApi.update(draft._id, {
          documents: documentIds,
        });

        setMessage(
          `Document uploaded and attached to ${draft.scholarship?.name ?? "your application"}.`,
        );
      } else {
        setMessage(
          "Document uploaded successfully, but no editable application was found. It has not been attached.",
        );
      }

      setFile(null);
      await onChanged();
    } catch (cause: any) {
      setError(
        cause.response?.data?.message ??
          "Document upload or attachment failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Upload documents"
        subtitle="PDF, JPG, JPEG, or PNG up to 10 MB"
      >
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0] ?? null);
          }}
          className="rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 p-8 text-center"
        >
          <Upload className="mx-auto text-teal-700" />
          <p className="mt-2 font-semibold">Drop a file here or choose one</p>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mx-auto mt-4 block max-w-full text-sm"
          />
          {file && (
            <p className="mt-3 text-sm text-slate-600">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          <div className="mx-auto mt-4 flex max-w-md gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {types.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("-", " ")}
                </option>
              ))}
            </select>
            <button
              disabled={busy || !file}
              onClick={upload}
              className="cursor-pointer rounded-xl bg-[#193b61] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {busy ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </Panel>
      <Panel
        title="Your documents"
        subtitle="Stored privately against your student account"
      >
        <div className="divide-y divide-slate-100">
          {documents.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              No documents uploaded yet.
            </p>
          ) : (
            documents.map((doc: DocumentRecord) => (
              <div
                key={doc._id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-teal-700" />
                  <div>
                    <p className="font-semibold">{doc.originalName}</p>
                    <p className="text-xs text-slate-500">
                      {doc.type.replaceAll("-", " ")} ·{" "}
                      {doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : ""} ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={documentApi.contentUrl(doc._id)}
                    className="cursor-pointer text-sm font-bold text-teal-700 hover:underline"
                  >
                    Preview
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        await documentApi.remove(doc._id);
                        setMessage("Document deleted successfully.");
                        await onChanged();
                      } catch (cause: any) {
                        setError(
                          cause.response?.data?.message ??
                            "Unable to delete document.",
                        );
                      }
                    }}
                    className="cursor-pointer text-rose-600 hover:text-rose-800"
                    aria-label={`Delete ${doc.originalName}`}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
      <RequiredDocuments applications={applications} documents={documents} />
    </div>
  );
}
function RequiredDocuments({ applications, documents }: any) {
  const available = new Set(documents.map((d: DocumentRecord) => d.type));

  return (
    <Panel
      title="Application checklist"
      subtitle="Required documents are checked by the server at submission"
    >
      <div className="divide-y divide-slate-100">
        {applications
          .filter((a: Application) =>
            ["Draft", "Correction Required"].includes(a.status),
          )
          .map((app: Application) => (
            <div key={app._id} className="p-4">
              <p className="font-semibold">
                {app.scholarship?.name ?? "Application"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(app.scholarship?.requiredDocuments ?? []).map((required) => (
                  <span
                    key={required}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${available.has(required) ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                  >
                    {available.has(required) ? "Ready" : "Missing"}:{" "}
                    {required.replaceAll("-", " ")}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </Panel>
  );
}
function ProfileEditor({ profile, user, onSaved }: any) {
  const { t } = useStudentLanguage();
  const [data, setData] = useState(profile);
  useEffect(() => setData(profile), [profile]);
  async function save(e: FormEvent) {
    e.preventDefault();
    await profileApi.update(data);
    await onSaved();
  }
  const fields: [string, string, string][] = [
    ["course", "Course", "text"],
    ["academicYear", "Academic year", "text"],
    ["semester", "Semester", "number"],
    ["percentage", "Academic percentage", "number"],
    ["familyIncome", "Annual family income", "number"],
    ["category", "Category", "text"],
  ];
  return (
    <Panel
      title={t("My profile")}
      subtitle={t("Keep your eligibility information current")}
    >
      <form onSubmit={save} className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2 rounded-xl bg-slate-50 p-4">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-slate-500">
            {user.email}
            {user.studentId ? ` · Student ID ${user.studentId}` : ""}
          </p>
        </div>
        {fields.map(([key, label, type]) => (
          <label key={key} className="text-sm font-semibold">
            {t(label)}
            <input
              required={[
                "course",
                "academicYear",
                "percentage",
                "familyIncome",
                "category",
              ].includes(key)}
              type={type}
              value={(data as any)[key] ?? ""}
              onChange={(e) =>
                setData({
                  ...data,
                  [key]:
                    type === "number" ? Number(e.target.value) : e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal"
            />
          </label>
        ))}
        <button className="cursor-pointer rounded-xl bg-[#193b61] px-4 py-3 font-bold text-white sm:col-span-2">
          {t("Save profile")}
        </button>
      </form>
    </Panel>
  );
}
function Notifications({
  items,
  onRead,
}: {
  items: Notification[];
  onRead: (id: string) => void;
}) {
  const { t } = useStudentLanguage();
  return (
    <Panel
      title={t("Notifications")}
      subtitle={t("Application events and correction requests")}
    >
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            You have no notifications.
          </p>
        ) : (
          items.map((item: Notification) => (
            <div
              key={item._id}
              className={`flex items-start justify-between gap-4 p-4 ${item.read ? "" : "bg-teal-50/60"}`}
            >
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              {!item.read && (
                <button
                  onClick={() => onRead(item._id as string)}
                  className="cursor-pointer text-xs font-bold text-teal-700 hover:underline"
                >
                  {t("Mark read")}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Under Department Verification", label: "Dept. Verification" },
  { value: "Under Officer Verification", label: "Officer Verification" },
  { value: "Correction Required", label: "Correction Required" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const STAFF_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Submitted", label: "Submitted" },
  {
    value: "Under Department Verification",
    label: "Dept. Verification",
  },
  { value: "Correction Required", label: "Correction Required" },
];

const OFFICER_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Under Officer Verification", label: "Officer Verification" },
  { value: "Correction Required", label: "Correction Required" },
  { value: "Rejected", label: "Rejected" },
];

const DIRECTOR_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const ADMIN_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Under Department Verification", label: "Dept. Verification" },
  { value: "Under Officer Verification", label: "Officer Verification" },
  { value: "Correction Required", label: "Correction Required" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

function ApplicationTable({
  applications,
  loading,
  role,
  onStatus,
  onSubmitApplication,
  pagination,
  currentPage,
  currentStatus,
  onPageChange,
  onStatusChange,
  isOverviewSummary,
}: any) {
  const showControls = !isOverviewSummary;

  const statusOptions =
    role === "staff"
      ? STAFF_STATUS_FILTER_OPTIONS
      : role === "officer"
        ? OFFICER_STATUS_FILTER_OPTIONS
        : role === "director"
          ? DIRECTOR_STATUS_FILTER_OPTIONS
          : role === "admin"
            ? ADMIN_STATUS_FILTER_OPTIONS
            : STATUS_FILTER_OPTIONS;

  return (
    <Panel
      title={
        isOverviewSummary
          ? "Recent applications"
          : role === "student"
            ? "My applications"
            : "Application workflow"
      }
      subtitle={
        isOverviewSummary
          ? "Latest 5 records"
          : pagination
            ? `Page ${pagination.page} of ${pagination.totalPages} · ${pagination.total} total`
            : "Live records from the scholarship system"
      }
    >
      {/* ── Status filter + pagination header ── */}

      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <select
            value={currentStatus ?? ""}
            onChange={(e) => onStatusChange?.(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            aria-label="Filter by status"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {pagination && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">
                {pagination.total === 0
                  ? "No results"
                  : `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )} of ${pagination.total}`}
              </span>
              <button
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span className="min-w-[3rem] text-center text-xs font-semibold text-slate-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="p-5 text-sm text-slate-500">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">
          {currentStatus
            ? `No applications with status "${currentStatus}".`
            : "No applications match this view."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm text-slate-800">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Scholarship</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item: Application) => (
                <tr key={item._id} className="border-b border-slate-100">
                  <td className="px-4 py-4 font-semibold">
                    {item.applicationNumber || item._id.slice(-8)}
                  </td>
                  <td className="px-4 py-4">
                    {item.student?.name || "My application"}
                  </td>
                  <td className="px-4 py-4">
                    {item.scholarship?.name || "Scholarship"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClasses[item.status] ?? "border-slate-200 bg-slate-100 text-slate-700"}`}
                    >
                      {item.status}
                    </span>
                    {item.remarks && (
                      <p className="mt-2 max-w-xs text-xs text-rose-600">
                        {item.remarks}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {role === "student" &&
                      ["Draft", "Correction Required"].includes(
                        item.status,
                      ) && (
                        <button
                          onClick={() =>
                            onSubmitApplication?.(item._id, item.status)
                          }
                          className="cursor-pointer text-sm font-bold text-teal-700 hover:underline"
                        >
                          {item.status === "Correction Required"
                            ? "Resubmit Application"
                            : "Submit"}
                        </button>
                      )}

                    {role === "staff" && (
                      <div className="flex flex-wrap gap-2">
                        {item.status === "Submitted" && (
                          <button
                            onClick={() =>
                              onStatus(
                                item._id,
                                "Under Department Verification",
                              )
                            }
                            className="cursor-pointer rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100"
                          >
                            Verify
                          </button>
                        )}
                        {[
                          "Submitted",
                          "Under Department Verification",
                        ].includes(item.status) && (
                          <button
                            onClick={() =>
                              onStatus(item._id, "Correction Required")
                            }
                            className="cursor-pointer rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100"
                          >
                            Correction
                          </button>
                        )}
                      </div>
                    )}

                    {role === "officer" && (
                      <div className="flex flex-wrap gap-2">
                        {item.status === "Under Department Verification" && (
                          <button
                            onClick={() =>
                              onStatus(item._id, "Under Officer Verification")
                            }
                            className="cursor-pointer rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100"
                          >
                            Recommend
                          </button>
                        )}
                        {[
                          "Under Department Verification",
                          "Under Officer Verification",
                        ].includes(item.status) && (
                          <>
                            <button
                              onClick={() =>
                                onStatus(item._id, "Correction Required")
                              }
                              className="cursor-pointer rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100"
                            >
                              Correction
                            </button>
                            <button
                              onClick={() => onStatus(item._id, "Rejected")}
                              className="cursor-pointer rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {role === "director" && (
                      <div className="flex flex-wrap gap-2">
                        {item.status === "Under Officer Verification" && (
                          <>
                            <button
                              onClick={() => onStatus(item._id, "Approved")}
                              className="cursor-pointer rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onStatus(item._id, "Rejected")}
                              className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {role === "admin" && (
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Submitted",
                          "Under Department Verification",
                          "Under Officer Verification",
                          "Correction Required",
                        ].includes(item.status) && (
                          <>
                            <button
                              onClick={() => onStatus(item._id, "Approved")}
                              className="cursor-pointer rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onStatus(item._id, "Rejected")}
                              className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                              Reject
                            </button>
                            {item.status !== "Correction Required" && (
                              <button
                                onClick={() =>
                                  onStatus(item._id, "Correction Required")
                                }
                                className="cursor-pointer rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
                              >
                                Correction
                              </button>
                            )}
                            {item.status !==
                              "Under Department Verification" && (
                              <button
                                onClick={() =>
                                  onStatus(
                                    item._id,
                                    "Under Department Verification",
                                  )
                                }
                                className="cursor-pointer rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                              >
                                To Dept
                              </button>
                            )}
                            {item.status !== "Under Officer Verification" && (
                              <button
                                onClick={() =>
                                  onStatus(
                                    item._id,
                                    "Under Officer Verification",
                                  )
                                }
                                className="cursor-pointer rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100"
                              >
                                To Officer
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Bottom pagination footer ── */}
      {showControls && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <button
            onClick={() => onPageChange?.(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange?.(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </Panel>
  );
}

function ScholarshipList({
  scholarships,
  applications,
  loading,
  onApply,
}: any) {
  const applied = new Set(
    applications.map((a: Application) => a.scholarship?._id),
  );
  return (
    <Panel
      title="Active scholarships"
      subtitle="Published opportunities with future deadlines"
    >
      {loading ? (
        <p className="p-5">Loading...</p>
      ) : (
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {scholarships.length === 0 ? (
            <p className="text-sm text-slate-500">
              No active scholarships are available.
            </p>
          ) : (
            scholarships.map((item: Scholarship) => (
              <article key={item._id} className="rounded-2xl border p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <p className="text-sm font-semibold text-teal-700">
                      {item.provider}
                    </p>
                  </div>
                  <p className="font-bold">{item.amount.toLocaleString()}</p>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {item.description ||
                    "Scholarship opportunity for eligible students."}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Deadline {new Date(item.deadline).toLocaleDateString()} ·{" "}
                  {item.requiredDocuments?.length ?? 0} required documents
                </p>
                <button
                  disabled={applied.has(item._id)}
                  onClick={() => onApply(item)}
                  className="mt-4 cursor-pointer rounded-xl bg-[#193b61] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {applied.has(item._id)
                    ? "Application started"
                    : "Start application"}
                </button>
              </article>
            ))
          )}
        </div>
      )}
    </Panel>
  );
}
type StatTone =
  | "teal"
  | "slate"
  | "blue"
  | "green"
  | "amber"
  | "indigo"
  | "violet"
  | "rose";
type StatCardData = {
  title: string;
  value: number;
  detail: string;
  icon: typeof FileText;
  tone: StatTone;
};

const statToneClasses: Record<StatTone, { icon: string; value: string }> = {
  teal: { icon: "bg-teal-50 text-teal-700", value: "text-teal-700" },
  slate: { icon: "bg-slate-100 text-slate-700", value: "text-slate-800" },
  blue: { icon: "bg-blue-50 text-blue-700", value: "text-blue-700" },
  green: { icon: "bg-emerald-50 text-emerald-700", value: "text-emerald-700" },
  amber: { icon: "bg-amber-50 text-amber-700", value: "text-amber-700" },
  indigo: { icon: "bg-indigo-50 text-indigo-700", value: "text-indigo-700" },
  violet: { icon: "bg-violet-50 text-violet-700", value: "text-violet-700" },
  rose: { icon: "bg-rose-50 text-rose-700", value: "text-rose-700" },
};

function StatCard({ card, loading }: { card: StatCardData; loading: boolean }) {
  const Icon = card.icon;
  const tone = statToneClasses[card.tone];
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{card.title}</p>
          <p className={`mt-3 text-3xl font-bold tracking-tight ${tone.value}`}>
            {loading ? "—" : card.value}
          </p>
        </div>
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
        {card.detail}
      </p>
    </article>
  );
}

function Panel({ title, subtitle, children }: any) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
function NavIcon({ item }: { item: string }) {
  const Icon = item.includes("Scholar")
    ? BookOpen
    : item.includes("application") ||
        item.includes("queue") ||
        item.includes("decision")
      ? FileCheck2
      : item.includes("Document")
        ? FileText
        : item.includes("profile")
          ? UserRound
          : item.includes("Notification")
            ? Bell
            : LayoutDashboard;
  return <Icon />;
}
function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-10 items-center justify-center rounded-xl ${light ? "bg-teal-500 text-white" : "bg-[#193b61] text-white"}`}
      >
        <GraduationCap />
      </div>
      <div>
        <p
          className={`text-lg font-bold ${light ? "text-white" : "text-slate-800"}`}
        >
          ScholarFlow
        </p>
        <p
          className={`text-[10px] ${light ? "text-blue-100/60" : "text-slate-400"}`}
        >
          Scholarship portal
        </p>
      </div>
    </div>
  );
}
