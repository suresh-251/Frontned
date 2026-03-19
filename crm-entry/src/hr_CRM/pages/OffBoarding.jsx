import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  LogOut, X, Search, Plus, Loader2, Trash2, Edit2,
  AlertTriangle, Lock, CheckCircle2, Clock, XCircle, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthDetails, hasPermission } from "../configs/auth.utils";
import { getAdminUsers } from "../../api/admin/users.api";
import {
  getOffBoardingList,
  createOffBoarding,
  updateOffBoardingStatus,
  deleteOffBoarding
} from "../api/offboarding.api";
import toast, { Toaster } from "react-hot-toast";

// ─── PERMISSION FLAGS ──────────────────────────────────────────────────────────
const canView   = () => hasPermission("OFFBOARDING_VIEW");
const canCreate = () => hasPermission("OFFBOARDING_CREATE");
const canUpdate = () => hasPermission("OFFBOARDING_UPDATE");
const canDelete = () => hasPermission("OFFBOARDING_DELETE");

const normalize = (d) =>
  Array.isArray(d) ? d : Array.isArray(d?.$values) ? d.$values : Array.isArray(d?.data) ? d.data : [];

const fmt = (d) => (d ? d.split("T")[0] : "—");
const EMPTY_CREATE = { userId: "", resignationDate: "", lastWorkingDate: "", reason: "", accountDeactivation: false };
const EMPTY_STATUS = { knowledgeTransferStatus: "Pending", assetReturnStatus: "Pending", exitInterviewStatus: "Pending", overallStatus: "In Progress" };
const STATUS_OPTS = ["Pending", "In Progress", "Completed", "Skipped"];
const OVERALL_OPTS = ["In Progress", "Completed", "On Hold"];

