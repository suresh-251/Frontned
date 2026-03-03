import React, { useState, useEffect } from "react";
import { createDepartmentBudget, getDepartmentBudgets } from "../../api/dept/deptBudget.api";
import { getDepartments } from "../../api/hr.dept";
import { Wallet, Plus, Loader2, X, BookOpen, HardDrive } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function DeptBudget() {
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    departmentId: "",
    totalAnnualBudget: "",
    trainingBudget: "",
    resourceBudget: "",
    year: new Date().getFullYear()
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budRes, deptRes] = await Promise.all([
        getDepartmentBudgets(),
        getDepartments()
      ]);
      // The API returns 'id' as the primary key in GET
      setBudgets(budRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Financial sync failed. Check permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Ensure budgets add up or are logical
    if (parseFloat(formData.trainingBudget) + parseFloat(formData.resourceBudget) > parseFloat(formData.totalAnnualBudget)) {
      toast.error("Sub-budgets exceed Total Annual Budget!");
      return;
    }

    const tid = toast.loading("Allocating funds...");
    try {
      const payload = {
        departmentId: parseInt(formData.departmentId),
        totalAnnualBudget: parseFloat(formData.totalAnnualBudget),
        trainingBudget: parseFloat(formData.trainingBudget),
        resourceBudget: parseFloat(formData.resourceBudget),
        year: parseInt(formData.year)
      };

      await createDepartmentBudget(payload);
      toast.success("Budget Allocated Successfully", { id: tid });
      setShowModal(false);
      
      // Reset Form
      setFormData({
        departmentId: "",
        totalAnnualBudget: "",
        trainingBudget: "",
        resourceBudget: "",
        year: new Date().getFullYear()
      });
      
      fetchData();
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        toast.error("Access Denied: You don't have permission to create budgets.", { id: tid });
      } else {
        toast.error(err.response?.data?.message || "Allocation failed", { id: tid });
      }
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Fiscal Management</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Budget Overview</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} /> New Allocation
        </button>
      </div>

      {/* BUDGET CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-indigo-600" size={40} />
            <p className="mt-4 text-slate-500 font-bold">Loading Ledger...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No budget allocations found</p>
          </div>
        ) : (
          budgets.map((b) => (
            <div key={b.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                  <Wallet size={24} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">FY {b.year}</span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                    b.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-1">
                {departments.find(d => d.id === b.departmentId)?.departmentName || `Dept ID: ${b.departmentId}`}
              </h3>
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-2xl font-black text-indigo-600">
                  ${b.totalAnnualBudget?.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual Total</span>
              </div>

              <div className="space-y-4">
                {/* Training */}
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                    <span className="text-slate-400 flex items-center gap-1"><BookOpen size={10}/> Training</span>
                    <span className="text-slate-700">${b.trainingBudget?.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${(b.trainingBudget / b.totalAnnualBudget) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                    <span className="text-slate-400 flex items-center gap-1"><HardDrive size={10}/> Resources</span>
                    <span className="text-slate-700">${b.resourceBudget?.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${(b.resourceBudget / b.totalAnnualBudget) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ALLOCATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-50">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Financial Allocation</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Department</label>
                  <select 
                    required
                    className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Annual Cap ($)</label>
                    <input required type="number" className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                      placeholder="e.g. 50000" value={formData.totalAnnualBudget} onChange={(e) => setFormData({...formData, totalAnnualBudget: e.target.value})} />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Training ($)</label>
                    <input required type="number" className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                      placeholder="10000" value={formData.trainingBudget} onChange={(e) => setFormData({...formData, trainingBudget: e.target.value})} />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Resources ($)</label>
                    <input required type="number" className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                      placeholder="40000" value={formData.resourceBudget} onChange={(e) => setFormData({...formData, resourceBudget: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fiscal Year</label>
                  <input required type="number" className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                    value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-6">
                Confirm Allocation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
