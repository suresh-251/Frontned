import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar, X, Plus, Loader2, CheckCircle, XCircle, Trash2,
  Search, Send, Wallet, Umbrella, Lock, ChevronLeft, ChevronRight,
  CalendarDays, Coins, RefreshCw, AlertTriangle, Edit3, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

import { hasPermission, getAuthDetails } from "../../configs/auth.utils";
import {
  getAllLeaves, getLeavesByEmployee, applyLeave, updateLeaveStatus,
  deleteLeave, getLeaveBalance,
  addHoliday, getHolidays, deleteHoliday,
  getLeaveCalendar,
  requestEncashment, getEncashmentHistory,
} from "../../api/LeaveService";

// ── constants ────────────────────────────────────────────────────────────────
const LEAVE_TYPES    = ["Sick", "Casual", "Earned"];
const HOLIDAY_TYPES  = ["National", "Optional", "Regional"];
const TABS           = ["Leaves", "Holidays", "Calendar", "Encashment"];
const EMPTY_APPLY    = { leaveType: "Sick", customType: "", useCustomType: false, startDate: "", endDate: "", reason: "" };
const EMPTY_HOLIDAY  = { name: "", date: "", type: "National" };

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Fixed annual Indian holidays (MM-DD)
const FIXED_HOLIDAYS = {
  "01-01": "New Year's Day",
  "01-14": "Makar Sankranti",
  "01-23": "Netaji Jayanti",
  "01-26": "Republic Day",
  "04-14": "Dr. Ambedkar Jayanti",
  "05-01": "Labour Day",
  "08-15": "Independence Day",
  "10-02": "Gandhi Jayanti",
  "11-14": "Children's Day",
  "12-25": "Christmas",
};
// Variable (lunar/moving) Indian holidays by full YYYY-MM-DD
const VARIABLE_HOLIDAYS = {
  // 2026 - Central Government Holidays (India)
"2026-01-26": "Republic Day",
"2026-03-03": "Holi",
"2026-03-20": "Id-ul-Fitr (Eid ul-Fitr)",
"2026-04-03": "Good Friday",
"2026-04-14": "Dr. B. R. Ambedkar Jayanti",
"2026-05-01": "May Day",
"2026-05-27": "Id-ul-Zuha (Eid ul-Adha)",
"2026-08-15": "Independence Day",
"2026-08-27": "Janmashtami",
"2026-10-02": "Mahatma Gandhi's Birthday / Dussehra",
"2026-10-24": "Milad-un-Nabi or Id-e-Milad (Birthday of Prophet Muhammad)",
"2026-11-08": "Diwali (Deepavali)",
"2026-11-24": "Guru Nanak's Birthday",
"2026-12-25": "Christmas Day"
};

const getPublicHolidayName = (year, month, day) => {
  const mmdd = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const full  = `${year}-${mmdd}`;
  return VARIABLE_HOLIDAYS[full] || FIXED_HOLIDAYS[mmdd] || null;
};

const isDateInRange = (dateStr, startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const d = new Date(dateStr);
  const s = new Date(startDate.split("T")[0]);
  const e = new Date(endDate.split("T")[0]);
  return d >= s && d <= e;
};

const statusStyle = (s = "") => {
  const sl = s.toLowerCase();
  if (sl === "approved")          return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (sl === "rejected")          return "bg-rose-100    text-rose-700    border-rose-200";
  if (sl === "pending")           return "bg-amber-100   text-amber-700   border-amber-200";
  if (sl.includes("progress"))    return "bg-indigo-100  text-indigo-700  border-indigo-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
};

const daysBetween = (s, e) => {
  if (!s || !e) return 0;
  return Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000) + 1);
};

