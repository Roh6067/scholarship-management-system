"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useStudentLanguage } from "@/lib/student-i18n";

type Tab = "scholarships" | "users" | "applications" | "audit";
type Scholarship = {
  _id: string;
  name: string;
  provider: string;
  description?: string;
  amount: number;
  deadline: string;
  published: boolean;
  eligibility?: {
    minPercentage?: number;
    maxFamilyIncome?: number;
    courses?: string[];
    categories?: string[];
    academicYears?: string[];
  };
  requiredDocuments?: string[];
};

const empty = {
  name: "",
  provider: "",
  description: "",
  amount: "",
  deadline: "",
  minPercentage: "",
  maxFamilyIncome: "",
  courses: "",
  categories: "",
  academicYears: "",
  requiredDocuments: "",
};

export default function AdminManagement({
  auditOnly = false,
}: {
  auditOnly?: boolean;
}) {
  const { t } = useStudentLanguage();
  const [tab, setTab] = useState<Tab>(
  auditOnly ? "audit" : "scholarships",
);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    department: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [s, u, a, l] = await Promise.all([
        adminApi.scholarships(),
        adminApi.users(),
        adminApi.applications(),
        adminApi.audit(),
      ]);
      setScholarships(s.data);
      setUsers(u.data);
      setApplications(a.data);
      setAudit(l.data);
    } catch (e: any) {
      setError(
        e.response?.data?.message ?? t("Unable to load administrator data."),
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function setField(key: string, value: string) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }
  function toPayload() {
    const list = (value: string) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    return {
      name: form.name,
      provider: form.provider,
      description: form.description,
      amount: Number(form.amount),
      deadline: form.deadline,
      eligibility: {
        minPercentage: form.minPercentage
          ? Number(form.minPercentage)
          : undefined,
        maxFamilyIncome: form.maxFamilyIncome
          ? Number(form.maxFamilyIncome)
          : undefined,
        courses: list(form.courses),
        categories: list(form.categories),
        academicYears: list(form.academicYears),
      },
      requiredDocuments: list(form.requiredDocuments),
    };
  }
  async function saveScholarship(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      if (editing) await adminApi.updateScholarship(editing, toPayload());
      else await adminApi.createScholarship(toPayload());
      setMessage(editing ? t("Scholarship updated.") : t("Scholarship created."));
      setShowForm(false);
      setEditing(null);
      setForm(empty);
      await load();
    } catch (e: any) {
      setError(
        e.response?.data?.message ?? "Please check all scholarship fields.",
      );
    }
  }
  async function removeScholarship(id: string) {
    if (!window.confirm("Delete this scholarship permanently?")) return;
    try {
      await adminApi.removeScholarship(id);
      setMessage("Scholarship deleted.");
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Delete failed.");
    }
  }
  async function toggle(item: Scholarship) {
    try {
      await adminApi.updateScholarship(item._id, {
        published: !item.published,
      });
      setMessage(
        item.published ? "Scholarship unpublished." : "Scholarship published.",
      );
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Publish action failed.");
    }
  }
  function edit(item: Scholarship) {
    setEditing(item._id);
    setForm({
      name: item.name,
      provider: item.provider,
      description: item.description ?? "",
      amount: String(item.amount),
      deadline: item.deadline.slice(0, 10),
      minPercentage: String(item.eligibility?.minPercentage ?? ""),
      maxFamilyIncome: String(item.eligibility?.maxFamilyIncome ?? ""),
      courses: item.eligibility?.courses?.join(", ") ?? "",
      categories: item.eligibility?.categories?.join(", ") ?? "",
      academicYears: item.eligibility?.academicYears?.join(", ") ?? "",
      requiredDocuments: item.requiredDocuments?.join(", ") ?? "",
    });
    setShowForm(true);
  }
  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await adminApi.createUser(userForm);
      setMessage(
        "Privileged account created. Share the temporary password securely.",
      );
      setUserForm({
        name: "",
        email: "",
        password: "",
        role: "staff",
        department: "",
      });
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Unable to create account.");
    }
  }
  const tabs: [Tab, string, number][] = [
    ["scholarships", t("Scholarships"), scholarships.length],
    ["users", t("Users"), users.length],
    ["applications", t("Applications"), applications.length],
    ["audit", t("Audit log"), audit.length],
  ];
  if (auditOnly) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#123b68]">
          {t("Audit Logs")}
        </h2>

        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading audit logs...
        </div>
      ) : (
        <Audit items={audit} />
      )}
    </section>
  );
}
  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#123b68]">
            Management center
          </h2>
        </div>
        <button
          onClick={load}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Refresh data
        </button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === value ? "bg-[#123b68] text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            {label} <span className="ml-1 opacity-70">{count}</span>
          </button>
        ))}
      </div>
      {message && (
        <div
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {message}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading management data...
        </div>
      ) : tab === "scholarships" ? (
        <Scholarships
          items={scholarships}
          showForm={showForm}
          form={form}
          editing={editing}
          onNew={() => {
            setEditing(null);
            setForm(empty);
            setShowForm(true);
          }}
          onEdit={edit}
          onDelete={removeScholarship}
          onToggle={toggle}
          onSubmit={saveScholarship}
          setField={setField}
          onCancel={() => setShowForm(false)}
        />
      ) : tab === "users" ? (
        <Users
          items={users}
          form={userForm}
          setForm={setUserForm}
          onSubmit={createUser}
        />
      ) : tab === "applications" ? (
        <Applications items={applications} />
      ) : (
        <Audit items={audit} />
      )}
    </section>
  );
}

