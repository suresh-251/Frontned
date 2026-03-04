import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  getAllOvertimeApprovals, 
  createOvertimeApproval, 
  updateOvertimeApproval 
} from "../../api/overtimeApproval.api";
import { getAdminUsers } from "../../../api/admin/users.api";
import { 
  Clock, Plus, Loader2, X, CheckCircle2, XCircle, 
  User, Search, ArrowRight, AlertCircle, Check 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function OvertimeApproval() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Custom Searchable Dropdown States
  const [empSearch, setEmpSearch] = useState("");
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    userId: "",
    validFrom: "",
    validTo: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [otRes, empRes] = await Promise.all([
        getAllOvertimeApprovals(),
        getAdminUsers({ page: 1, pageSize: 500 })
      ]);
      setRecords(Array.isArray(otRes) ? otRes : []);
      setEmployees(empRes?.users || []);
    } catch (err) {
      toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Handle clicking outside the custom dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEmpDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!empSearch) return [];
    return employees.filter(emp => 
      emp.username?.toLowerCase().includes(empSearch.toLowerCase()) || 
      emp.userId?.toString().includes(empSearch)
    ).slice(0, 5); // Limit to top 5 results for clarity
  }, [empSearch, employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find(emp => emp.userId.toString() === formData.userId.toString());
  }, [formData.userId, employees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      toast.error("Please select a valid employee from the list");
      return;
    }
    const tid = toast.loading("Submitting...");
    try {
      await createOvertimeApproval({
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString()
      });
      toast.success("Request Logged", { id: tid });
      closeModal();
      fetchData();
    } catch (err) {
      toast.error("Submission failed", { id: tid });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ userId: "", validFrom: "", validTo: "" });
    setEmpSearch("");
  };

  const handleStatusUpdate = async (record, isApproved) => {
    const tid = toast.loading("Updating...");
    try {
      await updateOvertimeApproval(record.overtimeApprovalId || record.id, {
        validFrom: record.validFrom,
        validTo: record.validTo,
        isApproved: isApproved
      });
      toast.success(isApproved ? "Approved" : "Rejected", { id: tid });
      fetchData();
    } catch (err) {
      toast.error("Update failed", { id: tid });
    }
  };

  const filteredRecords = records.filter(r => 
    r.userId?.toString().includes(searchTerm) || 
    r.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2 tracking-tighter uppercase">
            <Clock size={18} className="text-indigo-600" /> Overtime Registry
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Employee Authorizations</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
            <input 
              type="text" placeholder="Search logs..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-8 py-1.5 w-40 outline-none focus:ring-1 focus:ring-indigo-200"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5"
          >
            <Plus size={12} /> Log Request
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && records.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={20} /></div>
        ) : (
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm max-w-5xl mx-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-auto">Employee Details</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-64">Timeframe</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-28">Status</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map((record) => (
                  <tr key={record.overtimeApprovalId || record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 shrink-0">
                          <User size={12}/>
                        </div>
                        <div className="flex flex-col truncate">
                          <p className="text-[11px] font-black text-slate-700 uppercase truncate">
                            {record.userName || "Unknown User"}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">ID: {record.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-bold text-[10px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>{new Date(record.validFrom).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span>{new Date(record.validTo).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded border font-black uppercase text-[8px] ${
                        record.isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {record.isApproved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStatusUpdate(record, true)} disabled={record.isApproved} className={`p-1 rounded ${record.isApproved ? 'text-slate-200' : 'text-emerald-500 hover:bg-emerald-50'}`}><CheckCircle2 size={14}/></button>
                        <button onClick={() => handleStatusUpdate(record, false)} className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded"><XCircle size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL WITH SEARCHABLE INPUT */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-xl shadow-xl border border-slate-100">
               <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Log Overtime</h3>
                  <button onClick={closeModal}><X size={14} className="text-slate-400"/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* SEARCHABLE EMPLOYEE FIELD */}
                  <div className="space-y-1 relative" ref={dropdownRef}>
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Search Employee (Name or ID)</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Type name or ID..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-300"
                        value={empSearch}
                        onFocus={() => setShowEmpDropdown(true)}
                        onChange={(e) => {
                          setEmpSearch(e.target.value);
                          setShowEmpDropdown(true);
                          // Reset selection if typing
                          if(formData.userId) setFormData({...formData, userId: ""});
                        }}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={12}/>
                    </div>

                    {/* CUSTOM DROPDOWN LIST */}
                    <AnimatePresence>
                      {showEmpDropdown && filteredEmployees.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-lg overflow-hidden max-h-40 overflow-y-auto"
                        >
                          {filteredEmployees.map(emp => (
                            <button
                              key={emp.userId}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, userId: emp.userId.toString()});
                                setEmpSearch(emp.username);
                                setShowEmpDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center justify-between group"
                            >
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-700 uppercase">{emp.username}</span>
                                <span className="text-[8px] font-bold text-slate-400">ID: {emp.userId}</span>
                              </div>
                              <Check size={12} className={`text-indigo-600 ${formData.userId === emp.userId.toString() ? 'opacity-100' : 'opacity-0'}`} />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Selected Badge */}
                    {selectedEmployee && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-1">
                        <CheckCircle2 size={12} className="text-emerald-500"/>
                        <p className="text-[9px] font-black text-emerald-700 uppercase">Selected: {selectedEmployee.username}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Starts</label>
                      <input required type="datetime-local" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 outline-none" value={formData.validFrom} onChange={(e) => setFormData({...formData, validFrom: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Ends</label>
                      <input required type="datetime-local" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 outline-none" value={formData.validTo} onChange={(e) => setFormData({...formData, validTo: e.target.value})} />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button type="button" onClick={closeModal} className="px-4 py-1.5 text-[9px] font-black uppercase text-slate-400">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={!selectedEmployee}
                      className="px-6 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      Confirm Log
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