// ── Tooltip ──────────────────────────────────────────────────────────────────
const Tip = ({ text, children }) => (
  <div className="relative group inline-flex">
    {children}
    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex whitespace-nowrap bg-slate-800 text-white text-[8px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg shadow-xl z-50 pointer-events-none">
      {text}
      <div className="absolute top-full right-2 border-4 border-transparent border-t-slate-800" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function Leave() {
  const auth         = getAuthDetails();
  const currentUserId = Number(auth?.userId);
  const isManager    = !!(auth?.isAdmin || auth?.role === "HR_MANAGER");

  const canView    = hasPermission("LEAVE_VIEW");
  const canApply   = hasPermission("LEAVE_APPLY");
  const canUpdate  = hasPermission("LEAVE_UPDATE");
  const canDelete  = hasPermission("LEAVE_DELETE");

  // ── state ──────────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState("Leaves");
  const [loading,      setLoading]      = useState(true);
  const [leaves,       setLeaves]       = useState([]);
  const [balance,      setBalance]      = useState(null);
  const [holidays,     setHolidays]     = useState([]);
  const [calData,      setCalData]      = useState([]);
  const [calHolidays,  setCalHolidays]  = useState([]);
  const [encHistory,   setEncHistory]   = useState([]);
  const [calMonth,     setCalMonth]     = useState(new Date().getMonth() + 1);
  const [calYear,      setCalYear]      = useState(new Date().getFullYear());
  const [holYear,      setHolYear]      = useState(new Date().getFullYear());

  // filters
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");

  // modals
  const [showApply,    setShowApply]    = useState(false);
  const [showHoliday,  setShowHoliday]  = useState(false);
  const [confirm,      setConfirm]      = useState({ show: false, title: "", message: "", Icon: AlertTriangle, btnCls: "bg-indigo-600 hover:bg-indigo-700", label: "Confirm", onConfirm: null });

  // forms
  const [applyForm,    setApplyForm]    = useState(EMPTY_APPLY);
  const [holForm,      setHolForm]      = useState(EMPTY_HOLIDAY);
  const [saving,       setSaving]       = useState(false);
  const [encYear,      setEncYear]      = useState(new Date().getFullYear());

  // ── fetch leaves + balance ─────────────────────────────────────────────────
  const fetchLeaves = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [leaveRes, balRes] = await Promise.allSettled([
        isManager ? getAllLeaves() : getLeavesByEmployee(currentUserId),
        getLeaveBalance(currentUserId),
      ]);
      const raw = leaveRes.status === "fulfilled"
        ? (leaveRes.value?.data ?? leaveRes.value ?? [])
        : [];
      setLeaves(Array.isArray(raw) ? raw : []);
      if (balRes.status === "fulfilled") setBalance(balRes.value?.data ?? balRes.value);
    } catch { toast.error("Failed to load leaves"); }
    finally { setLoading(false); }
  }, [canView, isManager, currentUserId]);

  // ── fetch holidays ─────────────────────────────────────────────────────────
  const fetchHolidays = useCallback(async () => {
    try {
      const res = await getHolidays(holYear);
      const data = res?.data ?? res ?? [];
      setHolidays(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load holidays"); }
  }, [holYear]);

  // ── fetch calendar ─────────────────────────────────────────────────────────
  const fetchCalendar = useCallback(async () => {
    try {
      const res = await getLeaveCalendar(calMonth, calYear);
      const data = res?.data ?? res ?? [];
      setCalData(Array.isArray(data) ? data : []);
    } catch { setCalData([]); }
  }, [calMonth, calYear]);

  // ── fetch holidays for the calendar year (separate from Holidays tab) ───────
  const fetchCalHolidays = useCallback(async () => {
    try {
      const res = await getHolidays(calYear);
      const data = res?.data ?? res ?? [];
      setCalHolidays(Array.isArray(data) ? data : []);
    } catch { setCalHolidays([]); }
  }, [calYear]);

  // ── fetch encashment history ───────────────────────────────────────────────
  const fetchEncashment = useCallback(async () => {
    try {
      const res = await getEncashmentHistory(currentUserId);
      const data = res?.data ?? res ?? [];
      setEncHistory(Array.isArray(data) ? data : []);
    } catch { setEncHistory([]); }
  }, [currentUserId]);

  useEffect(() => { fetchLeaves(); },    [fetchLeaves]);
  useEffect(() => { fetchHolidays(); },  [fetchHolidays]);
  useEffect(() => {
    if (activeTab === "Calendar") { fetchCalendar(); fetchCalHolidays(); }
  }, [activeTab, fetchCalendar, fetchCalHolidays]);
  useEffect(() => { if (activeTab === "Encashment") fetchEncashment(); }, [activeTab, fetchEncashment]);

  // ── derived ────────────────────────────────────────────────────────────────
  const filteredLeaves = useMemo(() => {
    const q = search.toLowerCase();
    return leaves.filter(l => {
      const matchSearch =
        String(l.userId ?? l.employeeId ?? "").includes(q) ||
        (l.leaveType || "").toLowerCase().includes(q) ||
        (l.reason || "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "All" ||
        (l.status || "Pending").toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [leaves, search, statusFilter]);

  const stats = useMemo(() => ({
    total:    leaves.length,
    pending:  leaves.filter(l => (l.status || "").toLowerCase() === "pending").length,
    approved: leaves.filter(l => (l.status || "").toLowerCase() === "approved").length,
    rejected: leaves.filter(l => (l.status || "").toLowerCase() === "rejected").length,
  }), [leaves]);

  // balance fields — handle various response shapes
  const balanceInfo = useMemo(() => {
    if (!balance) return { remaining: "—", used: "—", total: "—" };
    const b = balance?.balance?.[0] ?? balance ?? {};
    return {
      remaining: b.remainingDays ?? b.remaining ?? "—",
      used:      b.usedDays      ?? b.used      ?? "—",
      total:     b.totalDays     ?? b.total      ?? "—",
    };
  }, [balance]);

  // Manager-added holidays for current calYear mapped by YYYY-MM-DD
  const managedHolidayMap = useMemo(() => {
    const map = {};
    calHolidays.forEach(h => {
      if (h.date) {
        const key = h.date.split("T")[0];
        map[key] = { name: h.name, type: h.type || "Optional" };
      }
    });
    return map;
  }, [calHolidays]);

  // ── confirm helper ─────────────────────────────────────────────────────────
  const ask = (title, message, onConfirm, opts = {}) =>
    setConfirm({ show: true, title, message, onConfirm,
      Icon: opts.Icon || AlertTriangle,
      btnCls: opts.btnCls || "bg-indigo-600 hover:bg-indigo-700",
      label: opts.label || "Confirm",
    });

  const closeConfirm = () => setConfirm(c => ({ ...c, show: false, onConfirm: null }));

  // ── apply leave ────────────────────────────────────────────────────────────
  const handleApply = async (e) => {
    e.preventDefault();
    const type = applyForm.useCustomType ? applyForm.customType.trim() : applyForm.leaveType;
    if (!type)              return toast.error("Leave type is required");
    if (!applyForm.startDate || !applyForm.endDate) return toast.error("Select start and end dates");
    if (new Date(applyForm.endDate) < new Date(applyForm.startDate))
                            return toast.error("End date must be after start date");
    if (!applyForm.reason.trim()) return toast.error("Reason is required");

    const days = daysBetween(applyForm.startDate, applyForm.endDate);
    ask(
      "Apply for Leave",
      `Submit ${type} leave for ${days} day(s) from ${fmt(applyForm.startDate)} to ${fmt(applyForm.endDate)}?`,
      async () => {
        setSaving(true);
        const tid = toast.loading("Submitting…");
        try {
          await applyLeave({
            userId:     currentUserId,
            leaveType:  type,
            startDate:  new Date(applyForm.startDate).toISOString(),
            endDate:    new Date(applyForm.endDate).toISOString(),
            reason:     applyForm.reason,
            status:     "Pending",
            approvedBY: "",
          });
          toast.success("Leave applied successfully", { id: tid });
          setShowApply(false);
          setApplyForm(EMPTY_APPLY);
          fetchLeaves();
        } catch { toast.error("Failed to apply leave", { id: tid }); }
        finally { setSaving(false); }
      },
      { Icon: Send, btnCls: "bg-indigo-600 hover:bg-indigo-700", label: "Submit Leave" }
    );
  };

  // ── approve / reject ───────────────────────────────────────────────────────
  const handleStatus = (leaveId, status) => {
    const isApprove = status === "Approved";
    ask(
      `${isApprove ? "Approve" : "Reject"} Leave`,
      `${isApprove ? "Approve" : "Reject"} this leave request?`,
      async () => {
        const tid = toast.loading("Updating…");
        try {
          await updateLeaveStatus(leaveId, { status, approvedBY: auth?.username || "" });
          toast.success(`Leave ${status}`, { id: tid });
          fetchLeaves();
        } catch { toast.error("Update failed", { id: tid }); }
      },
      {
        Icon: isApprove ? CheckCircle : XCircle,
        btnCls: isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
        label: isApprove ? "Approve" : "Reject",
      }
    );
  };

  // ── delete leave ───────────────────────────────────────────────────────────
  const handleDelete = (leaveId) => {
    ask(
      "Delete Leave",
      "Permanently delete this leave record?",
      async () => {
        const tid = toast.loading("Deleting…");
        try {
          await deleteLeave(leaveId);
          toast.success("Deleted", { id: tid });
          fetchLeaves();
        } catch { toast.error("Failed to delete", { id: tid }); }
      },
      { Icon: Trash2, btnCls: "bg-rose-600 hover:bg-rose-700", label: "Delete" }
    );
  };

  // ── add holiday ────────────────────────────────────────────────────────────
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holForm.name.trim()) return toast.error("Holiday name is required");
    if (!holForm.date)        return toast.error("Date is required");
    setSaving(true);
    const tid = toast.loading("Adding holiday…");
    try {
      await addHoliday({ name: holForm.name.trim(), date: new Date(holForm.date).toISOString(), type: holForm.type });
      toast.success("Holiday added", { id: tid });
      setShowHoliday(false);
      setHolForm(EMPTY_HOLIDAY);
      fetchHolidays();
    } catch { toast.error("Failed to add holiday", { id: tid }); }
    finally { setSaving(false); }
  };

  // ── delete holiday ─────────────────────────────────────────────────────────
  const handleDeleteHoliday = (h) => {
    ask(
      "Delete Holiday",
      `Delete holiday "${h.name}"?`,
      async () => {
        const tid = toast.loading("Deleting…");
        try {
          await deleteHoliday(h.id ?? h.holidayId);
          toast.success("Holiday deleted", { id: tid });
          fetchHolidays();
        } catch { toast.error("Failed to delete holiday", { id: tid }); }
      },
      { Icon: Trash2, btnCls: "bg-rose-600 hover:bg-rose-700", label: "Delete" }
    );
  };

  // ── request encashment ─────────────────────────────────────────────────────
  const handleEncashment = () => {
    ask(
      "Request Encashment",
      `Request leave encashment for ${auth?.username} for year ${encYear}?`,
      async () => {
        const tid = toast.loading("Requesting…");
        try {
          await requestEncashment(currentUserId, auth?.username || "", encYear);
          toast.success("Encashment requested", { id: tid });
          fetchEncashment();
        } catch { toast.error("Failed to request encashment", { id: tid }); }
      },
      { Icon: Coins, btnCls: "bg-emerald-600 hover:bg-emerald-700", label: "Request" }
    );
  };

  // ── guard ──────────────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center">
        <Lock className="w-10 h-10 text-slate-300 mb-3" />
        <h2 className="text-sm font-bold text-[var(--text-main)]">Access Restricted</h2>
        <p className="text-xs text-slate-400 mt-1">You don't have permission to view leaves.</p>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 text-[var(--text-main)]">
      <Toaster position="top-right" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Leave Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isManager ? "Manager view · all employees" : `Your personal leave dashboard`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLeaves}
            className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>
          {canApply && (
            <button onClick={() => { setApplyForm(EMPTY_APPLY); setShowApply(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> Apply Leave
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <StatCard icon={<Calendar   className="w-4 h-4"/>} label="Total Requests"  value={stats.total}           accent="indigo"  />
        <StatCard icon={<Clock      className="w-4 h-4"/>} label="Pending"         value={stats.pending}         accent="amber"   />
        <StatCard icon={<CheckCircle className="w-4 h-4"/>} label="Approved"       value={stats.approved}        accent="emerald" />
        <StatCard icon={<XCircle    className="w-4 h-4"/>} label="Rejected"        value={stats.rejected}        accent="rose"    />
        <StatCard icon={<Wallet     className="w-4 h-4"/>} label="Balance Left"    value={balanceInfo.remaining} accent="violet"  />
        <StatCard icon={<CalendarDays className="w-4 h-4"/>} label="Days Used"     value={balanceInfo.used}      accent="blue"    />
        <StatCard icon={<Umbrella   className="w-4 h-4"/>} label="Holidays"        value={holidays.length}       accent="teal"    />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[var(--bg-body)] p-1 rounded-xl border border-[var(--border-color)] w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === t
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-[var(--text-main)]"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: LEAVES                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "Leaves" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search…" value={search}
                onChange={e => setSearch(e.target.value)}
                className={inputCls + " pl-8 w-48"} />
            </div>

            {/* Status pill buttons */}
            <div className="flex items-center gap-1">
              {[
                { label: "All",         value: "All",         count: stats.total,    active: "bg-slate-700 text-white",   inactive: "bg-[var(--bg-card)] text-slate-400 border border-[var(--border-color)]" },
                { label: "Pending",     value: "Pending",     count: stats.pending,  active: "bg-amber-500 text-white",   inactive: "bg-amber-50 text-amber-600 border border-amber-200" },
                { label: "Approved",    value: "Approved",    count: stats.approved, active: "bg-emerald-600 text-white", inactive: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
                { label: "Rejected",    value: "Rejected",    count: stats.rejected, active: "bg-rose-600 text-white",    inactive: "bg-rose-50 text-rose-600 border border-rose-200" },
              ].map(({ label, value, count, active, inactive }) => (
                <button key={value} onClick={() => setStatusFilter(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === value ? active : inactive}`}>
                  {label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${statusFilter === value ? "bg-white/20" : "bg-[var(--bg-body)]"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {search && (
              <button onClick={() => setSearch("")}
                className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Clear search
              </button>
            )}
            <span className="text-xs text-slate-400 ml-auto">{filteredLeaves.length} record{filteredLeaves.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                    {[
                      isManager && "Employee",
                      "Type", "Duration", "Days", "Reason", "Status", "Approved By", "Actions"
                    ].filter(Boolean).map(h => (
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
                  ) : filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No leave records found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map(l => {
                      const sl = (l.status || "Pending").toLowerCase();
                      const canAct = isManager && (sl === "pending" || sl.includes("progress"));
                      const canDel = canDelete && (isManager || (Number(l.userId ?? l.employeeId) === currentUserId && sl === "pending"));
                      return (
                        <tr key={l.leaveId} className="hover:bg-[var(--bg-body)] transition-colors">
                          {isManager && (
                            <td className="px-4 py-3">
                              <span className="text-xs font-semibold text-[var(--text-main)]">UID {l.userId ?? l.employeeId ?? "—"}</span>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                              {l.leaveType || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-slate-500 space-y-0.5">
                              <div>{fmt(l.startDate)}</div>
                              <div className="text-[10px] text-slate-400">→ {fmt(l.endDate)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold text-[var(--text-main)]">
                              {daysBetween(l.startDate, l.endDate)}d
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[160px]">
                            <p className="text-xs text-slate-500 truncate" title={l.reason}>{l.reason || "—"}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(l.status)}`}>
                              {l.status || "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">{l.approvedBY || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {canAct && (
                                <>
                                  <Tip text="Approve">
                                    <button onClick={() => handleStatus(l.leaveId, "Approved")}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </Tip>
                                  <Tip text="Reject">
                                    <button onClick={() => handleStatus(l.leaveId, "Rejected")}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </Tip>
                                </>
                              )}
                              {canDel && (
                                <Tip text="Delete">
                                  <button onClick={() => handleDelete(l.leaveId)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </Tip>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: HOLIDAYS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "Holidays" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Year:</label>
              <input type="number" value={holYear} onChange={e => setHolYear(Number(e.target.value))}
                className={inputCls + " w-24"} />
              <button onClick={fetchHolidays}
                className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-slate-400 hover:text-indigo-500 transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            {isManager && (
              <button onClick={() => { setHolForm(EMPTY_HOLIDAY); setShowHoliday(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all">
                <Plus className="w-4 h-4" /> Add Holiday
              </button>
            )}
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                    {["Holiday Name", "Date", "Day", "Type", isManager && "Actions"].filter(Boolean).map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <Umbrella className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No holidays for {holYear}</p>
                      </td>
                    </tr>
                  ) : (
                    holidays.map(h => (
                      <tr key={h.id ?? h.holidayId} className="hover:bg-[var(--bg-body)] transition-colors">
                        <td className="px-4 py-3 font-semibold text-[var(--text-main)]">{h.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmt(h.date)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {h.date ? new Date(h.date).toLocaleDateString("en-IN", { weekday: "long" }) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            h.type === "National" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                            h.type === "Optional" ? "bg-amber-100  text-amber-700  border-amber-200"  :
                                                    "bg-slate-100  text-slate-600  border-slate-200"
                          }`}>{h.type || "National"}</span>
                        </td>
                        {isManager && (
                          <td className="px-4 py-3">
                            <Tip text="Delete Holiday">
                              <button onClick={() => handleDeleteHoliday(h)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Tip>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: CALENDAR                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "Calendar" && (() => {
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const firstDow    = new Date(calYear, calMonth - 1, 1).getDay();
        const startOffset = (firstDow + 6) % 7; // Mon-first
        const totalCells  = Math.ceil((startOffset + daysInMonth) / 7) * 7;
        const todayStr    = new Date().toISOString().split("T")[0];
        const DAY_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

        const dotCls = (status = "") => {
          const s = status.toLowerCase();
          if (s === "approved") return "bg-emerald-500";
          if (s === "rejected") return "bg-rose-500";
          return "bg-amber-400";
        };

        return (
          <div className="space-y-2">
            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Month navigator */}
              <div className="flex items-center gap-0.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden">
                <button
                  onClick={() => { const d = new Date(calYear, calMonth - 2); setCalMonth(d.getMonth() + 1); setCalYear(d.getFullYear()); }}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/60 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-[var(--text-main)] px-3 min-w-[130px] text-center border-x border-[var(--border-color)]">
                  {new Date(calYear, calMonth - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => { const d = new Date(calYear, calMonth); setCalMonth(d.getMonth() + 1); setCalYear(d.getFullYear()); }}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/60 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Legend + refresh */}
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { color: "bg-rose-400",    label: "Public Holiday" },
                  { color: "bg-amber-400",   label: "Company Holiday" },
                  { color: "bg-emerald-500", label: "Approved Leave" },
                  { color: "bg-amber-500",   label: "Pending Leave" },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${color}`} />{label}
                  </span>
                ))}
                <button
                  onClick={() => { fetchCalendar(); fetchCalHolidays(); }}
                  className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-slate-400 hover:text-indigo-500 transition-all">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ── Calendar Card ── */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                {DAY_LABELS.map((d, i) => (
                  <div key={d} className={`py-1.5 text-center text-[9px] font-black uppercase tracking-widest ${i === 6 ? "text-rose-400" : "text-slate-400"}`}>{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNum   = idx - startOffset + 1;
                  const isValid  = dayNum >= 1 && dayNum <= daysInMonth;
                  const colIndex = idx % 7; // 0=Mon … 6=Sun
                  const isSunday = colIndex === 6;
                  const isSat    = colIndex === 5;
                  const isLastRow = idx >= totalCells - 7;

                  if (!isValid) {
                    return (
                      <div key={`e-${idx}`}
                        className={`h-[58px] border-r border-b border-[var(--border-color)]/20 bg-[var(--bg-body)]/30 ${isLastRow ? "border-b-0" : ""} ${colIndex === 6 ? "border-r-0" : ""}`}
                      />
                    );
                  }

                  const mm          = String(calMonth).padStart(2, "0");
                  const dd          = String(dayNum).padStart(2, "0");
                  const dateStr     = `${calYear}-${mm}-${dd}`;
                  const isToday     = dateStr === todayStr;
                  const pubName     = getPublicHolidayName(calYear, calMonth, dayNum);
                  const managed     = managedHolidayMap[dateStr];
                  const isPublicHol = !!pubName && !managed;
                  const isManagedHol= !!managed;
                  const holidayName = managed?.name || pubName;
                  const dayLeaves   = calData.filter(l => isDateInRange(dateStr, l.startDate, l.endDate));

                  return (
                    <div key={dateStr}
                      className={`h-[58px] border-r border-b border-[var(--border-color)]/20 p-1 flex flex-col overflow-hidden relative group transition-colors
                        ${isLastRow     ? "border-b-0" : ""}
                        ${colIndex === 6 ? "border-r-0" : ""}
                        ${isPublicHol   ? "bg-rose-50/80"   : ""}
                        ${isManagedHol  ? "bg-amber-50/80"  : ""}
                        ${!isPublicHol && !isManagedHol && (isSunday || isSat) ? "bg-slate-50/40" : ""}
                        ${!isPublicHol && !isManagedHol && !isSunday && !isSat ? "hover:bg-indigo-50/30" : ""}
                      `}
                    >
                      {/* Day number */}
                      <div className="flex items-start justify-between">
                        <span className={`text-[11px] font-black w-[22px] h-[22px] flex items-center justify-center rounded-full leading-none
                          ${isToday      ? "bg-indigo-600 text-white shadow-sm"  :
                            isPublicHol  ? "text-rose-600 font-black"            :
                            isManagedHol ? "text-amber-700 font-black"           :
                            isSunday     ? "text-rose-400"                       :
                                           "text-[var(--text-main)]"}
                        `}>{dayNum}</span>
                      </div>

                      {/* Holiday name */}
                      {holidayName && (
                        <span
                          title={holidayName}
                          className={`text-[7px] font-bold truncate leading-none px-1 py-0.5 rounded mt-0.5
                            ${isManagedHol ? "text-amber-700 bg-amber-100" : "text-rose-700 bg-rose-100"}
                          `}>
                          {holidayName}
                        </span>
                      )}

                      {/* Leave dots row */}
                      {dayLeaves.length > 0 && (
                        <div className="flex items-center gap-0.5 mt-auto flex-wrap">
                          {dayLeaves.slice(0, 4).map((l, li) => (
                            <span
                              key={li}
                              title={`${l.userName || l.username || `UID${l.userId}`} · ${l.leaveType || ""} · ${l.status || ""}`}
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls(l.status)}`}
                            />
                          ))}
                          {dayLeaves.length > 4 && (
                            <span className="text-[7px] text-slate-400 leading-none">+{dayLeaves.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Summary bar ── */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-slate-400 font-medium">
                {Object.keys(managedHolidayMap).filter(d => d.startsWith(`${calYear}-${String(calMonth).padStart(2,"0")}`)).length +
                 Array.from({length: daysInMonth}, (_, i) => getPublicHolidayName(calYear, calMonth, i+1)).filter(Boolean).length
                } holiday(s) · {calData.length} leave record(s) this month
              </p>
              <p className="text-[10px] text-slate-300">{calYear}</p>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: ENCASHMENT                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "Encashment" && (
        <div className="space-y-3">
          {/* Request encashment card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-500" /> Request Leave Encashment
            </h3>
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Employee</label>
                <input type="text" disabled value={`${auth?.username || "—"} (UID ${currentUserId})`}
                  className={inputCls + " w-48 opacity-60 cursor-not-allowed"} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Year</label>
                <input type="number" value={encYear}
                  onChange={e => setEncYear(Number(e.target.value))}
                  className={inputCls + " w-24"} />
              </div>
              <button onClick={handleEncashment}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5">
                <Coins className="w-4 h-4" /> Request Encashment
              </button>
              <button onClick={fetchEncashment}
                className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-slate-400 hover:text-indigo-500 transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-body)]">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Encashment History</p>
            </div>
            {encHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Coins className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No encashment history found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                      {["Year", "Days", "Amount", "Status", "Requested On"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {encHistory.map((e, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-body)] transition-colors">
                        <td className="px-4 py-3 font-semibold text-[var(--text-main)]">{e.year ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{e.days ?? e.encashedDays ?? "—"}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-emerald-600">
                          {e.amount != null ? `₹${Number(e.amount).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(e.status)}`}>
                            {e.status || "Requested"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmt(e.requestedOn ?? e.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Apply Leave Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showApply && (
          <Overlay onClose={() => setShowApply(false)}>
            <ModalCard title="Apply for Leave" icon={<Send className="w-4 h-4 text-indigo-500" />} onClose={() => setShowApply(false)} small>
              <form onSubmit={handleApply} className="space-y-2 mt-2">
                <Field label="Leave Type *">
                  <div className="flex gap-2">
                    <select
                      value={applyForm.useCustomType ? "Other" : applyForm.leaveType}
                      onChange={e => e.target.value === "Other"
                        ? setApplyForm(f => ({ ...f, useCustomType: true, leaveType: "" }))
                        : setApplyForm(f => ({ ...f, useCustomType: false, leaveType: e.target.value, customType: "" }))
                      }
                      className={inputCls}>
                      {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="Other">Other (specify)</option>
                    </select>
                    {applyForm.useCustomType && (
                      <input type="text" placeholder="Enter type…" value={applyForm.customType}
                        onChange={e => setApplyForm(f => ({ ...f, customType: e.target.value }))}
                        className={inputCls} />
                    )}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Start Date *">
                    <input type="date" value={applyForm.startDate}
                      onChange={e => setApplyForm(f => ({ ...f, startDate: e.target.value }))}
                      className={inputCls} />
                  </Field>
                  <Field label="End Date *">
                    <input type="date" value={applyForm.endDate}
                      onChange={e => setApplyForm(f => ({ ...f, endDate: e.target.value }))}
                      className={inputCls} />
                  </Field>
                </div>
                {applyForm.startDate && applyForm.endDate && (
                  <p className="text-[11px] text-indigo-500 font-medium">
                    Duration: {daysBetween(applyForm.startDate, applyForm.endDate)} day(s)
                  </p>
                )}
                <Field label="Reason *">
                  <textarea rows={2} value={applyForm.reason}
                    onChange={e => setApplyForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Briefly state your reason…"
                    className={inputCls + " resize-none"} />
                </Field>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowApply(false)}
                    className="flex-1 py-1.5 text-xs text-slate-500 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />} Review & Submit
                  </button>
                </div>
              </form>
            </ModalCard>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── Add Holiday Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHoliday && (
          <Overlay onClose={() => setShowHoliday(false)}>
            <ModalCard title="Add Holiday" icon={<Umbrella className="w-4 h-4 text-indigo-500" />} onClose={() => setShowHoliday(false)} small>
              <form onSubmit={handleAddHoliday} className="space-y-3 mt-3">
                <Field label="Holiday Name *">
                  <input type="text" value={holForm.name}
                    onChange={e => setHolForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Diwali" className={inputCls} />
                </Field>
                <Field label="Date *">
                  <input type="date" value={holForm.date}
                    onChange={e => setHolForm(f => ({ ...f, date: e.target.value }))}
                    className={inputCls} />
                </Field>
                <Field label="Type">
                  <select value={holForm.type}
                    onChange={e => setHolForm(f => ({ ...f, type: e.target.value }))}
                    className={inputCls}>
                    {HOLIDAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowHoliday(false)}
                    className="flex-1 py-2 text-sm text-slate-500 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add Holiday
                  </button>
                </div>
              </form>
            </ModalCard>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── Confirm Popup ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeConfirm}>
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
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <confirm.Icon className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-sm text-[var(--text-main)] leading-relaxed">{confirm.message}</p>
                <div className="flex gap-2">
                  <button onClick={closeConfirm}
                    className="flex-1 py-2.5 text-sm text-slate-500 border border-[var(--border-color)] bg-[var(--bg-body)] rounded-xl hover:bg-[var(--bg-card)] transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => { confirm.onConfirm && confirm.onConfirm(); closeConfirm(); }}
                    className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl ${confirm.btnCls} active:scale-95 transition-all`}>
                    {confirm.label}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-body)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors";

const ACCENT_MAP = {
  indigo:  "bg-indigo-500/10  text-indigo-500",
  amber:   "bg-amber-500/10   text-amber-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  rose:    "bg-rose-500/10    text-rose-500",
  violet:  "bg-violet-500/10  text-violet-500",
  blue:    "bg-blue-500/10    text-blue-500",
  teal:    "bg-teal-500/10    text-teal-500",
};

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 flex items-center gap-2 hover:border-indigo-400/50 transition-all shadow-sm">
      <div className={`p-1.5 rounded-lg flex-shrink-0 ${ACCENT_MAP[accent]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide truncate leading-tight">{label}</p>
        <p className="text-base font-bold text-[var(--text-main)] leading-tight">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      {children}
    </div>
  );
}

function ModalCard({ title, icon, onClose, children, small = false }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`bg-[var(--bg-card)] w-full ${small ? "max-w-sm" : "max-w-md"} rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden`}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-body)]">
        <h2 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">{icon}{title}</h2>
        <button onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
    </motion.div>
  );
}
