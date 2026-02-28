import { useEffect, useState } from "react";
import { 
  Clock, CheckCircle2, XCircle, Plus, User, 
  Loader2, Calendar, ChevronRight, Search, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import hrApi from "../../api/hr.api"; 
import { getAdminUsers } from "../../../api/admin/users.api";

export default function OTApproval() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    userId: "",
    validFrom: "",
    validTo: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [otRes, userRes] = await Promise.all([
        hrApi.get("api/OvertimeApproval"),
        getAdminUsers({ page: 1, pageSize: 100 })
      ]);
      setRequests(otRes.data || []);
      setEmployees(userRes?.users || []);
    } catch { toast.error("Sync Error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getEmpName = (id) => {
    const emp = employees.find(e => e.userId === id);
    return emp ? (emp.name || emp.username) : `User #${id}`;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await hrApi.post("api/OvertimeApproval", {
        userId: parseInt(formData.userId),
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString()
      });
      toast.success("Request Created");
      setShowModal(false);
      fetchData();
    } catch { toast.error("Request Failed"); }
  };

  const handleDecision = async (item, status) => {
    try {
      const id = item.id || item.overtimeApprovalId;
      await hrApi.put(`api/OvertimeApproval/${id}`, {
        validFrom: item.validFrom,
        validTo: item.validTo,
        isApproved: status
      });
      toast.success(status ? "Approved" : "Rejected");
      fetchData();
    } catch { toast.error("Update Failed"); }
  };

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col bg-white font-sans">
      <Toaster position="top-right" />
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
            <Clock size={22} className="text-indigo-600" /> OT Approvals
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authorization Queue</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input 
              type="text" placeholder="Search User ID..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Validity Window</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.filter(r => r.userId.toString().includes(searchTerm)).map((item) => (
                  <tr key={item.id || item.overtimeApprovalId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <User size={14} />
                         </div>
                         <div>
                            <p className="text-[12px] font-black text-slate-700">{getEmpName(item.userId)}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {item.userId}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                       <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600">
                          <span className="text-indigo-600">{new Date(item.validFrom).toLocaleDateString()}</span>
                          <ChevronRight size={10} className="text-slate-300"/>
                          <span className="text-rose-500">{new Date(item.validTo).toLocaleDateString()}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                        item.isApproved ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelected(item)} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><Eye size={14}/></button>
                        <button onClick={() => handleDecision(item, true)} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-green-600 transition-all"><CheckCircle2 size={14}/></button>
                        <button onClick={() => handleDecision(item, false)} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-red-600 transition-all"><XCircle size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL (Dossier Style) */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Approval Details</h3>
                <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-red-500"><XCircle size={16}/></button>
              </div>
              <div className="grid grid-cols-2 gap-y-5 gap-x-2">
                <MiniInfo label="Employee" value={getEmpName(selected.userId)} icon={<User size={10}/>}/>
                <MiniInfo label="Status" value={selected.isApproved ? "Approved" : "Pending"} icon={<Search size={10}/>}/>
                <MiniInfo label="Valid From" value={new Date(selected.validFrom).toLocaleString()} icon={<Calendar size={10}/>}/>
                <MiniInfo label="Valid To" value={new Date(selected.validTo).toLocaleString()} icon={<Calendar size={10}/>}/>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-50 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL (3-COLUMN FITTED) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
               <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Create OT Request</h3>
                  <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleCreate} className="p-8 grid grid-cols-3 gap-x-5 gap-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Select Personnel</label>
                    <select 
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" 
                      onChange={e => setFormData({...formData, userId: e.target.value})}
                    >
                      <option value="">Choose User...</option>
                      {employees.map(user => (
                        <option key={user.userId} value={user.userId}>{user.name || user.username}</option>
                      ))}
                    </select>
                  </div>
                  <InputField 
                    label="Valid From" 
                    type="datetime-local" 
                    onChange={e => setFormData({...formData, validFrom: e.target.value})} 
                  />
                  <InputField 
                    label="Valid To" 
                    type="datetime-local" 
                    onChange={e => setFormData({...formData, validTo: e.target.value})} 
                  />
                  <div className="col-span-3 pt-6 flex justify-end gap-3 border-t border-slate-50 mt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                    <button type="submit" className="px-10 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">
                       Submit Request
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

// SHARED MINI COMPONENTS
const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label}</label>
    <input {...props} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 transition-all" />
  </div>
);

const MiniInfo = ({ label, value, icon }) => (
  <div className="overflow-hidden">
    <div className="flex items-center gap-1 text-indigo-500 mb-0.5">
      {icon}
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
    </div>
    <p className="text-[10px] font-bold text-slate-700 truncate pl-4">{value || '—'}</p>
  </div>
);