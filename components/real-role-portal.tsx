"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
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
    [notice, setNotice] = useState("");
  useEffect(() => {
    authApi
      .me()
      .then(({ data }) => {
        setUser(data.user);
        redirectForRole(data.user.role);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
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
        submit={submit}
      />
    );
  return <Dashboard user={user} signOut={signOut} />;
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
  submit,
}: any) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <Brand />
          <h1 className="mt-10 max-w-xl text-5xl font-bold leading-tight tracking-tight text-[#193b61]">
            One secure place for every scholarship journey.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-500">
            A transparent workflow for students, staff, officers, directors, and
            administrators.
          </p>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
          <div className="lg:hidden">
            <Brand />
          </div>
          <p className="mt-8 text-sm font-semibold text-teal-600">
            {mode === "login" ? "Welcome back" : "Student registration"}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#193b61]">
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
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-3"
              />
            )}
            {mode === "register" && (
              <input
                placeholder="Student ID (optional)"
                value={form.studentId}
                onChange={(e) =>
                  setForm({ ...form, studentId: e.target.value })
                }
                className="rounded-xl border border-slate-200 px-3 py-3"
              />
            )}
            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3"
            />
            <input
              required
              minLength={8}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-3"
            />
            <button className="cursor-pointer rounded-xl bg-[#193b61] px-4 py-3 font-bold text-white hover:bg-[#102d4b]">
              {mode === "login" ? "Sign in securely" : "Create student account"}
            </button>
          </form>
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-5 cursor-pointer text-sm font-bold text-teal-700 hover:underline"
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

