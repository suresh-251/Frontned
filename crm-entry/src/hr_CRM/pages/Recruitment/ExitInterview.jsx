import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getAllExitInterviews, scheduleExitInterview,
  deleteExitInterview, updateExitInterview,
} from "../../api/hr.exitInterview";
import { getAdminUsers } from "../../../api/admin/users.api";
import { hasPermission, getAuthDetails } from "../../configs/auth.utils";
import {
  LogOut, Loader2, X, Search, Edit3, Trash2, UserPlus, AlertTriangle, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const ACTIVE_STATUSES = ["Scheduled", "InProgress"];

export default function ExitInterview() {
  // ── Auth (same pattern as PayRoll.jsx) ───────────────────────────────────
  const authDetails  = useMemo(() => getAuthDetails(), []);
  const userId       = authDetails?.userId ? Number(authDetails.userId) : null;
  const isManager    = !!(authDetails?.isAdmin || authDetails?.role === "HR_MANAGER");

  const canView      = () => hasPermission("EXITINTERVIEW_VIEW");
  const canSchedule  = () => hasPermission("EXITINTERVIEW_SCHEDULE");

  // ── State ─────────────────────────────────────────────────────────────────
  const [interviews, setInterviews]     = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [selectedView, setSelectedView] = useState(null);
  const [editRecord, setEditRecord]     = useState(null);
  const [tableSearch, setTableSearch]   = useState("");
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [confirm, setConfirm] = useState({ show: false, message: "", onConfirm: null });
  const [formData, setFormData] = useState({ userId: "", scheduledDate: "", reasonForLeaving: "" });

  // ── Fetch (same pattern as PayRoll.jsx) ──────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isManager) {
        // HR_MANAGER / ADMIN — fetch all employees + all records
        const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
        let empData = [];
        if (empRes?.users && Array.isArray(empRes.users)) empData = empRes.users;
        else if (Array.isArray(empRes)) empData = empRes;
        setEmployees(empData);

        const res  = await getAllExitInterviews();
        const data = res?.data || res || [];
        setInterviews(Array.isArray(data) ? data : []);
      } else {
        // HR_USER — fetch all then filter to logged-in user
        if (!userId) { setLoading(false); return; }
        const res  = await getAllExitInterviews();
        const all  = res?.data || res || [];
        const mine = Array.isArray(all)
          ? all.filter(r => Number(r.userId) === userId)
          : [];
        setInterviews(mine);
      }
    } catch {
      toast.error("Failed to load exit interview data");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [isManager, userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Deduplication ─────────────────────────────────────────────────────────
  // Per userId: if any active record exists show only active ones,
  // otherwise show only the most recent (highest id).
  const deduplicatedInterviews = useMemo(() => {
    const grouped = {};
    interviews.forEach(item => {
      const key = String(item.userId);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    const result = [];
    Object.values(grouped).forEach(items => {
      const active = items.filter(i => ACTIVE_STATUSES.includes(i.status));
      if (active.length > 0) {
        result.push(...active);
      } else {
        const latest = items.reduce((a, b) => (b.id > a.id ? b : a));
        result.push(latest);
      }
    });
    return result;
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    const q = tableSearch.toLowerCase();
    return deduplicatedInterviews.filter(item => {
      const emp = employees.find(e => Number(e.userId) === Number(item.userId));
      return (emp?.username || "").toLowerCase().includes(q) ||
             item.userId?.toString().includes(q);
    });
  }, [deduplicatedInterviews, employees, tableSearch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateSchedule = async () => {
    const alreadyActive = interviews.find(
      i => Number(i.userId) === Number(formData.userId) && ACTIVE_STATUSES.includes(i.status)
    );
    if (alreadyActive) {
      toast.error("An active exit interview already exists for this user");
      return;
    }
    const tid = toast.loading("Processing...");
    try {
      await scheduleExitInterview({
        userId: Number(formData.userId),
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        reasonForLeaving: String(formData.reasonForLeaving).trim(),
      });
      toast.success("Scheduled", { id: tid });
      setShowModal(false);
      setFormData({ userId: "", scheduledDate: "", reasonForLeaving: "" });
      fetchData();
    } catch { toast.error("Submission Failed", { id: tid }); }
  };

  const handleDelete = async (id) => {
    const tid = toast.loading("Deleting...");
    try {
      await deleteExitInterview(id);
      toast.success("Deleted", { id: tid });
      fetchData();
    } catch { toast.error("Delete Failed", { id: tid }); }
  };

  const handleUpdateProcess = async (status) => {
    const tid = toast.loading("Updating...");
    try {
      await updateExitInterview(editRecord.id, { ...editRecord, status });
      toast.success("Updated", { id: tid });
      setEditRecord(null);
      fetchData();
    } catch { toast.error("Update Failed", { id: tid }); }
  };

  // ── Permission gate ───────────────────────────────────────────────────────
  if (!canView()) {
    return (
      <div className="max-w-7xl mx-auto p-2 font-sans text-[var(--text-main)] h-[92vh] flex items-center justify-center">
        <p className="text-[11px] font-black uppercase text-slate-400">Access Denied</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-3 p-2 font-sans text-[var(--text-main)] h-[92vh] flex flex-col overflow-hidden transition-all">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <h2 className="text-xl font-black uppercase flex items-center gap-2 tracking-tight">
          <LogOut size={22} className="text-rose-600" /> Exit Terminal
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input
              type="text"
              placeholder="FILTER LOGS..."
              onChange={(e) => setTableSearch(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-8 pr-2 py-1 text-[9px] font-black w-48 uppercase outline-none focus:border-rose-500"
            />
          </div>
          {canSchedule() && (
            <button
              onClick={() => { setShowModal(true); setEmpSearchQuery(""); setFormData({ userId: "", scheduledDate: "", reasonForLeaving: "" }); }}
              className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
            >+ Schedule</button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex-1 flex flex-col overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-4 py-2 w-16 text-center">ID</th>
              <th className="px-4 py-2 w-20 text-center">User ID</th>
              <th className="px-4 py-2 w-48">Username</th>
              <th className="px-4 py-2 w-auto">Reason</th>
              <th className="px-4 py-2 w-32 text-center">Status</th>
              <th className="px-4 py-2 w-28 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30 bg-[var(--bg-card)]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <Loader2 className="animate-spin mx-auto text-rose-500" />
                </td>
              </tr>
            ) : filteredInterviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-[10px] font-black uppercase text-slate-400">
                  No Records
                </td>
              </tr>
            ) : filteredInterviews.map((item) => {
              const emp = employees.find(e => Number(e.userId) === Number(item.userId));
              return (
                <tr key={item.id} className="hover:bg-rose-500/5 transition-colors">
                  <td className="px-4 py-2 text-center font-bold text-slate-400 text-[11px]">#{item.id}</td>
                  <td className="px-4 py-2 text-center font-black text-rose-500 text-[11px]">#{item.userId}</td>
                  <td className="px-4 py-2 font-black uppercase text-[11px] truncate text-[var(--text-main)]">
                    {emp?.username || `User #${item.userId}`}
                  </td>
                  <td className="px-4 py-2 text-slate-500 italic truncate text-[11px] font-medium">
                    {item.reasonForLeaving || "---"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded border font-black text-[8px] uppercase ${
                      item.status === "Completed"  ? "bg-emerald-500/10 text-emerald-500 border-emerald-200" :
                      item.status === "InProgress" ? "bg-amber-500/10 text-amber-500 border-amber-200" :
                      item.status === "Cancelled"  ? "bg-slate-500/10 text-slate-400 border-slate-200" :
                                                     "bg-rose-500/10 text-rose-600 border-rose-200"
                    }`}>{item.status || "Scheduled"}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setSelectedView({ ...item, username: emp?.username || `User #${item.userId}` })}
                        className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-400 hover:text-rose-500 transition-all"
                      ><Eye size={13} /></button>
                      {canSchedule() && (
                        <>
                          <button
                            onClick={() => setEditRecord({ ...item, username: emp?.username })}
                            className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-indigo-400 hover:text-indigo-600 transition-all"
                          ><Edit3 size={13} /></button>
                          <button
                            onClick={() => setConfirm({ show: true, message: "Delete this record?", onConfirm: () => handleDelete(item.id) })}
                            className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-300 hover:text-rose-500 transition-all"
                          ><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-[260px] rounded-2xl p-5 border border-[var(--border-color)] text-center shadow-2xl">
              <AlertTriangle size={32} className="text-rose-500 mx-auto mb-3" />
              <h3 className="text-[11px] font-black uppercase text-[var(--text-main)] mb-1">Confirm Action</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-6 leading-tight">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-1.5 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[9px] font-black">NO</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-1.5 bg-rose-600 text-white rounded-xl text-[9px] font-black shadow-lg">YES</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selectedView && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedView(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-4">
                <h3 className="text-[10px] font-black uppercase text-rose-500 text-[var(--text-main)]">Record Data</h3>
                <button onClick={() => setSelectedView(null)}><X size={18} className="text-slate-400 hover:text-rose-500" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-[var(--text-main)]">
                <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                  <p className="text-[7px] text-slate-400 uppercase mb-0.5">Personnel</p>
                  <p className="uppercase truncate">{selectedView.username}</p>
                </div>
                <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                  <p className="text-[7px] text-slate-400 uppercase mb-0.5">Log Date</p>
                  <p>{selectedView.scheduledDate ? new Date(selectedView.scheduledDate).toLocaleDateString() : "---"}</p>
                </div>
                <div className="col-span-2 p-3 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                  <p className="text-[7px] text-slate-400 uppercase mb-1">Departure Reason</p>
                  <p className="leading-tight opacity-70 italic">"{selectedView.reasonForLeaving || "---"}"</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPDATE STATUS MODAL */}
      <AnimatePresence>
        {editRecord && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditRecord(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-xs rounded-2xl border border-[var(--border-color)] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <p className="text-[10px] font-black uppercase text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-2 text-center tracking-widest">Update State</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleUpdateProcess("InProgress")} className="py-2.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all">In Progress</button>
                <button onClick={() => handleUpdateProcess("Completed")} className="py-2.5 bg-emerald-500/10 text-emerald-600 border border-emerald-200 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">Completed</button>
                <button onClick={() => handleUpdateProcess("Cancelled")} className="py-2.5 bg-rose-500/10 text-rose-600 border border-rose-200 rounded-xl text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Cancelled</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / SCHEDULE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
              <div className="px-5 py-3 bg-[var(--bg-body)] border-b flex justify-between items-center shrink-0">
                <h3 className="text-[10px] font-black uppercase text-rose-600 flex items-center gap-2"><UserPlus size={16} /> New Schedule</h3>
                <X size={20} className="text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateSchedule(); }} className="p-5 space-y-2 bg-[var(--bg-card)]">
                <div className="relative" ref={dropdownRef}>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Personnel</label>
                  <input
                    type="text"
                    placeholder="SELECT USER..."
                    className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-rose-500 text-[var(--text-main)]"
                    value={empSearchQuery}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => { setEmpSearchQuery(e.target.value); setShowDropdown(true); }}
                  />
                  {showDropdown && (
                    <div className="absolute z-[120] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-xl max-h-32 overflow-y-auto">
                      {employees
                        .filter(e => (e.username || "").toLowerCase().includes(empSearchQuery.toLowerCase()))
                        .map(emp => {
                          const hasActive = interviews.some(
                            i => Number(i.userId) === Number(emp.userId) && ACTIVE_STATUSES.includes(i.status)
                          );
                          return (
                            <button
                              key={emp.userId}
                              type="button"
                              onClick={() => { setFormData({ ...formData, userId: emp.userId }); setEmpSearchQuery(emp.username); setShowDropdown(false); }}
                              className="w-full px-4 py-2 text-left hover:bg-rose-500/10 text-[var(--text-main)] text-[10px] font-black uppercase border-b border-[var(--border-color)] last:border-0 flex items-center justify-between"
                            >
                              <span>{emp.username} (ID: {emp.userId})</span>
                              {hasActive && <span className="text-[8px] text-amber-500 font-black ml-2 shrink-0">ACTIVE</span>}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Interview Date</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none"
                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Reason</label>
                  <textarea
                    required
                    rows="2"
                    className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)]"
                    onChange={e => setFormData({ ...formData, reasonForLeaving: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!formData.userId}
                  className="w-full py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >Route Offboarding</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
