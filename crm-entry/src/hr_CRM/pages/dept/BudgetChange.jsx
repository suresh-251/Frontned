import React, { useState, useEffect } from "react";
import { requestBudgetChange, getBudgetChangeHistory } from "../../api/dept/budgetChange.api";
import { getDepartments } from "../../api/hr.dept";
import { History, Plus, Search, Loader2, X, AlertCircle, MessageSquare, DollarSign } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function BudgetChange() {
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    departmentId: "",
    requestedAmount: "",
    reason: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Using try-catch for each to prevent one failure from blocking the other
      const deptRes = await getDepartments();
      setDepartments(deptRes.data || []);
      
      const histRes = await getBudgetChangeHistory();
      setHistory(histRes.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Submitting request...");
    try {
      const payload = {
        departmentId: parseInt(formData.departmentId),
        requestedAmount: parseFloat(formData.requestedAmount),
        reason: formData.reason
      };
      await requestBudgetChange(payload);
      toast.success("Change request submitted", { id: tid });
      setShowModal(false);
      setFormData({ departmentId: "", requestedAmount: "", reason: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed", { id: tid });
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Budget Adjustments</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Request & History Tracking</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} /> Request Change
        </button>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
           <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <History size={16}/> Modification Log
           </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Amt</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reasoning</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={32} />
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Retrieving Log...</span>
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <span className="font-black text-slate-700">{item.departmentName || `ID: ${item.departmentId}`}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1 text-indigo-600 font-black">
                        <DollarSign size={14}/>
                        {item.requestedAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-5 max-w-xs">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={14} className="text-slate-300 mt-1 shrink-0" />
                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                          "{item.reason || 'No justification provided'}"
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                        Pending Approval
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No change requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUEST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Request Budget Change</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Target Department</label>
                <select 
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 appearance-none"
                  onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Additional Amount ($)</label>
                <input 
                  required type="number"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700"
                  placeholder="e.g. 5000"
                  onChange={(e) => setFormData({...formData, requestedAmount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Justification / Reason</label>
                <textarea 
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 resize-none"
                  rows="4"
                  placeholder="Explain why this budget increase is required..."
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 items-start border border-amber-100">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <p className="text-[10px] font-bold text-amber-700 leading-normal">
                  Note: All budget change requests are subject to audit and require final approval from the Finance Department.
                </p>
              </div>

              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}