function Dashboard({ user, signOut }: { user: User; signOut: () => void }) {
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
  const isStudent = user.role === "student";
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [apps, stat, schol] = await Promise.all([
        applicationApi.list(),
        dashboardApi.stats(),
        isStudent ? scholarshipApi.list() : Promise.resolve({ data: [] }),
      ]);
      setApplications(
        Array.isArray(apps.data) ? apps.data : (apps.data.applications ?? []),
      );
      setStats(stat.data.stats ?? stat.data);
      setScholarships(
        Array.isArray(schol.data)
          ? schol.data
          : (schol.data.scholarships ?? []),
      );
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
  useEffect(() => {
    loadData();
  }, [isStudent]);
  async function apply(scholarship: Scholarship) {
    try {
      const response = await applicationApi.create(scholarship._id);
      setApplications((items) => [
        response.data.application ?? response.data,
        ...items,
      ]);
      setMessage(`Draft started for ${scholarship.name}.`);
      setActive("My applications");
    } catch (cause: any) {
      setError(
        cause.response?.data?.message ?? "Unable to start this application.",
      );
    }
  }
  async function updateStatus(id: string, status: string) {
    try {
      await applicationApi.updateStatus(id, status);
      setMessage(`Application marked ${status.toLowerCase()}.`);
      await loadData();
    } catch (cause: any) {
      setError(
        cause.response?.data?.message ??
          "That action is not available for this role.",
      );
    }
  }
  const filtered = useMemo(
    () =>
      active === "My applications"
        ? applications
        : active.includes("queue") ||
            active.includes("Queue") ||
            active.includes("decisions") ||
            active.includes("Recommendations") ||
            active.includes("Correction")
          ? applications.filter(
              (a) => !["Approved", "Rejected"].includes(a.status),
            )
          : applications,
    [applications, active],
  );
  const cards = isStudent
    ? [
        ["My applications", applications.length],
        ["Drafts", stats.drafts ?? 0],
        ["Awaiting verification", stats.awaitingVerification ?? 0],
        ["Approved", stats.approved ?? 0],
        ["Correction requests", stats.correctionRequired ?? 0],
        ["Available scholarships", stats.scholarships ?? scholarships.length],
      ]
    : [
        ["Total applications", stats.totalApplications ?? applications.length],
        ["Pending review", stats.pending ?? 0],
        ["Approved", stats.approved ?? 0],
        ["Rejected", stats.rejected ?? 0],
      ];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-[#193b61] text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Brand light />
          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-lg p-2 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="border-b border-white/10 px-6 py-5">
          <p className="truncate text-sm font-bold">{user.name}</p>
          <p className="mt-1 text-xs text-blue-100/70">{labels[user.role]}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
          {navByRole[user.role].map((item) => (
            <button
              key={item}
              onClick={() => {
                setActive(item);
                setOpen(false);
              }}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${active === item ? "bg-white/15" : "text-blue-100/70 hover:bg-white/10 hover:text-white"}`}
            >
              <NavIcon item={item} />
              {item}
              {item === "Notifications" &&
                notifications.some((n) => !n.read) && (
                  <span className="ml-auto rounded-full bg-rose-400 px-2 py-0.5 text-[10px]">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
            </button>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="m-4 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-blue-100/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut />
          Sign out
        </button>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpen(true)}
              className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <div>
              <p className="text-sm font-semibold text-teal-700">
                {labels[user.role]} workspace
              </p>
              <h1 className="text-2xl font-bold text-[#193b61]">{active}</h1>
            </div>
          </div>
          <button
            onClick={loadData}
            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Refresh data"
          >
            <RefreshCw />
          </button>
        </header>
        <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
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
              <div>
                <p className="text-3xl font-bold text-[#193b61]">
                  Good to see you, {user.name.split(" ")[0]}.
                </p>
                <p className="mt-1 text-slate-500">
                  Your scholarship activity is synced with the secure backend.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map(([title, value]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-slate-500">
                      {title}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-[#193b61]">
                      {loading ? "—" : value}
                    </p>
                  </div>
                ))}
              </div>
              <ApplicationTable
                applications={applications.slice(0, 5)}
                loading={loading}
                role={user.role}
                onStatus={updateStatus}
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
                setMessage("Profile saved successfully.");
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
              onStatus={updateStatus}
            />
          )}
          {user.role === "admin" && active === "User management" && (
            <AdminManagement />
          )}
        </main>
      </div>
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
        ["Draft", "Correction Required"].includes(app.status)
      );

      // Step 3: Attach uploaded document to that application
      if (draft) {
        const existingIds = (draft.documents ?? []).map(
          (doc: any) =>
            typeof doc === "string" ? doc : doc._id
        );

        const documentIds = [
          ...new Set([...existingIds, uploadedDocument._id]),
        ];

        await applicationApi.update(draft._id, {
          documents: documentIds,
        });

        setMessage(
          `Document uploaded and attached to ${draft.scholarship?.name ?? "your application"}.`
        );
      } else {
        setMessage(
          "Document uploaded successfully, but no editable application was found. It has not been attached."
        );
      }

      setFile(null);
      await onChanged();
    } catch (cause: any) {
      setError(
        cause.response?.data?.message ?? "Document upload or attachment failed."
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
                      await documentApi.remove(doc._id);
                      await onChanged();
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
      title="My profile"
      subtitle="Keep your eligibility information current"
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
            {label}
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
          Save profile
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
  return (
    <Panel
      title="Notifications"
      subtitle="Application events and correction requests"
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
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
function ApplicationTable({ applications, loading, role, onStatus }: any) {
  return (
    <Panel
      title={role === "student" ? "My applications" : "Application workflow"}
      subtitle="Live records from the scholarship system"
    >
      {loading ? (
        <p className="p-5 text-sm text-slate-500">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">
          No applications match this view.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
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
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                      {item.status}
                    </span>
                    {item.remarks && (
                      <p className="mt-2 max-w-xs text-xs text-rose-600">
                        {item.remarks}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 flex gap-3">
                    {role === "student" &&
                      ["Draft", "Correction Required"].includes(
                        item.status,
                      ) && (
                        
<button
  onClick={async () => {
    try {
      const response = await applicationApi.submit(item._id);
      console.log("Application submitted:", response.data);
      alert("Application submitted successfully!");
    } catch (cause: any) {
      const data = cause.response?.data;

      console.error("Application submission failed:", data ?? cause.message);

      const message = data?.missingTypes?.length
        ? `Missing documents: ${data.missingTypes.join(", ")}`
        : data?.reasons?.length
          ? data.reasons.join("\n")
          : data?.message ?? "Application submission failed.";

      alert(message);
    }
  }}
  className="cursor-pointer text-sm font-bold text-teal-700 hover:underline"
>
  Submit
</button>

                      )}
                    {role === "staff" && item.status === "Submitted" && (
                      <button
                        onClick={() =>
                          onStatus(item._id, "Under Department Verification")
                        }
                        className="cursor-pointer text-sm font-bold text-teal-700 hover:underline"
                      >
                        Verify
                      </button>
                    )}
                    {role === "officer" &&
                      item.status === "Under Department Verification" && (
                        <button
                          onClick={() =>
                            onStatus(item._id, "Under Officer Verification")
                          }
                          className="cursor-pointer text-sm font-bold text-teal-700 hover:underline"
                        >
                          Review
                        </button>
                      )}
                    {(role === "admin" || role === "director") &&
                      [
                        "Under Officer Verification",
                        "Correction Required",
                      ].includes(item.status) && (
                        <>
                          <button
                            onClick={() => onStatus(item._id, "Approved")}
                            className="cursor-pointer text-sm font-bold text-emerald-700 hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              onStatus(item._id, "Correction Required")
                            }
                            className="cursor-pointer text-sm font-bold text-rose-700 hover:underline"
                          >
                            Correction
                          </button>
                        </>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    <h3 className="font-bold text-[#193b61]">{item.name}</h3>
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
function Panel({ title, subtitle, children }: any) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-[#193b61]">{title}</h2>
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
          className={`text-lg font-bold ${light ? "text-white" : "text-[#193b61]"}`}
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
