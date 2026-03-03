import React, { useState, useEffect } from "react";
import { requestBudgetChange, getBudgetChangeHistory, getDepartments } from "../../api/dept/budgetChange.api";
import { History, Plus, Loader2, X, MapPin, DollarSign } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function BudgetChange() {
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({ departmentId: "", requestedAmount: "", reason: "" });

  const fetchData = async () => {
    try {
      const [histRes, deptRes] = await Promise.all([getBudgetChangeHistory(), getDepartments()]);
      setHistory(histRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) { toast.error("Sync Error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Sending...");
    try {
      await requestBudgetChange({
        ...formData,
        departmentId: parseInt(formData.departmentId),
        requestedAmount: parseFloat(formData.requestedAmount),
        status: "Pending",
        requestedDate: new Date().toISOString(),
        requestDate: new Date().toISOString()
      });
      toast.success("Submitted", { id: tid });
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.status === 403 ? "Forbidden" : "Failed", { id: tid }); }
  };

  return (
    <div className="p-2 max-w-5xl mx-auto">
      <Toaster px-4 py-2 />

      {/* TIGHT HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
          <History size={14} className="text-indigo-600"/> Budget Adjustment Log
        </h1>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-1">
          <Plus size={12} /> New Request
        </button>
      </div>

      {/* COMPACT TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2">Dept / Location</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={18} /></td></tr>
            ) : history.length > 0 ? (
              history.map((item) => {
                const dept = departments.find(d => d.id === item.departmentId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2 font-bold text-slate-800">
                      {dept?.departmentName || `ID: ${item.departmentId}`}
                      <div className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5"><MapPin size={8}/> {dept?.location || "N/A"}</div>
                    </td>
                    <td className="px-3 py-2 font-black text-indigo-600">${item.requestedAmount?.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-500 italic max-w-[150px] truncate">"{item.reason}"</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-md font-black uppercase text-[9px] ${item.status === 'Approved' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {item.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="4" className="py-6 text-center text-slate-300 font-bold uppercase text-[10px]">No History</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SLIM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-[320px] rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Submit Request</h2>
              <button onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400">Department</label>
                <select required className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-[11px] font-bold outline-none"
                  value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
                  <option value="">Select Dept (Location)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.departmentName} — {d.location || "Branch"}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400">Add. Amount ($)</label>
                  <input required type="number" className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-[11px] font-bold" 
                    onChange={(e) => setFormData({...formData, requestedAmount: e.target.value})} />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400">Reason</label>
                  <textarea required rows="2" className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-[11px] font-bold resize-none" 
                    onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                Confirm
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}