function Scholarships({
  items,
  showForm,
  form,
  editing,
  onNew,
  onEdit,
  onDelete,
  onToggle,
  onSubmit,
  setField,
  onCancel,
}: any) {
  return (
    <div className="mt-5">
      {!showForm && (
        <button
          onClick={onNew}
          className="cursor-pointer rounded-xl bg-[#26808a] px-4 py-2 text-sm font-bold text-white hover:bg-[#1f6e76]"
        >
          Create scholarship
        </button>
      )}
      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-6 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"
        >
          {[
            ["name", "Name"],
            ["provider", "Provider"],
            ["amount", "Amount"],
            ["deadline", "Deadline"],
            ["minPercentage", "Minimum percentage"],
            ["maxFamilyIncome", "Maximum family income"],
            ["courses", "Eligible courses (comma separated)"],
            ["categories", "Categories (comma separated)"],
            ["academicYears", "Academic years (comma separated)"],
            ["requiredDocuments", "Required documents (comma separated)"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm font-semibold text-slate-700">
              {label}
              <input
                required={["name", "provider", "amount", "deadline"].includes(
                  key,
                )}
                type={
                  key === "amount" ||
                  key.includes("Percentage") ||
                  key.includes("Income")
                    ? "number"
                    : key === "deadline"
                      ? "date"
                      : "text"
                }
                value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#26808a]"
              />
            </label>
          ))}
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button className="cursor-pointer rounded-xl bg-[#123b68] px-4 py-2 text-sm font-bold text-white">
              {editing ? "Save changes" : "Create scholarship"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto text-slate-900">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-3">Scholarship</th>
              <th>Amount</th>
              <th>Deadline</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: Scholarship) => (
              <tr key={item._id} className="border-b border-slate-100">
                <td className="py-4">
                  <p className="font-bold text-[#123b68]">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.provider}</p>
                </td>
                <td>₹{item.amount.toLocaleString()}</td>
                <td>{new Date(item.deadline).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${item.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {item.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="text-right">
  <button
    onClick={() => onEdit(item)}
    className="cursor-pointer mr-3 rounded-full bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
  >
    Edit
  </button>

  <button
    onClick={() => onToggle(item)}
    className="cursor-pointer mr-3 rounded-full bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
  >
    {item.published ? "Unpublish" : "Publish"}
  </button>

  <button
    onClick={() => onDelete(item._id)}
    className="cursor-pointer rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
  >
    Delete
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Users({ items, form, setForm, onSubmit }: any) {
  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-[340px_1fr]">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4"
      >
        <h3 className="font-bold text-[#123b68]">Create staff account</h3>
        {[
          ["name", "Full name"],
          ["email", "Email"],
          ["password", "Temporary password"],
          ["department", "Department"],
        ].map(([key, label]) => (
          <label key={key} className="text-sm font-semibold text-slate-700">
            {label}
            <input
              required
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              type={
                key === "password"
                  ? "password"
                  : key === "email"
                    ? "email"
                    : "text"
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400"
            />
          </label>
        ))}
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
        >
          <option value="staff">Department Staff</option>
          <option value="officer">Scholarship Officer</option>
          <option value="director">Director</option>
        </select>
        <button className="cursor-pointer rounded-xl bg-[#123b68] px-4 py-2 text-sm font-bold text-white">
          Create account
        </button>
        <p className="text-xs text-slate-500">
          Passwords are hashed before storage. Admin accounts cannot be created
          here.
        </p>
      </form>
      <div className="overflow-x-auto text-slate-900">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-4 font-semibold">{item.name}</td>
                <td>{item.email}</td>
                <td className="capitalize">{item.role}</td>
                <td>{item.department ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Applications({ items }: any) {
  return (
    <div className="mt-5 overflow-x-auto text-slate-900">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-3">Student</th>
            <th>Scholarship</th>
            <th>Status</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr
              key={item._id}
              className="border-b border-slate-100 text-slate-800"
            >
              <td className="py-4">
                <p className="font-semibold">
                  {item.student?.name ?? "Unknown"}
                </p>
                <p className="text-xs text-slate-500">{item.student?.email}</p>
              </td>
              <td>{item.scholarship?.name ?? "Unknown"}</td>
              <td>{item.status}</td>
              <td>
                {item.submittedAt
                  ? new Date(item.submittedAt).toLocaleDateString()
                  : "Draft"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Audit({ items }: any) {
  return (
    <div className="mt-5 overflow-x-auto text-slate-900">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-3">Time</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr
              key={item._id}
              className="border-b border-slate-100 text-slate-800"
            >
              <td className="py-4">
                {new Date(item.createdAt).toLocaleString()}
              </td>
              <td>{item.actor?.name ?? "System"}</td>
              <td className="capitalize">{item.action}</td>
              <td className="capitalize">{item.entity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { Scholarship };
