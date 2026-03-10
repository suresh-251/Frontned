import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  getAllPayroll, 
  generatePayroll, 
  deletePayroll,
  getPayrollByEmployee 
} from "../api/hr.payroll";
import { getAdminUsers } from "../../api/admin/users.api";
import { useRole } from "../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import { 
  Wallet, Plus, Loader2, X, User, Search, 
  Trash2, DollarSign, Calculator, ChevronRight,
  ArrowDownCircle, ArrowUpCircle, Banknote, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function Payroll() {
  const { isManager } = useRole();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]); // All users for empsel
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // empsel Logic States
  const [empSearchQuery, setEmpSearchQuery] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    employeeId: "", basicSalary: "", allowances: "", 
    deductions: "", payrollMonth: ""
  });

  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { id: null, name: "User" };
      const decoded = jwtDecode(token);
      return { 
        id: Number(decoded.sub || decoded.id), 
        name: decoded.username || decoded.unique_name || "User" 
      };
    } catch { return { id: null, name: "User" }; }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // empsel Hydration: Always load employees if Manager
      const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
      let empData = [];
      if (empRes?.users && Array.isArray(empRes.users)) empData = empRes.users;
      else if (Array.isArray(empRes)) empData = empRes;
      setEmployees(empData);

      if (isManager) {
        const payRes = await getAllPayroll();
        setRecords(payRes?.data || payRes || []);
      } else {
        // HR_USER: View personal payroll history only
        const payRes = await getPayrollByEmployee(auth.id);
        setRecords(Array.isArray(payRes) ? payRes : payRes?.data || []);
      }
    } catch (err) {
      toast.error("Registry Sync Error");
    } finally {
      setLoading(false);
    }
  }, [isManager, auth.id]);

  useEffect(() => { if(auth.id) fetchData(); }, [fetchData]);

  // empsel: Outside click handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // empsel: Dropdown Filter Logic
  const searchableEmployees = useMemo(() => {
    const query = empSearchQuery.toLowerCase().trim();
    if (!query || formData.employeeId) return [];

    return employees.filter(emp => {
      const name = (emp.username || emp.name || "").toLowerCase();
      const id = (emp.userId || emp.id || "").toString();
      return name.includes(query) || id.includes(query);
    }).slice(0, 5);
  }, [employees, empSearchQuery, formData.employeeId]);

  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      const emp = employees.find(e => e.userId === item.employeeId);
      const name = isManager ? (emp?.username || "Unknown") : auth.name;
      return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.employeeId?.toString().includes(searchTerm);
    });
  }, [records, employees, searchTerm, isManager, auth.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast.error("Please select an employee");
    const tid = toast.loading("Processing Disbursement...");
    try {
      await generatePayroll({
        employeeId: parseInt(formData.employeeId),
        basicSalary: parseFloat(formData.basicSalary),
        allowances: parseFloat(formData.allowances),
        deductions: parseFloat(formData.deductions),
        payrollMonth: new Date(formData.payrollMonth).toISOString()
      });
      toast.success("Payroll Generated", { id: tid });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch { toast.error("Generation Failed", { id: tid }); }
  };

  const resetForm = () => {
    setFormData({ employeeId: "", basicSalary: "", allowances: "", deductions: "", payrollMonth: "" });
    setEmpSearchQuery("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this financial record?")) return;
    try {
      await deletePayroll(id);
      toast.success("Record Deleted");
      fetchData();
    } catch { toast.error("Delete Restricted"); }
  };

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
            <input type="text" placeholder="Global Search..." onChange={(e) => setSearchTerm(e.target.value)} className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-violet-50 transition-all" />
          </div>

          {isManager && (
            <button onClick={() => setShowModal(true)} className="bg-violet-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-lg hover:bg-violet-700 transition-all flex items-center gap-2">
              <Plus size={14} strokeWidth={3} /> Generate Payrun
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-auto">Employee</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-64 text-center">Breakdown</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Month</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Net Salary</th>
              {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-24">Control</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((item) => {
              const emp = employees.find(e => e.userId === item.employeeId);
              const staffName = isManager ? (emp?.username || "Unknown") : auth.name;
              const netSalary = (item.basicSalary + item.allowances) - item.deductions;
              
              return (
                <tr key={item.payrollId || item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 border border-violet-100 font-black text-[10px] uppercase">{staffName.charAt(0)}</div>
                      <div>
                        <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1">{staffName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: #{item.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                     <div className="flex justify-center gap-4">
                        <div className="flex flex-col"><span className="text-[8px] font-black text-slate-300 uppercase">Base</span><span className="text-[10px] font-bold text-slate-600">${item.basicSalary?.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[8px] font-black text-emerald-400 uppercase">Allow.</span><span className="text-[10px] font-bold text-emerald-600">+${item.allowances?.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-[8px] font-black text-rose-400 uppercase">Ded.</span><span className="text-[10px] font-bold text-rose-600">-${item.deductions?.toLocaleString()}</span></div>
                     </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                     <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-tighter">
                       {new Date(item.payrollMonth).toLocaleString('default', { month: 'short', year: 'numeric' })}
                     </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                     <div className="flex flex-col items-center">
                        <span className="text-[12px] font-black text-violet-700">${netSalary.toLocaleString()}</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Disbursed</span>
                     </div>
                  </td>
                  {isManager && (
                    <td className="px-5 py-4 text-right">
                       <button onClick={() => handleDelete(item.payrollId || item.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors shadow-sm"><Trash2 size={14}/></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-violet-500" size={24} /></div>}
        {!loading && filteredRecords.length === 0 && <div className="p-12 text-center text-[10px] font-bold text-slate-300 uppercase italic">No records found</div>}
      </div>

      {/* empsel MODAL */}
      <AnimatePresence>
        {showModal && isManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
               <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calculator size={18} className="text-violet-600" />
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Process New Payroll</h3>
                  </div>
                  <button onClick={() => { setShowModal(false); resetForm(); }}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-x-4 gap-y-4">
                  {/* empsel LOGIC SECTION */}
                  <div className="col-span-1 space-y-1 relative" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Personnel Search</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search Name or ID..." 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-violet-50 transition-all" 
                        value={empSearchQuery} 
                        onFocus={() => setShowDropdown(true)}
                        onChange={(e) => { 
                          setEmpSearchQuery(e.target.value); 
                          setFormData(prev => ({...prev, employeeId: ""}));
                          setShowDropdown(true); 
                        }} 
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    </div>

                    <AnimatePresence>
                      {showDropdown && searchableEmployees.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[120] w-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                          {searchableEmployees.map(emp => (
                            <button key={emp.userId} type="button" onClick={() => { 
                              setFormData({...formData, employeeId: emp.userId}); 
                              setEmpSearchQuery(emp.username || emp.name); 
                              setShowDropdown(false); 
                            }} className="w-full px-4 py-3 text-left hover:bg-violet-50 flex items-center justify-between border-b last:border-0 border-slate-50">
                              <div className="flex flex-col text-left">
                                <span className="text-[11px] font-black text-slate-700 uppercase">{emp.username}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: #{emp.userId}</span>
                              </div>
                              <ChevronRight size={12} className="text-slate-300" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Payroll Month</label>
                    <input required type="month" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" value={formData.payrollMonth} onChange={e => setFormData({...formData, payrollMonth: e.target.value})} />
                  </div>

                  <div className="col-span-2 grid grid-cols-3 gap-3 pt-2">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest text-center block">Basic</label>
                        <input required type="number" placeholder="0" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" onChange={e => setFormData({...formData, basicSalary: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-emerald-500 uppercase ml-1 tracking-widest text-center block">Allowances</label>
                        <input required type="number" placeholder="0" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" onChange={e => setFormData({...formData, allowances: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-rose-500 uppercase ml-1 tracking-widest text-center block">Deductions</label>
                        <input required type="number" placeholder="0" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" onChange={e => setFormData({...formData, deductions: e.target.value})} />
                     </div>
                  </div>

                  <div className="col-span-2 mt-4 p-4 bg-violet-50 rounded-2xl border border-violet-100 flex justify-between items-center shadow-inner">
                     <div>
                        <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest">Estimated Disbursement</p>
                        <p className="text-xl font-black text-violet-700 tracking-tighter">
                           ${((parseFloat(formData.basicSalary || 0) + parseFloat(formData.allowances || 0)) - parseFloat(formData.deductions || 0)).toLocaleString()}
                        </p>
                     </div>
                     <button type="submit" disabled={!formData.employeeId} className="px-8 py-3 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 disabled:opacity-30">
                       Confirm Payrun
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}