import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getAllJobOpenings,
  createJobOpening,
  updateJobOpening,
  deleteJobOpening,
} from "../../api/recruitment/jobOpening.api";
import { getDepartments } from "../../api/hr.dept";
import { getBranches }    from "../../api/api.branch";
import { hasPermission }  from "../../configs/auth.utils";
import {
  Briefcase, Plus, Loader2, X, Search, Trash2, Edit3,
  ChevronLeft, ChevronRight, Eye, RefreshCw, Building2,
  Users, CheckCircle2, Clock, CalendarX, BarChart2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ── Permissions ─────────────────────────────────────────────────────────────
const canView   = () => hasPermission("RECRUITMENT_VIEW");
const canCreate = () => hasPermission("RECRUITMENT_CREATE");
const canUpdate = () => hasPermission("RECRUITMENT_UPDATE");
const canDelete = () => hasPermission("RECRUITMENT_DELETE");

// ── Constants ────────────────────────────────────────────────────────────────
const STATUSES  = ["Open", "On Hold", "Closed"];
const ROWS_PAGE = 10;
const EMPTY_CREATE = { title: "", departmentId: "", totalOpenings: "", description: "" };
const EMPTY_EDIT   = { title: "", totalOpenings: "", description: "", status: "Open" };

// Confirmation popup config per action type
const CONFIRM_META = {
  create: {
    Icon: Briefcase, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
    btnClass: "bg-indigo-600 hover:bg-indigo-700", label: "Create Opening",
  },
  update: {
    Icon: Edit3,     iconBg: "bg-amber-50",  iconColor: "text-amber-600",
    btnClass: "bg-amber-600 hover:bg-amber-700",   label: "Save Changes",
  },
  delete: {
    Icon: Trash2,    iconBg: "bg-rose-50",   iconColor: "text-rose-600",
    btnClass: "bg-rose-600 hover:bg-rose-700",     label: "Delete",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const statusCls = (s = "") => {
  const sl = s.toLowerCase();
  if (sl === "open")    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (sl === "on hold") return "bg-amber-100   text-amber-700   border-amber-200";
  if (sl === "closed")  return "bg-rose-100    text-rose-700    border-rose-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Tooltip (same pattern as PayRoll) ────────────────────────────────────────
const Tooltip = ({ text, children }) => (
  <div className="relative group inline-flex">
    {children}
    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex whitespace-nowrap bg-slate-800 text-white text-[8px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg shadow-xl z-50 pointer-events-none leading-none">
      {text}
      <div className="absolute top-full right-2.5 border-4 border-transparent border-t-slate-800" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function JobOpening() {
  const [openings,    setOpenings]    = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches,    setBranches]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Filters
  const [search,       setSearch]       = useState("");
  const [deptFilter,   setDeptFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);

  // Form modals
  const [showCreate, setShowCreate] = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [viewItem,   setViewItem]   = useState(null);

  // Form data
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT);
  const [saving,     setSaving]     = useState(false);

  // Unified confirmation popup
  const [confirm, setConfirm] = useState({
    open: false, type: "create", title: "", message: "", onConfirm: null,
  });

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [opRes, deptRes, branchRes] = await Promise.all([
        getAllJobOpenings(),
        getDepartments(),
        getBranches(),
      ]);
      setOpenings(Array.isArray(opRes)       ? opRes      : []);
      setDepartments(Array.isArray(deptRes)  ? deptRes    : []);
      setBranches(Array.isArray(branchRes)   ? branchRes  : []);
    } catch {
      toast.error("Failed to load job openings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return openings.filter(o => {
      if (q && !(o.title || "").toLowerCase().includes(q)) return false;
      if (deptFilter   && String(o.departmentId) !== deptFilter)  return false;
      if (statusFilter && (o.status || "Open")   !== statusFilter) return false;
      return true;
    });
  }, [openings, search, deptFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PAGE, page * ROWS_PAGE);
  useEffect(() => { setPage(1); }, [search, deptFilter, statusFilter]);

  // ── Dept stat cards ───────────────────────────────────────────────────────
  const deptStats = useMemo(() => {
    const map = {};
    openings.forEach(o => {
      const id   = String(o.departmentId || "");
      const name = o.departmentName || "Unknown";
      if (!map[id]) map[id] = { id, name, total: 0, open: 0, filled: 0, remaining: 0 };
      map[id].total++;
      if ((o.status || "Open").toLowerCase() === "open") map[id].open++;
      map[id].filled    += Number(o.filledCount      || 0);
      map[id].remaining += Number(o.remainingOpenings || 0);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [openings]);

  // ── Dept option label (for create dropdown: name · branch location) ───────
  const deptOptionLabel = (d) => {
    const branch = branches.find(b => b.branchId === d.branchId || b.id === d.branchId);
    const loc = branch?.location || branch?.branchName || "";
    return loc ? `${d.departmentName} · ${loc}` : d.departmentName;
  };

  // ── Confirm popup helper ─────────────────────────────────────────────────
  const askConfirm = (type, title, message, onConfirm) =>
    setConfirm({ open: true, type, title, message, onConfirm });

  const closeConfirm = () => setConfirm(c => ({ ...c, open: false, onConfirm: null }));

  const runConfirm = async () => {
    if (!confirm.onConfirm) return;
    closeConfirm();
    await confirm.onConfirm();
  };

  // ── Create ───────────────────────────────────────────────────────────────
  const validateCreate = () => {
    if (!createForm.title.trim())       { toast.error("Title is required");          return false; }
    if (!createForm.departmentId)       { toast.error("Select a department");         return false; }
    if (!createForm.totalOpenings || Number(createForm.totalOpenings) < 1)
                                        { toast.error("Total openings must be ≥ 1"); return false; }
    if (!createForm.description.trim()) { toast.error("Description is required");    return false; }
    return true;
  };

  const submitCreate = (e) => {
    e.preventDefault();
    if (!validateCreate()) return;
    const dept = departments.find(d => String(d.departmentId || d.id) === String(createForm.departmentId));
    askConfirm(
      "create",
      "Create Job Opening",
      `Create "${createForm.title}" for ${dept ? deptOptionLabel(dept) : "selected department"} with ${createForm.totalOpenings} opening(s)?`,
      async () => {
        setSaving(true);
        const tid = toast.loading("Creating job opening…");
        try {
          await createJobOpening(createForm);
          toast.success("Job opening created successfully", { id: tid });
          setShowCreate(false);
          setCreateForm(EMPTY_CREATE);
          await fetchAll();
        } catch (err) {
          toast.error(err?.response?.data?.title || "Failed to create", { id: tid });
        } finally {
          setSaving(false);
        }
      }
    );
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (o) => {
    setEditItem(o);
    setEditForm({
      title:         o.title         || "",
      totalOpenings: String(o.totalOpenings ?? ""),
      description:   o.description   || "",
      status:        o.status        || "Open",
    });
  };

  const validateEdit = () => {
    if (!editForm.title.trim())       { toast.error("Title is required");          return false; }
    if (!editForm.totalOpenings || Number(editForm.totalOpenings) < 1)
                                      { toast.error("Total openings must be ≥ 1"); return false; }
    if (!editForm.description.trim()) { toast.error("Description is required");    return false; }
    return true;
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!validateEdit()) return;
    askConfirm(
      "update",
      "Update Job Opening",
      `Save changes to "${editForm.title}" (Status: ${editForm.status}, Openings: ${editForm.totalOpenings})?`,
      async () => {
        setSaving(true);
        const tid = toast.loading("Saving changes…");
        try {
          await updateJobOpening(editItem.jobOpeningId ?? editItem.id, editForm);
          toast.success("Job opening updated successfully", { id: tid });
          setEditItem(null);
          await fetchAll();
        } catch (err) {
          toast.error(err?.response?.data?.title || "Failed to update", { id: tid });
        } finally {
          setSaving(false);
        }
      }
    );
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const triggerDelete = (o) => {
    askConfirm(
      "delete",
      "Delete Job Opening",
      `Permanently delete "${o.title}"? This action cannot be undone.`,
      async () => {
        const tid = toast.loading("Deleting…");
        try {
          await deleteJobOpening(o.jobOpeningId ?? o.id);
          toast.success("Job opening deleted", { id: tid });
          await fetchAll();
        } catch {
          toast.error("Failed to delete", { id: tid });
        }
      }
    );
  };

  // ── Permission guard ─────────────────────────────────────────────────────
  if (!canView()) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        You don't have permission to view job openings.
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 text-[var(--text-main)]">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" /> Job Openings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {filtered.length} opening{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll}
            className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>
          {canCreate() && (
            <button onClick={() => { setCreateForm(EMPTY_CREATE); setShowCreate(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> New Opening
            </button>
          )}
        </div>
      </div>

      {/* ── Department stat cards ────────────────────────────────────────── */}
      {(() => {
        const ICON_CLS = [
          "bg-indigo-500/10 text-indigo-500",
          "bg-teal-500/10   text-teal-500",
          "bg-violet-500/10 text-violet-500",
          "bg-sky-500/10    text-sky-500",
          "bg-emerald-500/10 text-emerald-500",
          "bg-orange-500/10 text-orange-500",
          "bg-rose-500/10   text-rose-500",
          "bg-cyan-500/10   text-cyan-500",
        ];
        return (
          <div className="flex gap-2 flex-wrap">
            {/* All */}
            <button
              onClick={() => setDeptFilter("")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all shadow-sm hover:border-indigo-400/50 active:scale-[.98] ${
                !deptFilter
                  ? "border-indigo-400 ring-1 ring-indigo-400/30 bg-[var(--bg-card)]"
                  : "border-[var(--border-color)] bg-[var(--bg-card)]"
              }`}>
              <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-500 flex-shrink-0">
                <BarChart2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">All Depts</p>
                <p className="text-base font-bold text-[var(--text-main)] leading-tight">{openings.length}</p>
              </div>
            </button>

            {deptStats.map((d, i) => {
              const active  = deptFilter === d.id;
              const iconCls = ICON_CLS[i % ICON_CLS.length];
              return (
                <button
                  key={d.id}
                  onClick={() => setDeptFilter(active ? "" : d.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all shadow-sm hover:border-indigo-400/50 active:scale-[.98] ${
                    active
                      ? "border-indigo-400 ring-1 ring-indigo-400/30 bg-[var(--bg-card)]"
                      : "border-[var(--border-color)] bg-[var(--bg-card)]"
                  }`}>
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${iconCls}`}>
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide truncate leading-tight max-w-[90px]">{d.name}</p>
                    <p className="text-base font-bold text-[var(--text-main)] leading-tight">{d.total} opening{d.total !== 1 ? "s" : ""}</p>
                    <p className="text-[9px] text-slate-400 leading-tight">{d.open} open · {d.filled} filled</p>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Search title…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-300 w-48" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="text-sm border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.departmentId || d.id} value={d.departmentId || d.id}>{deptOptionLabel(d)}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || deptFilter || statusFilter) && (
          <button onClick={() => { setSearch(""); setDeptFilter(""); setStatusFilter(""); }}
            className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                {["Title", "Department", "Openings", "Filled", "Remaining", "Status", "Created", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 bg-[var(--bg-body)] rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No job openings found</p>
                  </td>
                </tr>
              ) : (
                paginated.map(o => (
                  <tr key={o.jobOpeningId} className="hover:bg-[var(--bg-body)] transition-colors">

                    {/* Title */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="font-semibold text-[var(--text-main)] truncate">{o.title}</p>
                    </td>

                    {/* Department — use API's departmentName directly */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="w-3 h-3 flex-shrink-0 text-indigo-400" />
                        {o.departmentName || `Dept #${o.departmentId}`}
                      </div>
                    </td>

                    {/* Total openings */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-main)]">
                        <Users className="w-3 h-3 text-slate-400" />
                        {o.totalOpenings ?? "—"}
                      </div>
                    </td>

                    {/* Filled */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        {o.filledCount ?? 0}
                      </div>
                    </td>

                    {/* Remaining */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                        <BarChart2 className="w-3 h-3" />
                        {o.remainingOpenings ?? o.totalOpenings ?? 0}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls(o.status || "Open")}`}>
                        {o.status || "Open"}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {fmtDate(o.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Tooltip text="View Details">
                          <button onClick={() => setViewItem(o)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        {canUpdate() && (
                          <Tooltip text="Edit Opening">
                            <button onClick={() => openEdit(o)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        )}
                        {canDelete() && (
                          <Tooltip text="Delete Opening">
                            <button onClick={() => triggerDelete(o)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-color)] bg-[var(--bg-body)]">
            <p className="text-xs text-slate-400">
              Showing {(page - 1) * ROWS_PAGE + 1}–{Math.min(page * ROWS_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-slate-400 hover:text-indigo-500 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                  acc.push(p); return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="px-1.5 text-slate-400 text-xs">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-indigo-600 text-white" : "border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-indigo-50 hover:text-indigo-600"}`}>
                      {p}
                    </button>
                  )
                )
              }
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-slate-400 hover:text-indigo-500 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <Overlay onClose={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE); }}>
            <ModalCard title="New Job Opening" onClose={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE); }}>
              <form onSubmit={submitCreate} className="space-y-3 mt-3">
                <Field label="Job Title *">
                  <input type="text" value={createForm.title}
                    onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Frontend Developer"
                    className={inputCls} />
                </Field>
                <Field label="Department *">
                  <select value={createForm.departmentId}
                    onChange={e => setCreateForm(f => ({ ...f, departmentId: e.target.value }))}
                    className={inputCls}>
                    <option value="">Select department</option>
                    {departments.map(d => (
                      <option key={d.departmentId || d.id} value={d.departmentId || d.id}>
                        {deptOptionLabel(d)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Total Openings *">
                  <input type="number" min={1} value={createForm.totalOpenings}
                    onChange={e => setCreateForm(f => ({ ...f, totalOpenings: e.target.value }))}
                    placeholder="e.g. 3"
                    className={inputCls} />
                </Field>
                <Field label="Description *">
                  <textarea rows={4} value={createForm.description}
                    onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Role responsibilities, required skills…"
                    className={`${inputCls} resize-none`} />
                </Field>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE); }}
                    className="flex-1 py-2 text-sm text-slate-500 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Review & Create
                  </button>
                </div>
              </form>
            </ModalCard>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editItem && (
          <Overlay onClose={() => setEditItem(null)}>
            <ModalCard title="Edit Job Opening" onClose={() => setEditItem(null)}>
              <form onSubmit={submitEdit} className="space-y-3 mt-3">
                <Field label="Job Title *">
                  <input type="text" value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className={inputCls} />
                </Field>
                <Field label="Total Openings *">
                  <input type="number" min={1} value={editForm.totalOpenings}
                    onChange={e => setEditForm(f => ({ ...f, totalOpenings: e.target.value }))}
                    className={inputCls} />
                </Field>
                <Field label="Status">
                  <select value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className={inputCls}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Description *">
                  <textarea rows={4} value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    className={`${inputCls} resize-none`} />
                </Field>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setEditItem(null)}
                    className="flex-1 py-2 text-sm text-slate-500 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Review & Save
                  </button>
                </div>
              </form>
            </ModalCard>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewItem && (
          <Overlay onClose={() => setViewItem(null)}>
            <ModalCard title="Job Opening Details" onClose={() => setViewItem(null)}>
              <div className="space-y-2">
                {/* Title + dept + status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-main)] leading-tight">{viewItem.title}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{viewItem.departmentName || `Dept #${viewItem.departmentId}`}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusCls(viewItem.status || "Open")}`}>
                    {viewItem.status || "Open"}
                  </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1.5">
                  <InfoTile icon={<Users        className="w-3 h-3"/>} label="Total"     value={viewItem.totalOpenings ?? 0}     color="text-indigo-600"  bg="bg-indigo-50"  />
                  <InfoTile icon={<CheckCircle2 className="w-3 h-3"/>} label="Filled"    value={viewItem.filledCount ?? 0}       color="text-emerald-600" bg="bg-emerald-50" />
                  <InfoTile icon={<BarChart2    className="w-3 h-3"/>} label="Remaining" value={viewItem.remainingOpenings ?? 0} color="text-amber-600"   bg="bg-amber-50"   />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                    <p className="text-[9px] text-slate-400 flex items-center gap-1 mb-0.5"><Clock className="w-2.5 h-2.5" />Created</p>
                    <p className="text-[11px] font-semibold text-[var(--text-main)]">{fmtDate(viewItem.createdAt)}</p>
                  </div>
                  <div className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                    <p className="text-[9px] text-slate-400 flex items-center gap-1 mb-0.5"><CalendarX className="w-2.5 h-2.5" />Closed</p>
                    <p className="text-[11px] font-semibold text-[var(--text-main)]">{fmtDate(viewItem.closedAt)}</p>
                  </div>
                </div>

                {/* Description */}
                {viewItem.description && (
                  <div className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-[11px] text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">{viewItem.description}</p>
                  </div>
                )}

                <button onClick={() => setViewItem(null)}
                  className="w-full py-1.5 text-xs font-medium border border-[var(--border-color)] rounded-lg text-slate-500 hover:bg-[var(--bg-body)] transition-colors">
                  Close
                </button>
              </div>
            </ModalCard>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── Unified Confirmation Popup ───────────────────────────────────── */}
      <AnimatePresence>
        {confirm.open && (() => {
          const meta = CONFIRM_META[confirm.type] || CONFIRM_META.create;
          const { Icon, iconBg, iconColor, btnClass, label } = meta;
          return (
            <Overlay onClose={closeConfirm}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-body)]">
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">{confirm.title}</h2>
                  <button onClick={closeConfirm}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 text-center space-y-4">
                  <div className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center mx-auto`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <p className="text-sm text-[var(--text-main)] leading-relaxed">{confirm.message}</p>
                  <div className="flex gap-2">
                    <button onClick={closeConfirm}
                      className="flex-1 py-2.5 text-sm text-slate-500 border border-[var(--border-color)] bg-[var(--bg-body)] rounded-xl hover:bg-[var(--bg-card)] transition-colors">
                      Cancel
                    </button>
                    <button onClick={runConfirm}
                      className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl ${btnClass} active:scale-95 transition-all`}>
                      {label}
                    </button>
                  </div>
                </div>
              </motion.div>
            </Overlay>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-body)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function InfoTile({ icon, label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-2.5 text-center border border-transparent`}>
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>{icon}</div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide">{label}</p>
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      {children}
    </div>
  );
}

function ModalCard({ title, onClose, children }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-body)]">
        <h2 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wide">{title}</h2>
        <button onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--bg-card)] text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
    </motion.div>
  );
}
