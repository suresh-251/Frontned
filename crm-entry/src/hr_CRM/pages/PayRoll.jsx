import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getAllPayroll,
  generatePayroll,
  deletePayroll,
  getPayrollByEmployee,
  addAllowance,
  addDeduction,
  addBonus,
  approvePayroll,
  markPaid,
} from "../api/hr.payroll";
import { getAdminUsers } from "../../api/admin/users.api";
import { useRole } from "../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import {
  Banknote, Plus, Loader2, X, Search, Trash2, Calculator,
  ChevronRight, CheckCircle, CreditCard, ChevronDown, ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const EMPTY_FORM = {
  // generate
  employeeId: "", userName: "", basicSalary: "",
  // allowance
  allowanceType: "", allowanceAmount: "",
  // deduction
  deductionType: "", deductionAmount: "",
  // bonus
  bonusType: "", bonusAmount: "", bonusReason: "",
  bonusMonth: new Date().getMonth() + 1,
  bonusYear: new Date().getFullYear(),
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function Payroll() {
  const { isManager } = useRole();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [openSections, setOpenSections] = useState({ allowance: false, deduction: false, bonus: false });
  const dropdownRef = useRef(null);

  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { id: null, name: "User" };
      const decoded = jwtDecode(token);
      return {
        id: Number(decoded.sub || decoded.id),
        name: decoded.username || decoded.unique_name || "User",
      };
    } catch { return { id: null, name: "User" }; }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isManager) {
        const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
        let empData = [];
        if (empRes?.users && Array.isArray(empRes.users)) empData = empRes.users;
        else if (Array.isArray(empRes)) empData = empRes;
        setEmployees(empData);

        const payRes = await getAllPayroll();
        const data = payRes?.data || payRes || [];
        setRecords(Array.isArray(data) ? data : []);
      } else {
        const payRes = await getPayrollByEmployee(auth.id);
        const data = payRes?.data || payRes || [];
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [isManager, auth.id]);

  useEffect(() => { if (auth.id) fetchData(); }, [fetchData]);

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const searchableEmployees = useMemo(() => {
    const query = empSearchQuery.toLowerCase().trim();
    if (!query || formData.employeeId) return [];
    return employees.filter(emp => {
      const name = (emp.username || emp.name || "").toLowerCase();
      const id = (emp.userId || emp.id || "").toString();
      return name.includes(query) || id.includes(query);
    }).slice(0, 6);
  }, [employees, empSearchQuery, formData.employeeId]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return records.filter(item =>
      (item.userName || "").toLowerCase().includes(q) ||
      (item.userId || "").toString().includes(q)
    );
  }, [records, searchTerm]);

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleSection = (key) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEmpSearchQuery("");
    setOpenSections({ allowance: false, deduction: false, bonus: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast.error("Please select an employee");
    if (!formData.basicSalary) return toast.error("Basic salary is required");

    const tid = toast.loading("Processing payroll...");
    try {
      // 1. Generate payroll
      await generatePayroll({
        userId: parseInt(formData.employeeId),
        userName: formData.userName,
        basicSalary: parseFloat(formData.basicSalary),
      });

      // 2. Add allowance if filled
      if (openSections.allowance && formData.allowanceType && formData.allowanceAmount) {
        await addAllowance({
          userId: parseInt(formData.employeeId),
          allowanceType: formData.allowanceType,
          amount: parseFloat(formData.allowanceAmount),
        });
      }

      // 3. Add deduction if filled
      if (openSections.deduction && formData.deductionType && formData.deductionAmount) {
        await addDeduction({
          userId: parseInt(formData.employeeId),
          deductionType: formData.deductionType,
          amount: parseFloat(formData.deductionAmount),
        });
      }

      // 4. Add bonus if filled
      if (openSections.bonus && formData.bonusType && formData.bonusAmount) {
        await addBonus({
          userId: parseInt(formData.employeeId),
          userName: formData.userName,
          bonusType: formData.bonusType,
          amount: parseFloat(formData.bonusAmount),
          reason: formData.bonusReason,
          month: parseInt(formData.bonusMonth),
          year: parseInt(formData.bonusYear),
        });
      }

      toast.success("Payroll generated successfully", { id: tid });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Payroll generation failed", { id: tid });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payroll record?")) return;
    const tid = toast.loading("Deleting...");
    try {
      await deletePayroll(id);
      toast.success("Record deleted", { id: tid });
      fetchData();
    } catch {
      toast.error("Delete failed", { id: tid });
    }
  };

  const handleApprove = async (id) => {
    const tid = toast.loading("Approving...");
    try {
      await approvePayroll(id);
      toast.success("Payroll approved", { id: tid });
      fetchData();
    } catch {
      toast.error("Approval failed", { id: tid });
    }
  };

  const handleMarkPaid = async (id) => {
    const tid = toast.loading("Marking as paid...");
    try {
      await markPaid(id);
      toast.success("Marked as paid", { id: tid });
      fetchData();
    } catch {
      toast.error("Failed to mark as paid", { id: tid });
    }
  };

  const statusColor = (status) => {
    if (!status) return "text-slate-400 bg-slate-50";
    const s = status.toLowerCase();
    if (s === "paid") return "text-emerald-600 bg-emerald-50";
    if (s === "approved") return "text-blue-600 bg-blue-50";
    if (s === "draft") return "text-amber-600 bg-amber-50";
    if (s === "generated") return "text-violet-600 bg-violet-50";
    return "text-slate-500 bg-slate-50";
  };

  // ── Section toggle header ──────────────────────────────────────────────────
  const sectionActiveClass = {
    allowance: "bg-emerald-50 border-emerald-200 text-emerald-700",
    deduction: "bg-rose-50 border-rose-200 text-rose-700",
    bonus:     "bg-indigo-50 border-indigo-200 text-indigo-700",
  };

  const SectionToggle = ({ label, sectionKey }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className={`col-span-2 flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
        ${openSections[sectionKey]
          ? sectionActiveClass[sectionKey]
          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
    >
      <span>{label} <span className="font-normal opacity-60">(optional)</span></span>
      {openSections[sectionKey] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
    </button>
  );

  const Input = ({ label, field, type = "text", placeholder = "", required = false, col = 1 }) => (
    <div className={`col-span-${col} space-y-1`}>
      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-violet-50 transition-all"
        value={formData[field]}
        onChange={e => set(field, e.target.value)}
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
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
              type="text"
              placeholder="Search..."
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-44 outline-none focus:ring-2 focus:ring-violet-50 transition-all"
            />
          </div>
          {isManager && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-violet-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-lg hover:bg-violet-700 transition-all flex items-center gap-2"
            >
              <Plus size={14} strokeWidth={3} /> Generate Payroll
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Employee</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Basic Salary</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Allowances</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Overtime</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Bonus</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Absent Ded.</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Tax Ded.</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Attendance</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Month</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Net Salary</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Status</th>
              {isManager && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map(item => (
              <tr key={item.payrollId} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 border border-violet-100 font-black text-[10px] uppercase shrink-0">
                      {(item.userName || "?").charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-0.5">{item.userName || "—"}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">ID #{item.userId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[11px] font-bold text-slate-700">₹{(item.basicSalary || 0).toLocaleString()}</span>
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
                    <span className="text-[8px] text-slate-300 font-bold uppercase">work/present/absent</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">
                    {item.month ? new Date(item.month).toLocaleString("default", { month: "short", year: "numeric" }) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[12px] font-black text-violet-700">₹{(item.netSalary || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${statusColor(item.status)}`}>
                    {item.status || "—"}
                  </span>
                </td>
                {isManager && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {item.status?.toLowerCase() === "draft" || item.status?.toLowerCase() === "generated" ? (
                        <button
                          title="Approve"
                          onClick={() => handleApprove(item.payrollId)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <CheckCircle size={14} />
                        </button>
                      ) : null}
                      {item.status?.toLowerCase() === "approved" ? (
                        <button
                          title="Mark Paid"
                          onClick={() => handleMarkPaid(item.payrollId)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                        >
                          <CreditCard size={14} />
                        </button>
                      ) : null}
                      <button
                        title="Delete"
                        onClick={() => handleDelete(item.payrollId)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
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
          <div className="p-12 text-center text-[10px] font-bold text-slate-300 uppercase italic">No records found</div>
        )}
      </div>

      {/* GENERATE PAYROLL MODAL */}
      <AnimatePresence>
        {showModal && isManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-violet-600" />
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Generate New Payroll</h3>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }}>
                  <X size={18} className="text-slate-400 hover:text-rose-500" />
                </button>
              </div>

              {/* Modal Body — scrollable */}
              <form onSubmit={handleSubmit} className="overflow-y-auto">
                <div className="p-6 grid grid-cols-2 gap-x-4 gap-y-4">

                  {/* ── Section: Basic Info ──────────────────────────── */}
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-3 border-b border-violet-100 pb-1">
                      Basic Information
                    </p>
                  </div>

                  {/* Employee Search */}
                  <div className="col-span-1 space-y-1 relative" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Employee *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search name or ID..."
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-violet-50 transition-all"
                        value={empSearchQuery}
                        onFocus={() => setShowDropdown(true)}
                        onChange={e => {
                          setEmpSearchQuery(e.target.value);
                          setFormData(prev => ({ ...prev, employeeId: "", userName: "" }));
                          setShowDropdown(true);
                        }}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                    </div>
                    <AnimatePresence>
                      {showDropdown && searchableEmployees.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute z-[150] w-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-48 overflow-y-auto"
                        >
                          {searchableEmployees.map(emp => (
                            <button
                              key={emp.userId || emp.id}
                              type="button"
                              onClick={() => {
                                const uid = emp.userId || emp.id;
                                const uname = emp.username || emp.name || "";
                                setFormData(prev => ({ ...prev, employeeId: uid, userName: uname }));
                                setEmpSearchQuery(uname);
                                setShowDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-violet-50 flex items-center justify-between border-b last:border-0 border-slate-50"
                            >
                              <div>
                                <p className="text-[11px] font-black text-slate-700 uppercase">{emp.username || emp.name}</p>
                                <p className="text-[9px] font-bold text-slate-400">ID: #{emp.userId || emp.id}</p>
                              </div>
                              <ChevronRight size={12} className="text-slate-300" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Basic Salary */}
                  <Input label="Basic Salary *" field="basicSalary" type="number" placeholder="0.00" required />

                  {/* ── Section: Allowance ───────────────────────────── */}
                  <SectionToggle label="Allowance" sectionKey="allowance" />
                  {openSections.allowance && (
                    <>
                      <Input label="Allowance Type" field="allowanceType" placeholder="e.g. HRA, Travel, Medical" />
                      <Input label="Allowance Amount" field="allowanceAmount" type="number" placeholder="0.00" />
                    </>
                  )}

                  {/* ── Section: Deduction ───────────────────────────── */}
                  <SectionToggle label="Deduction" sectionKey="deduction" />
                  {openSections.deduction && (
                    <>
                      <Input label="Deduction Type" field="deductionType" placeholder="e.g. PF, ESI, Advance" />
                      <Input label="Deduction Amount" field="deductionAmount" type="number" placeholder="0.00" />
                    </>
                  )}

                  {/* ── Section: Bonus ───────────────────────────────── */}
                  <SectionToggle label="Bonus" sectionKey="bonus" />
                  {openSections.bonus && (
                    <>
                      <Input label="Bonus Type" field="bonusType" placeholder="e.g. Performance, Festival" />
                      <Input label="Bonus Amount" field="bonusAmount" type="number" placeholder="0.00" />
                      <Input label="Reason" field="bonusReason" placeholder="Reason for bonus" col={2} />
                      <div className="col-span-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Bonus Month</label>
                        <select
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-violet-50 transition-all"
                          value={formData.bonusMonth}
                          onChange={e => set("bonusMonth", e.target.value)}
                        >
                          {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Bonus Year</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-violet-50 transition-all"
                          value={formData.bonusYear}
                          onChange={e => set("bonusYear", e.target.value)}
                          min={2020}
                          max={2100}
                        />
                      </div>
                    </>
                  )}

                  {/* Submit Row */}
                  <div className="col-span-2 mt-2 p-4 bg-violet-50 rounded-2xl border border-violet-100 flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest">Selected Employee</p>
                      <p className="text-sm font-black text-violet-700 uppercase">{formData.userName || "—"}</p>
                      {formData.basicSalary && (
                        <p className="text-[9px] font-bold text-violet-400 mt-0.5">
                          Basic: ₹{parseFloat(formData.basicSalary || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={!formData.employeeId || !formData.basicSalary}
                      className="px-8 py-3 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 disabled:opacity-30 transition-all"
                    >
                      Confirm Payroll
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