// ─── SUB-COMPONENTS (outside to avoid remount) ────────────────────────────────
const Field = ({ label, value, onChange, type = "text", required = false }) => (
  <div className="space-y-0.5">
    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">{label}</label>
    <input
      type={type} value={value} onChange={onChange} required={required}
      className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-rose-500/20 text-[var(--text-main)] transition-all"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="space-y-0.5">
    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">{label}</label>
    <select
      value={value} onChange={onChange}
      className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-rose-500/20 text-[var(--text-main)] transition-all"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const StatusBadge = ({ value }) => {
  const map = {
    Completed:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    "In Progress": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Pending:     "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Skipped:     "bg-slate-500/10 text-slate-500 border-slate-300",
    "On Hold":   "bg-orange-500/10 text-orange-600 border-orange-500/20",
  };
  const cls = map[value] || "bg-slate-100 text-slate-400 border-slate-200";
  return (
    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${cls}`}>
      {value || "—"}
    </span>
  );
};

export default function OffBoarding() {
  const authDetails = getAuthDetails();
  const userId      = authDetails?.userId ? Number(authDetails.userId) : null;
  const isManager   = !!(authDetails?.isAdmin || authDetails?.role === "HR_MANAGER");

  const [employees,      setEmployees]      = useState([]);
  const [list,           setList]           = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [searchTerm,     setSearchTerm]     = useState("");
  const [selectedId,     setSelectedId]     = useState(null);
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown,   setShowDropdown]   = useState(false);
  const dropdownRef = useRef(null);

  // modals
  const [createOpen,   setCreateOpen]   = useState(false);
  const [statusOpen,   setStatusOpen]   = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);

  // forms
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [statusForm, setStatusForm] = useState(EMPTY_STATUS);

  // confirm
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, empRes] = await Promise.allSettled([
        getOffBoardingList(),
        getAdminUsers({ page: 1, pageSize: 500 }),
      ]);
      if (empRes.status === "fulfilled") {
        const raw = empRes.value;
        let empData = [];
        if (raw?.users && Array.isArray(raw.users)) empData = raw.users;
        else if (Array.isArray(raw)) empData = raw;
        setEmployees(empData);
      }
      const all = normalize(res.status === "fulfilled" ? res.value : []);
      if (isManager) {
        setList(all);
      } else {
        setList(all.filter(item => Number(item.userId) === userId));
      }
    } catch {
      toast.error("Failed to load data");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canView()) loadData(); }, []);

  const triggerConfirm = (title, message, action) =>
    setConfirm({ open: true, title, message, onConfirm: action });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.userId) return toast.error("Please select a valid employee from the list");
    triggerConfirm("Initiate Exit", "Submit exit request?", async () => {
      setSubmitting(true);
      const tid = toast.loading("Submitting...");
      try {
        await createOffBoarding({
          userId: Number(createForm.userId),
          resignationDate: createForm.resignationDate
            ? new Date(createForm.resignationDate).toISOString()
            : new Date().toISOString(),
          lastWorkingDate: createForm.lastWorkingDate
            ? new Date(createForm.lastWorkingDate).toISOString()
            : new Date().toISOString(),
          reason: createForm.reason,
          accountDeactivation: createForm.accountDeactivation,
        });
        toast.success("Exit request submitted", { id: tid });
        setCreateOpen(false);
        setCreateForm(EMPTY_CREATE);
        setEmpSearchQuery("");
        loadData();
      } catch {
        toast.error("Failed to create", { id: tid });
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleOpenStatus = (item) => {
    setStatusTarget(item);
    setStatusForm({
      knowledgeTransferStatus: item.knowledgeTransferStatus || "Pending",
      assetReturnStatus:       item.assetReturnStatus       || "Pending",
      exitInterviewStatus:     item.exitInterviewStatus     || "Pending",
      overallStatus:           item.overallStatus           || "In Progress",
    });
    setStatusOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    triggerConfirm("Update Status", "Save status changes?", async () => {
      setSubmitting(true);
      const tid = toast.loading("Updating...");
      try {
        await updateOffBoardingStatus(statusTarget.id, statusForm);
        toast.success("Status updated", { id: tid });
        setStatusOpen(false);
        loadData();
      } catch {
        toast.error("Update failed", { id: tid });
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleDelete = (item) => {
    triggerConfirm(
      "Delete Record",
      `Permanently delete exit record for User #${item.userId}?`,
      async () => {
        const tid = toast.loading("Deleting...");
        try {
          await deleteOffBoarding(item.id);
          toast.success("Deleted", { id: tid });
          if (selectedId === item.id) setSelectedId(null);
          loadData();
        } catch {
          toast.error("Failed", { id: tid });
        }
      }
    );
  };

  const searchableEmployees = useMemo(() => {
    const query = empSearchQuery.toLowerCase().trim();
    if (!query || createForm.userId) return [];
    return employees.filter(emp => {
      const name = (emp.username || emp.name || "").toLowerCase();
      const id   = String(emp.userId || emp.id || "");
      return name.includes(query) || id.includes(query);
    }).slice(0, 6);
  }, [employees, empSearchQuery, createForm.userId]);

  const filteredList = useMemo(() =>
    list.filter(item =>
      String(item.userId ?? "").includes(searchTerm) ||
      (item.reason ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [list, searchTerm]);

  const selectedData = list.find(item => item.id === selectedId);

  // hrUser: only allow create if they don't have a record yet
  const userAlreadyHasRecord = !isManager && list.some(item => Number(item.userId) === userId);

  if (!canView()) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
      <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
        <Lock size={40} className="text-slate-400" />
      </div>
      <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-none">Access Restricted</h2>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">Offboarding clearance required</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirm.open && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-[280px] p-5 text-center"
            >
              <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2" />
              <h3 className="text-[11px] font-black uppercase text-[var(--text-main)] mb-1">{confirm.title}</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-5">{confirm.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirm({ ...confirm, open: false })}
                  className="flex-1 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg"
                >Cancel</button>
                <button
                  onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }}
                  className="flex-1 py-1.5 text-[9px] font-black uppercase bg-rose-600 text-white rounded-lg shadow-md"
                >Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <LogOut size={22} className="text-rose-500" /> Off Boarding
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search user / reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg pl-9 pr-4 py-2 w-52 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
          </div>
          {canCreate() && !userAlreadyHasRecord && (
            <button
              onClick={() => {
                setCreateForm({ ...EMPTY_CREATE, userId: isManager ? "" : String(userId ?? "") });
                setEmpSearchQuery(isManager ? "" : (() => { const me = employees.find(e => String(e.userId || e.id) === String(userId)); return me ? (me.username || me.name || "") : ""; })());
                setShowDropdown(false);
                setCreateOpen(true);
              }}
              className="bg-rose-600 text-white py-2 px-4 rounded-lg text-xs font-black uppercase flex items-center gap-2 active:scale-95 transition-all shadow-md"
            >
              <Plus size={14} /> Initiate Exit
            </button>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* TABLE */}
        <div className="col-span-12 lg:col-span-8 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">User ID</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Resignation</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Last Day</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Acct. Deact.</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  {(canUpdate() || canDelete()) && (
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/30">
                {loading && (
                  <tr><td colSpan={7} className="py-16 text-center"><Loader2 size={18} className="animate-spin mx-auto text-rose-400" /></td></tr>
                )}
                {!loading && filteredList.length === 0 && (
                  <tr><td colSpan={7} className="py-16 text-center text-[9px] font-black text-slate-400 uppercase">No records found</td></tr>
                )}
                {!loading && filteredList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer transition-colors border-l-2 ${selectedId === item.id ? "border-l-rose-500 bg-rose-500/5" : "border-l-transparent hover:bg-[var(--bg-body)]"}`}
                  >
                    <td className="px-4 py-2 text-[10px] font-black text-rose-500">#{item.userId ?? "—"}</td>
                    <td className="px-4 py-2 max-w-[160px]">
                      <p className="text-[10px] font-bold text-[var(--text-main)] truncate">{item.reason || "—"}</p>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-[10px] font-bold text-[var(--text-main)]">{fmt(item.resignationDate)}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-[10px] font-black text-rose-500">{fmt(item.lastWorkingDate)}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {item.accountDeactivation
                        ? <CheckCircle2 size={14} className="mx-auto text-emerald-500" />
                        : <XCircle size={14} className="mx-auto text-slate-300" />
                      }
                    </td>
                    <td className="px-4 py-2 text-center">
                      <StatusBadge value={item.overallStatus} />
                    </td>
                    {(canUpdate() || canDelete()) && (
                      <td className="px-4 py-2 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {canUpdate() && (
                            <button
                              onClick={() => handleOpenStatus(item)}
                              className="p-1.5 text-slate-400 border border-transparent hover:border-blue-500/20 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-all"
                              title="Update Status"
                            ><Edit2 size={13} /></button>
                          )}
                          {canDelete() && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-400 border border-transparent hover:border-rose-500/20 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete"
                            ><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="col-span-12 lg:col-span-4 bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)] shadow-sm">
          {selectedData ? (
            <div className="space-y-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-[var(--border-color)] pb-2 mb-3">
                Record — User #{selectedData.userId ?? "—"}
              </h3>

              <DetailRow label="Reason" value={selectedData.reason} />
              <DetailRow label="Resignation Date" value={fmt(selectedData.resignationDate)} />
              <DetailRow label="Last Working Day" value={fmt(selectedData.lastWorkingDate)} />
              <DetailRow
                label="Account Deactivation"
                value={selectedData.accountDeactivation ? "Yes" : "No"}
                highlight={selectedData.accountDeactivation}
              />

              <div className="pt-1 space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Checklist</p>
                <StatusRow label="Knowledge Transfer" status={selectedData.knowledgeTransferStatus} />
                <StatusRow label="Asset Return"        status={selectedData.assetReturnStatus} />
                <StatusRow label="Exit Interview"      status={selectedData.exitInterviewStatus} />
              </div>

              <div className="p-3 bg-[var(--bg-body)] rounded-xl border border-[var(--border-color)]">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Overall Status</p>
                <StatusBadge value={selectedData.overallStatus} />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
              <Search size={32} />
              <p className="text-[10px] font-black uppercase mt-2">Select a record</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setCreateOpen(false); setEmpSearchQuery(""); setShowDropdown(false); }}>
            <motion.div
              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 15, opacity: 0 }}
              className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Initiate Exit</h3>
                <button onClick={() => { setCreateOpen(false); setEmpSearchQuery(""); setShowDropdown(false); }} className="text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreate} className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-0.5 relative" ref={isManager ? dropdownRef : null}>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Employee *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={isManager ? "Search by name or ID..." : ""}
                        readOnly={!isManager}
                        value={empSearchQuery}
                        onFocus={() => isManager && setShowDropdown(true)}
                        onChange={e => {
                          if (!isManager) return;
                          setEmpSearchQuery(e.target.value);
                          setCreateForm(prev => ({ ...prev, userId: "" }));
                          setShowDropdown(true);
                        }}
                        className={`w-full px-3 py-1.5 border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)] pr-8 transition-all ${isManager ? "bg-[var(--bg-body)] focus:ring-2 focus:ring-rose-500/20" : "bg-[var(--bg-body)] opacity-60 cursor-not-allowed"}`}
                      />
                      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    </div>
                    <AnimatePresence>
                      {showDropdown && searchableEmployees.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="absolute z-[150] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-xl overflow-hidden max-h-44 overflow-y-auto"
                        >
                          {searchableEmployees.map(emp => (
                            <button
                              key={emp.userId || emp.id} type="button"
                              onClick={() => {
                                setCreateForm(prev => ({ ...prev, userId: String(emp.userId || emp.id) }));
                                setEmpSearchQuery(emp.username || emp.name || "");
                                setShowDropdown(false);
                              }}
                              className="w-full px-3 py-2.5 text-left hover:bg-rose-500/10 flex items-center justify-between border-b last:border-0 border-[var(--border-color)]"
                            >
                              <div>
                                <p className="text-[11px] font-black text-[var(--text-main)] uppercase">{emp.username || emp.name}</p>
                                <p className="text-[9px] font-bold text-slate-400">ID: #{emp.userId || emp.id}</p>
                              </div>
                              <ChevronRight size={11} className="text-slate-400" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Field
                    label="Resignation Date" type="date" required
                    value={createForm.resignationDate}
                    onChange={e => setCreateForm({ ...createForm, resignationDate: e.target.value })}
                  />
                  <Field
                    label="Last Working Date" type="date" required
                    value={createForm.lastWorkingDate}
                    onChange={e => setCreateForm({ ...createForm, lastWorkingDate: e.target.value })}
                  />
                  <div className="col-span-2 space-y-0.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Reason</label>
                    <textarea
                      value={createForm.reason}
                      onChange={e => setCreateForm({ ...createForm, reason: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-rose-500/20 text-[var(--text-main)] resize-none transition-all"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-3 p-3 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl">
                    <input
                      type="checkbox"
                      id="acct-deact"
                      checked={createForm.accountDeactivation}
                      onChange={e => setCreateForm({ ...createForm, accountDeactivation: e.target.checked })}
                      className="w-4 h-4 rounded accent-rose-600"
                    />
                    <label htmlFor="acct-deact" className="text-[10px] font-black uppercase text-[var(--text-main)] cursor-pointer">
                      Request Account Deactivation
                    </label>
                  </div>
                </div>
                <button
                  type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-rose-700 active:scale-95 transition-all shadow-md mt-1"
                >
                  Submit Exit Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPDATE STATUS MODAL */}
      <AnimatePresence>
        {statusOpen && statusTarget && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setStatusOpen(false)}>
            <motion.div
              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 15, opacity: 0 }}
              className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <div>
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Update Status</h3>
                  <p className="text-[8px] font-bold text-slate-400 mt-0.5">User #{statusTarget.userId}</p>
                </div>
                <button onClick={() => setStatusOpen(false)} className="text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={handleUpdateStatus} className="p-5 space-y-3">
                <SelectField
                  label="Knowledge Transfer"
                  value={statusForm.knowledgeTransferStatus}
                  onChange={e => setStatusForm({ ...statusForm, knowledgeTransferStatus: e.target.value })}
                  options={STATUS_OPTS}
                />
                <SelectField
                  label="Asset Return"
                  value={statusForm.assetReturnStatus}
                  onChange={e => setStatusForm({ ...statusForm, assetReturnStatus: e.target.value })}
                  options={STATUS_OPTS}
                />
                <SelectField
                  label="Exit Interview"
                  value={statusForm.exitInterviewStatus}
                  onChange={e => setStatusForm({ ...statusForm, exitInterviewStatus: e.target.value })}
                  options={STATUS_OPTS}
                />
                <SelectField
                  label="Overall Status"
                  value={statusForm.overallStatus}
                  onChange={e => setStatusForm({ ...statusForm, overallStatus: e.target.value })}
                  options={OVERALL_OPTS}
                />
                <button
                  type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md mt-1"
                >
                  Save Status
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const StatusRow = ({ label, status }) => {
  const icon =
    status === "Completed" ? <CheckCircle2 size={11} className="text-emerald-500" /> :
    status === "In Progress" ? <Clock size={11} className="text-blue-500" /> :
    <Clock size={11} className="text-amber-500" />;
  return (
    <div className="flex justify-between items-center bg-[var(--bg-body)] p-2.5 rounded-xl border border-[var(--border-color)]">
      <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5">{icon}{label}</span>
      <StatusBadge value={status || "Pending"} />
    </div>
  );
};

const DetailRow = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-start gap-2">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0">{label}</span>
    <span className={`text-[10px] font-bold text-right ${highlight ? "text-emerald-500" : "text-[var(--text-main)]"}`}>
      {value || "—"}
    </span>
  </div>
);

