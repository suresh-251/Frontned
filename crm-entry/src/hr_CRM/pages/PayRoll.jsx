import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getAllPayroll, generatePayroll, deletePayroll, getPayrollByEmployee,
  approvePayroll, markPaid,
} from "../api/hr.payroll";
import { getAdminUsers } from "../../api/admin/users.api";
import { hasPermission, getAuthDetails } from "../configs/auth.utils";
import {
  Banknote, Plus, Loader2, X, Search, Trash2, Calculator,
  ChevronRight, CheckCircle, CreditCard, Lock, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ─── PERMISSION HELPERS ───────────────────────────────────────────────────────
const canView     = () => hasPermission("PAYROLL_VIEW");
const canGenerate = () => hasPermission("PAYROLL_GENERATE");
const canUpdate   = () => hasPermission("PAYROLL_UPDATE");
const canDelete   = () => hasPermission("PAYROLL_DELETE");

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { employeeId: "", userName: "", basicSalary: "" };

const CONFIRM_META = {
  generate: { Icon: Calculator,  iconBg: "bg-violet-50",  iconColor: "text-violet-600",  btnClass: "bg-violet-600 hover:bg-violet-700",  label: "Generate"  },
  approve:  { Icon: CheckCircle, iconBg: "bg-blue-50",    iconColor: "text-blue-600",    btnClass: "bg-blue-600   hover:bg-blue-700",    label: "Approve"   },
  paid:     { Icon: CreditCard,  iconBg: "bg-emerald-50", iconColor: "text-emerald-600", btnClass: "bg-emerald-600 hover:bg-emerald-700", label: "Mark Paid" },
  delete:   { Icon: Trash2,      iconBg: "bg-rose-50",    iconColor: "text-rose-600",    btnClass: "bg-rose-600   hover:bg-rose-700",    label: "Delete"    },
};

// ─── STABLE SUB-COMPONENTS ────────────────────────────────────────────────────

const Tooltip = ({ text, children }) => (
  <div className="relative group inline-flex">
    {children}
    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex whitespace-nowrap bg-slate-800 text-white text-[8px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg shadow-xl z-50 pointer-events-none leading-none">
      {text}
      <div className="absolute top-full right-2.5 border-4 border-transparent border-t-slate-800" />
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Payroll() {
  const [records, setRecords]       = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown, setShowDropdown]     = useState(false);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const dropdownRef = useRef(null);

  const [confirm, setConfirm] = useState({
    open: false, type: "generate", title: "", message: "", onConfirm: null,
  });

  const NOW               = new Date();
  const currentMonthLabel = NOW.toLocaleString("default", { month: "long", year: "numeric" });

  // Single source of truth — same decoder used by hasPermission()
  const authDetails = useMemo(() => getAuthDetails(), []);
  const userId      = authDetails?.userId ? Number(authDetails.userId) : null;
  // admin OR HR_MANAGER → sees all records and employee list
  const isManager   = !!(authDetails?.isAdmin || authDetails?.role === "HR_MANAGER");

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isManager) {
        // hrManager / Admin — fetch all employees + all payroll records
        const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
        let empData = [];
        if (empRes?.users && Array.isArray(empRes.users)) empData = empRes.users;
        else if (Array.isArray(empRes)) empData = empRes;
        setEmployees(empData);

        const payRes = await getAllPayroll();
        const data   = payRes?.data || payRes || [];
        setRecords(Array.isArray(data) ? data : []);
      } else {
        // hrUser — fetch all payrolls then filter to logged-in user only
        if (!userId) { setLoading(false); return; }
        const payRes = await getAllPayroll();
        const all    = payRes?.data || payRes || [];
        const mine   = Array.isArray(all)
          ? all.filter(r => Number(r.userId) === userId)
          : [];
        setRecords(mine);
      }
    } catch {
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [isManager, userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Close employee dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const searchableEmployees = useMemo(() => {
    const query = empSearchQuery.toLowerCase().trim();
    if (!query || formData.employeeId) return [];
    return employees.filter(emp => {
      const name = (emp.username || emp.name || "").toLowerCase();
      const id   = (emp.userId   || emp.id   || "").toString();
      return name.includes(query) || id.includes(query);
    }).slice(0, 6);
  }, [employees, empSearchQuery, formData.employeeId]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return records.filter(r =>
      (r.userName || "").toLowerCase().includes(q) ||
      (r.userId   || "").toString().includes(q)
    );
  }, [records, searchTerm]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEmpSearchQuery("");
  };

  const triggerConfirm = (type, title, message, onConfirm) =>
    setConfirm({ open: true, type, title, message, onConfirm });

  const closeConfirm = () => setConfirm(prev => ({ ...prev, open: false }));

  const runConfirmed = () => {
    confirm.onConfirm?.();
    closeConfirm();
  };

  const isDuplicatePayroll = (empId) =>
    records.some(r => {
      if (Number(r.userId) !== Number(empId)) return false;
      if (!r.month) return false;
      const d = new Date(r.month);
      return d.getMonth() === NOW.getMonth() && d.getFullYear() === NOW.getFullYear();
    });

  const statusColor = (status) => {
    if (!status) return "text-slate-400 bg-slate-100";
    const s = status.toLowerCase();
    if (s === "paid")      return "text-emerald-600 bg-emerald-50";
    if (s === "approved")  return "text-blue-600 bg-blue-50";
    if (s === "draft")     return "text-amber-600 bg-amber-50";
    if (s === "generated") return "text-violet-600 bg-violet-50";
    return "text-slate-500 bg-slate-100";
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast.error("Please select an employee");
    if (!formData.basicSalary) return toast.error("Basic salary is required");
    if (isDuplicatePayroll(formData.employeeId))
      return toast.error(`Payroll already generated for ${formData.userName} this month`);

    triggerConfirm(
      "generate",
      "Generate Payroll",
      `Generate payroll for ${formData.userName || "this employee"} — ${currentMonthLabel}?`,
      async () => {
        const tid = toast.loading("Processing payroll...");
        try {
          await generatePayroll({
            userId:      parseInt(formData.employeeId),
            userName:    formData.userName,
            basicSalary: parseFloat(formData.basicSalary),
          });
          toast.success("Payroll generated successfully", { id: tid });
          setShowModal(false);
          resetForm();
        } catch (err) {
          const msg = err?.response?.data?.message || err?.response?.data;
          toast.error(typeof msg === "string" ? msg : "Payroll generation failed", { id: tid });
        } finally {
          fetchData();
        }
      }
    );
  };

  const handleDelete = (id, userName) =>
    triggerConfirm(
      "delete",
      "Delete Payroll Record",
      `Permanently remove payroll record for ${userName || "this employee"}?`,
      async () => {
        const tid = toast.loading("Deleting...");
        try {
          await deletePayroll(id);
          toast.success("Record deleted", { id: tid });
          fetchData();
        } catch {
          toast.error("Delete failed", { id: tid });
        }
      }
    );

  const handleApprove = (id, userName) =>
    triggerConfirm(
      "approve",
      "Approve Payroll",
      `Approve payroll for ${userName || "this employee"}?`,
      async () => {
        const tid = toast.loading("Approving...");
        try {
          await approvePayroll(id);
          toast.success("Payroll approved", { id: tid });
          fetchData();
        } catch {
          toast.error("Approval failed", { id: tid });
        }
      }
    );

  const handleMarkPaid = (id, userName) =>
    triggerConfirm(
      "paid",
      "Mark as Paid",
      `Mark payroll as paid for ${userName || "this employee"}?`,
      async () => {
        const tid = toast.loading("Marking as paid...");
        try {
          await markPaid(id);
          toast.success("Marked as paid", { id: tid });
          fetchData();
        } catch {
          toast.error("Failed to mark as paid", { id: tid });
        }
      }
    );

  const showActions  = canUpdate() || canDelete();
  const confirmMeta  = CONFIRM_META[confirm.type] || CONFIRM_META.generate;
  const ConfirmIcon  = confirmMeta.Icon;

  // ── PAYROLL_VIEW guard ────────────────────────────────────────────────────
  if (!canView()) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-none">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">Payroll clearance required</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2 uppercase text-[var(--text-main)]">
            <Banknote size={22} className="text-violet-600" /> Payroll Terminal
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
            {isManager ? "Administrative Registry" : "My Disbursement Logs"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text" placeholder="Search..."
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg pl-9 pr-4 py-2 w-44 outline-none text-[var(--text-main)] transition-all"
            />
          </div>
          {canGenerate() && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-violet-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-lg hover:bg-violet-700 transition-all flex items-center gap-2"
            >
              <Plus size={14} strokeWidth={3} /> Generate Payroll
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE ───────────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Employee</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Basic Salary</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Allowances</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Overtime</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Bonus</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Absent Ded.</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Tax Ded.</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Attendance</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Month</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Net Salary</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Status</th>
              {showActions && (
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/40">
            {filteredRecords.map(item => (
              <tr key={item.payrollId} className="hover:bg-[var(--bg-body)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-600 border border-violet-500/20 font-black text-[10px] uppercase shrink-0">
                      {(item.userName || "?").charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[var(--text-main)] uppercase leading-none mb-0.5">{item.userName || "—"}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">ID #{item.userId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[11px] font-bold text-[var(--text-main)]">₹{(item.basicSalary || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[11px] font-bold text-emerald-600">+₹{(item.totalAllowances || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[11px] font-bold text-blue-600">+₹{(item.overtimePay || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[11px] font-bold text-indigo-600">+₹{(item.bonusAmount || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[11px] font-bold text-rose-600">-₹{(item.absentDeduction || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[11px] font-bold text-orange-600">-₹{(item.taxDeduction || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold text-slate-500">
                      {item.workingDays || 0}W / {item.presentDays || 0}P / {item.absentDays || 0}A
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">work / present / absent</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <span className="text-[10px] font-black text-slate-500 bg-[var(--bg-body)] px-2 py-1 rounded border border-[var(--border-color)] uppercase">
                    {item.month ? new Date(item.month).toLocaleString("default", { month: "short", year: "numeric" }) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[12px] font-black text-violet-600">₹{(item.netSalary || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${statusColor(item.status)}`}>
                    {item.status || "—"}
                  </span>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate() && (item.status?.toLowerCase() === "draft" || item.status?.toLowerCase() === "generated") && (
                        <Tooltip text={`Approve payroll for ${item.userName || "this employee"}`}>
                          <button onClick={() => handleApprove(item.payrollId, item.userName)} className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors">
                            <CheckCircle size={14} />
                          </button>
                        </Tooltip>
                      )}
                      {canUpdate() && item.status?.toLowerCase() === "approved" && (
                        <Tooltip text={`Mark payroll as paid for ${item.userName || "this employee"}`}>
                          <button onClick={() => handleMarkPaid(item.payrollId, item.userName)} className="p-1.5 text-emerald-400 hover:text-emerald-600 transition-colors">
                            <CreditCard size={14} />
                          </button>
                        </Tooltip>
                      )}
                      {canDelete() && (
                        <Tooltip text={`Delete payroll record for ${item.userName || "this employee"}`}>
                          <button onClick={() => handleDelete(item.payrollId, item.userName)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-violet-500" size={24} />
          </div>
        )}
        {!loading && filteredRecords.length === 0 && (
          <div className="p-12 text-center text-[10px] font-bold text-slate-400 uppercase italic">No records found</div>
        )}
      </div>

      {/* ── GENERATE PAYROLL MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && canGenerate() && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calculator size={15} className="text-violet-600" />
                  <h3 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Generate Payroll</h3>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }}>
                  <X size={16} className="text-slate-400 hover:text-rose-500" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit}>
                <div className="p-4 space-y-3">

                  {/* Current Month banner */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                    <Calendar size={13} className="text-violet-500 shrink-0" />
                    <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Payroll Month:</span>
                    <span className="text-[10px] font-black text-violet-600 uppercase ml-1">{currentMonthLabel}</span>
                    <span className="ml-auto text-[7px] font-black text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded uppercase">Current</span>
                  </div>

                  {/* Employee search */}
                  <div className="space-y-0.5 relative" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Employee *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or ID..."
                        className="w-full px-2.5 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[11px] font-bold outline-none text-[var(--text-main)] transition-all pr-8"
                        value={empSearchQuery}
                        onFocus={() => setShowDropdown(true)}
                        onChange={e => {
                          setEmpSearchQuery(e.target.value);
                          setFormData(prev => ({ ...prev, employeeId: "", userName: "" }));
                          setShowDropdown(true);
                        }}
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
                                setFormData(prev => ({ ...prev, employeeId: emp.userId || emp.id, userName: emp.username || emp.name || "" }));
                                setEmpSearchQuery(emp.username || emp.name || "");
                                setShowDropdown(false);
                              }}
                              className="w-full px-3 py-2.5 text-left hover:bg-violet-500/10 flex items-center justify-between border-b last:border-0 border-[var(--border-color)]"
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

                  {/* Basic Salary */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Basic Salary *</label>
                    <input
                      required type="number" placeholder="0.00" min="0" step="0.01"
                      className="w-full px-2.5 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[11px] font-bold outline-none text-[var(--text-main)] transition-all"
                      value={formData.basicSalary}
                      onChange={e => setFormData(prev => ({ ...prev, basicSalary: e.target.value }))}
                    />
                  </div>

                  {/* Submit row */}
                  <div className="flex items-center justify-between pt-1 gap-3">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest leading-none">Selected</p>
                      <p className="text-[11px] font-black text-violet-600 uppercase truncate">{formData.userName || "—"}</p>
                    </div>
                    <button
                      type="submit"
                      disabled={!formData.employeeId || !formData.basicSalary}
                      className="shrink-0 px-5 py-2 bg-violet-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 disabled:opacity-30 transition-all hover:bg-violet-700"
                    >
                      Confirm
                    </button>
                  </div>

                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRMATION MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {confirm.open && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[200] backdrop-blur-md bg-slate-900/40 p-4"
            onClick={closeConfirm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl shadow-2xl p-6 border border-[var(--border-color)] w-80 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className={`h-12 w-12 ${confirmMeta.iconBg} ${confirmMeta.iconColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <ConfirmIcon size={24} />
              </div>
              <h3 className="text-sm font-black uppercase text-[var(--text-main)] mb-2">{confirm.title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 leading-relaxed">{confirm.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={closeConfirm}
                  className="flex-1 py-2 bg-[var(--bg-body)] text-slate-400 text-[10px] font-black uppercase rounded-xl border border-[var(--border-color)] hover:opacity-80 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={runConfirmed}
                  className={`flex-1 py-2 text-white text-[10px] font-black uppercase rounded-xl shadow-md transition-all ${confirmMeta.btnClass}`}
                >
                  {confirmMeta.label}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
