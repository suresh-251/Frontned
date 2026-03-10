import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, X, Plus, Loader2, CheckCircle, XCircle, 
  Trash2, User, Send, AlertTriangle, Search, ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useRole } from "../../hooks/useRole"; // Importing your hook
import { getAllLeaves, applyLeave, updateLeaveStatus, deleteLeave } from "../../api/LeaveService";

export default function Leave() {
  const { isManager, isUser } = useRole();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [searchTerm, setSearchTerm] = useState("");

  // Get current User Info for IDs and Names
  const currentUser = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      const decoded = jwtDecode(token);
      return {
        id: decoded.sub || decoded.id,
        name: decoded.unique_name || decoded.username || "Manager"
      };
    } catch { return null; }
  }, []);

  const [formData, setFormData] = useState({
    employeeId: currentUser?.id || 0,
    leaveType: "Annual",
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending",
    approvedBY: null
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllLeaves();
      const allData = res.data || res || [];
      
      // ROLE LOGIC: Manager sees all, User sees only their own ID
      if (isManager) {
        setLeaves(allData);
      } else {
        setLeaves(allData.filter(l => String(l.employeeId) === String(currentUser?.id)));
      }
    } catch {
      toast.error("Registry Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isManager, currentUser?.id]);

  const triggerConfirm = (title, message, action) => {
    setConfirm({ show: true, title, message, onConfirm: action });
  };

  const handleApply = async () => {
    const tid = toast.loading("Routing Request...");
    try {
      // Force User Constraints: Request for self only, status Pending, approvedBy null
      await applyLeave({
        ...formData,
        employeeId: parseInt(currentUser?.id),
        status: "Pending",
        approvedBY: null
      });
      toast.success("Request Logged", { id: tid });
      setShowApplyModal(false);
      setFormData({ ...formData, startDate: "", endDate: "", reason: "" });
      fetchData();
    } catch {
      toast.error("Routing Failed", { id: tid });
    }
  };

  const handleAction = async (leaveId, status) => {
    const tid = toast.loading("Updating Registry...");
    try {
      await updateLeaveStatus(leaveId, {
        status: status,
        approvedBY: currentUser?.name // Manager's name from token
      });
      toast.success(`Leave ${status}`, { id: tid });
      fetchData();
    } catch {
      toast.error("Action Failed", { id: tid });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLeave(id);
      toast.success("Record Purged");
      fetchData();
    } catch {
      toast.error("Delete Restricted");
    }
  };

  const filteredLeaves = leaves.filter(l => 
    l.employeeId?.toString().includes(searchTerm) || 
    l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans transition-all duration-300">
      <Toaster position="top-right" />

      {/* CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xs rounded-2xl p-6 border border-slate-200 text-center shadow-2xl">
              <AlertTriangle size={24} className="text-indigo-500 mx-auto mb-4" />
              <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-1">{confirm.title}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-6">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase border">Cancel</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <Calendar size={22} className="text-indigo-500" /> Leave Terminal
          </h2>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
            <input type="text" placeholder="SEARCH LOGS..." onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border border-slate-200 rounded-md pl-6 pr-2 py-1 text-[9px] font-black outline-none w-40 uppercase" />
          </div>
        </div>
        <button onClick={() => setShowApplyModal(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">
          <Plus size={14} className="inline mr-1" /> New Application
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dates</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized By</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeaves.map((l) => (
              <tr key={l.leaveId} className="hover:bg-slate-50 transition-all">
                <td className="px-5 py-3.5">
                  <p className="text-[12px] font-black text-slate-700 uppercase">ID: #{l.employeeId}</p>
                  <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">{l.leaveType}</span>
                </td>
                <td className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-600">
                  {new Date(l.startDate).toLocaleDateString()} <span className="text-slate-300">→</span> {new Date(l.endDate).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`text-[8px] font-black px-2 py-1 rounded border uppercase tracking-widest ${
                    l.status === 'Approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
                    l.status === 'Rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-amber-50 text-amber-500 border-amber-100'
                  }`}>{l.status}</span>
                </td>
                <td className="px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 italic">
                  {l.approvedBY || <span className="text-slate-300">Pending Review</span>}
                </td>
                <td className="px-5 py-3.5 text-right space-x-1">
                  {isManager && l.status === "Pending" && (
                    <>
                      <button onClick={() => triggerConfirm("Approve", "Approve this leave?", () => handleAction(l.leaveId, "Approved"))} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><CheckCircle size={16}/></button>
                      <button onClick={() => triggerConfirm("Reject", "Reject this leave?", () => handleAction(l.leaveId, "Rejected"))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><XCircle size={16}/></button>
                    </>
                  )}
                  {/* Delete Permission: Manager always, User only their own and if Pending */}
                  {(isManager || (isUser && l.status === "Pending")) && (
                    <button onClick={() => triggerConfirm("Delete", "Delete request?", () => handleDelete(l.leaveId))} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>}
      </div>

      {/* MODAL: APPLY LEAVE */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Send size={14}/> Submit Request</h3>
                <button onClick={() => setShowApplyModal(false)}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); triggerConfirm("Submit", "Route application?", handleApply); }} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">My ID (Locked)</label>
                  <input type="text" disabled value={`#${currentUser?.id}`} className="w-full px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Leave Type</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" onChange={e => setFormData({...formData, leaveType: e.target.value})}>
                      <option value="Annual">Annual</option>
                      <option value="Sick">Sick</option>
                      <option value="Personal">Personal</option>
                      <option value="Maternity">Maternity</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Status</label>
                    <div className="w-full px-3 py-2 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase text-center border border-amber-100">Pending</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Start Date</label>
                    <input type="date" required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold" onChange={e => setFormData({...formData, startDate: new Date(e.target.value).toISOString()})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">End Date</label>
                    <input type="date" required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold" onChange={e => setFormData({...formData, endDate: new Date(e.target.value).toISOString()})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Justification</label>
                  <textarea required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none h-16 resize-none" onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-lg">Confirm Routing</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}