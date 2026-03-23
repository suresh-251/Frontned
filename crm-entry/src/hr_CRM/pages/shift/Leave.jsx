import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar, X, Plus, Loader2, CheckCircle, XCircle, Trash2,
  Search, Send, AlertTriangle, Wallet, Umbrella, Filter, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ✅ CONFIG & AUTH IMPORTS
import { hasPermission, getAuthDetails } from "../../configs/auth.utils";
import PermissionGate from "../../configs/Gaurd/PermissionsGate";

import {
  getAllLeaves, applyLeave, updateLeaveStatus,
  deleteLeave, getLeaveBalance, getHolidays
} from "../../api/LeaveService";

const PRESET_TYPES = ["Sick", "Casual", "Earned"];

export default function Leave() {
  const [leaves,   setLeaves]   = useState([]);
  const [balance,  setBalance]  = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

  // ✅ PERMISSION LOGIC
  const canView   = hasPermission("LEAVE_VIEW");
  const canApply  = hasPermission("LEAVE_APPLY");
  const canDelete = hasPermission("LEAVE_DELETE");

  // Current logged-in user from JWT
  const currentUser   = getAuthDetails();
  const currentUserId = Number(currentUser?.userId);

  // Manager check via role — both HR_MANAGER and HR_USER share LEAVE_UPDATE,
  // so role is the only reliable way to gate approve/reject and see-all-leaves.
  const isManager = currentUser?.isAdmin || currentUser?.role === "HR_MANAGER";

  const [formData, setFormData] = useState({
    leaveType: "Sick",
    customType: "",
    useCustomType: false,
    startDate: "",
    endDate: "",
    reason: "",
  });

  // ── DATA LOAD ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const [leaveRes, balanceRes, holidayRes] = await Promise.allSettled([
        getAllLeaves(),
        getLeaveBalance(currentUserId),
        getHolidays(year),
      ]);

      const allLeaves = leaveRes.status === "fulfilled"
        ? (leaveRes.value?.data ?? leaveRes.value ?? [])
        : [];

      // MANAGER sees all; HR_USER sees only their own
      const safeLeaves = Array.isArray(allLeaves) ? allLeaves : [];
      setLeaves(
        isManager
          ? safeLeaves
          : safeLeaves.filter(l => Number(l.userId ?? l.employeeId) === currentUserId)
      );

      if (balanceRes.status === "fulfilled") setBalance(balanceRes.value?.data ?? balanceRes.value);
      if (holidayRes.status === "fulfilled") setHolidays(holidayRes.value?.data ?? holidayRes.value ?? []);
    } catch (err) {
      if (err?.response?.status !== 403) toast.error("Registry Sync Error");
    } finally {
      setLoading(false);
    }
  }, [canView, isManager, currentUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── APPLY ───────────────────────────────────────────────────────────────────
  const handleApply = async (e) => {
    e.preventDefault();
    if (!canApply) return toast.error("Unauthorized");

    const resolvedType = formData.useCustomType
      ? formData.customType.trim()
      : formData.leaveType;

    if (!resolvedType) return toast.error("Please enter a leave type");

    const tid = toast.loading("Processing...");
    try {
      await applyLeave({
        userId:    currentUserId,
        leaveType: resolvedType,
        startDate: new Date(formData.startDate).toISOString(),
        endDate:   new Date(formData.endDate).toISOString(),
        reason:    formData.reason,
        status:    "Pending",
        approvedBY: "",
      });
      toast.success("Leave applied successfully.", { id: tid });
      setShowApplyModal(false);
      setFormData({ leaveType: "Sick", customType: "", useCustomType: false, startDate: "", endDate: "", reason: "" });
      fetchData();
    } catch { toast.error("Routing Error", { id: tid }); }
  };

  // ── APPROVE / REJECT ────────────────────────────────────────────────────────
  const handleStatusUpdate = async (leaveId, status) => {
    if (!isManager) return toast.error("Unauthorized");
    const tid = toast.loading("Updating...");
    try {
      await updateLeaveStatus(leaveId, { status, approvedBY: currentUser?.username });
      toast.success(`Leave ${status}`, { id: tid });
      fetchData();
    } catch { toast.error("Action Failed", { id: tid }); }
  };

  // ── FILTER ──────────────────────────────────────────────────────────────────
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchesSearch =
        l.userId?.toString().includes(searchTerm) ||
        l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase());
      const cur    = (l.status || "").toLowerCase().trim();
      const target = statusFilter.toLowerCase();
      const matchesStatus =
        target === "all" ||
        (target === "inprogress"
          ? cur === "inprogress" || cur === "in progress"
          : cur === target);
      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchTerm, statusFilter]);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">Leave clearance required</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3 p-2 font-sans text-[var(--text-main)] h-[92vh] flex flex-col overflow-hidden transition-all duration-300">
      <Toaster position="top-right" />

      {/* CONFIRMATION */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-[280px] rounded-2xl p-6 border border-[var(--border-color)] text-center shadow-2xl">
              <AlertTriangle size={32} className="text-amber-500 mx-auto mb-4" />
              <h3 className="text-[12px] font-black uppercase text-[var(--text-main)] mb-1">{confirm.title}</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-6 leading-tight">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ show: false })} className="flex-1 py-2 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[10px] font-black border border-[var(--border-color)]">NO</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ show: false }); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg">YES</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUMMARY */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <SummaryCard icon={<Wallet size={18} className="text-emerald-500" />}  label="Available Balance" value={balance?.balance?.[0]?.remainingDays || "0"} />
        <SummaryCard icon={<Umbrella size={18} className="text-indigo-500" />} label="Holidays"           value={holidays.length} />
        <SummaryCard icon={<Calendar size={18} className="text-amber-500" />}  label="My Applications"   value={leaves.length} />
        <div className="flex items-center justify-end">
          <PermissionGate permission="LEAVE_APPLY">
            <button
              onClick={() => setShowApplyModal(true)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={14} strokeWidth={3} /> Apply Leave
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <h2 className="text-lg font-black uppercase tracking-tighter text-indigo-600">Leave Terminal</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-6 pr-2 py-1 text-[9px] font-black uppercase outline-none text-[var(--text-main)]"
            >
              <option value="pending">Pending</option>
              <option value="inprogress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">View All</option>
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input
              type="text" placeholder="ID / TYPE..."
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-8 pr-2 py-1 text-[9px] font-black w-40 uppercase outline-none text-[var(--text-main)]"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex-1 flex flex-col overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)] sticky top-0 z-10">
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-5 py-3 w-36">User Identity</th>
              <th className="px-5 py-3 w-28">Leave Type</th>
              <th className="px-5 py-3 text-center w-56">Duration</th>
              <th className="px-5 py-3 w-48">Reason</th>
              <th className="px-5 py-3 text-center w-28">Status</th>
              <th className="px-5 py-3 w-40">Approved By</th>
              {(isManager || canDelete) && <th className="px-5 py-3 text-right w-32">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30 bg-[var(--bg-card)]">
            {!loading && filteredLeaves.map((l) => {
              const statusLower = (l.status || "").toLowerCase();
              return (
                <tr key={l.leaveId} className="hover:bg-indigo-500/5 transition-colors text-[11px]">
                  <td className="px-5 py-2.5">
                    <p className="font-black text-[var(--text-main)] uppercase leading-none">UID: {l.userId ?? l.employeeId}</p>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">{l.leaveType}</span>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
                      <span className="bg-[var(--bg-body)] px-2 py-0.5 rounded border border-[var(--border-color)]">{new Date(l.startDate).toLocaleDateString()}</span>
                      <span className="opacity-30">→</span>
                      <span className="bg-[var(--bg-body)] px-2 py-0.5 rounded border border-[var(--border-color)]">{new Date(l.endDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <p className="text-[10px] font-bold text-slate-500 truncate max-w-[180px]" title={l.reason || "—"}>
                      {l.reason || <span className="text-slate-300 italic">—</span>}
                    </p>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={`px-2 py-1 rounded border font-black text-[8px] uppercase tracking-widest ${
                      statusLower === "approved"            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      statusLower === "rejected"            ? "bg-rose-500/10    text-rose-500    border-rose-500/20"    :
                      statusLower === "pending"             ? "bg-amber-500/10   text-amber-600   border-amber-500/20"   :
                      statusLower.includes("progress")     ? "bg-indigo-500/10  text-indigo-600  border-indigo-500/20"  :
                                                             "bg-slate-500/10   text-slate-500   border-slate-500/20"
                    }`}>{l.status || "Pending"}</span>
                  </td>
                  <td className="px-5 py-2.5 font-black uppercase text-slate-400 text-[10px] truncate">
                    {l.approvedBY || "---"}
                  </td>
                  {(isManager || canDelete) && (
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        {/* Approve / Reject — HR_MANAGER only */}
                        {isManager && (statusLower === "pending" || statusLower.includes("progress")) && (
                          <>
                            <button
                              onClick={() => setConfirm({ show: true, title: "Approve", message: "Approve this leave?", onConfirm: () => handleStatusUpdate(l.leaveId, "Approved") })}
                              className="p-1 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500 hover:text-white transition-all"
                            ><CheckCircle size={15} /></button>
                            <button
                              onClick={() => setConfirm({ show: true, title: "Reject", message: "Reject this leave?", onConfirm: () => handleStatusUpdate(l.leaveId, "Rejected") })}
                              className="p-1 bg-rose-500/10 text-rose-600 rounded hover:bg-rose-500 hover:text-white transition-all"
                            ><XCircle size={15} /></button>
                          </>
                        )}
                        {/* Delete — manager always; HR_USER only their own Pending */}
                        {canDelete && (isManager || (Number(l.userId ?? l.employeeId) === currentUserId && statusLower === "pending")) && (
                          <button
                            onClick={() => setConfirm({ show: true, title: "Delete", message: "Delete this record?", onConfirm: () => deleteLeave(l.leaveId).then(fetchData) })}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          ><Trash2 size={15} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center bg-[var(--bg-card)]"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>}
        {!loading && filteredLeaves.length === 0 && (
          <div className="p-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No records found</div>
        )}
      </div>

      {/* APPLY MODAL */}
      <AnimatePresence>
        {showApplyModal && canApply && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowApplyModal(false)}>
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-3 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><Send size={14} /> Submit Request</h3>
                <X size={20} className="text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => setShowApplyModal(false)} />
              </div>

              <form onSubmit={handleApply} className="p-5 space-y-2.5 bg-[var(--bg-card)]">

                {/* USER ID — locked */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <Lock size={9} /> User ID
                    </label>
                    <input
                      type="text" disabled
                      value={`#${currentUserId}`}
                      className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <Lock size={9} /> Username
                    </label>
                    <input
                      type="text" disabled
                      value={currentUser?.username || "User"}
                      className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* LEAVE TYPE — preset select + custom text input */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Type</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none focus:ring-1 focus:ring-indigo-500"
                      value={formData.useCustomType ? "Other" : formData.leaveType}
                      onChange={e => {
                        if (e.target.value === "Other") {
                          setFormData({ ...formData, useCustomType: true, leaveType: "" });
                        } else {
                          setFormData({ ...formData, useCustomType: false, leaveType: e.target.value, customType: "" });
                        }
                      }}
                    >
                      {PRESET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="Other">Other (Specify)</option>
                    </select>
                    {formData.useCustomType && (
                      <input
                        type="text"
                        required
                        placeholder="ENTER TYPE..."
                        value={formData.customType}
                        onChange={e => setFormData({ ...formData, customType: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-[var(--bg-body)] border border-indigo-500/50 rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                      />
                    )}
                  </div>
                </div>

                {/* DATES */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Start</label>
                    <input
                      required type="date"
                      className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none"
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">End</label>
                    <input
                      required type="date"
                      className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none"
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* REASON */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Reason</label>
                  <textarea
                    required rows="2"
                    className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none resize-none"
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all mt-1">
                  Log Application
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SummaryCard = ({ icon, label, value }) => (
  <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-[var(--bg-body)] flex items-center justify-center border border-[var(--border-color)]/50">{icon}</div>
    <div>
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[13px] font-black text-[var(--text-main)]">{value}</p>
    </div>
  </div>
);
