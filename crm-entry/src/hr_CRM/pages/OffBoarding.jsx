import React, { useEffect, useState, useMemo } from "react";
import { 
  LogOut, X, Search, Plus, Loader2, Trash2, 
  ClipboardList, CheckCircle, AlertTriangle, Info, ShieldAlert 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { useRole } from "../hooks/useRole";
import { 
  getOffBoardingList, 
  getOffBoardingById,
  createOffBoarding, 
  updateOffBoardingStatus, 
  deleteOffBoarding 
} from "../api/offboarding.api";
import toast, { Toaster } from "react-hot-toast";

export default function OffBoarding() {
  const { isManager, isUser } = useRole();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [confirm, setConfirm] = useState({ show: false, title: "", action: null });

  // Current User Identity from JWT
  const currentUser = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      const decoded = jwtDecode(token);
      return {
        id: decoded.sub || decoded.id,
        name: decoded.username || "Authorized User"
      };
    } catch { return null; }
  }, []);

  // Creation Form
  const [form, setForm] = useState({
    employeeId: currentUser?.id || "",
    resignationDate: "",
    lastWorkingDate: "",
    reason: "",
    accountDeactivation: false // Default to Pending (False) as requested
  });

  // Manager Status Form
  const [statusForm, setStatusForm] = useState({
    knowledgeTransferStatus: "Pending",
    assetReturnStatus: "Pending",
    exitInterviewStatus: "Pending",
    overallStatus: "In Progress"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (isManager) {
        // Manager fetches all records
        const data = await getOffBoardingList();
        setList(data || []);
      } else {
        // User fetches specifically their record by matching ID
        // Note: We search the full list for their ID to ensure UI consistency
        const data = await getOffBoardingList();
        const myData = data.filter(item => String(item.employeeId) === String(currentUser?.id));
        setList(myData);
      }
    } catch { 
      toast.error("Sync Failure");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { if (currentUser) loadData(); }, [isManager, currentUser?.id]);

  const handleActionRequest = (title, action) => {
    setConfirm({ show: true, title, action });
  };

  const executeCreate = async () => {
    const tid = toast.loading("Initiating Exit...");
    try {
      await createOffBoarding({
        ...form,
        employeeId: Number(currentUser?.id), // Force current user ID
        resignationDate: new Date(form.resignationDate).toISOString(),
        lastWorkingDate: new Date(form.lastWorkingDate).toISOString()
      });
      toast.success("Exit Logged", { id: tid });
      setShowCreate(false);
      loadData();
    } catch { toast.error("Creation Failed", { id: tid }); }
  };

  const executeUpdate = async () => {
    const tid = toast.loading("Updating Terminal State...");
    try {
      await updateOffBoardingStatus(selectedId, statusForm);
      toast.success("Synchronized", { id: tid });
      setShowStatusModal(false);
      loadData();
    } catch { toast.error("Update Failed", { id: tid }); }
  };

  const executeDelete = async (id) => {
    const tid = toast.loading("Purging Record...");
    try {
      await deleteOffBoarding(id);
      toast.success("Record Deleted", { id: tid });
      if (selectedId === id) setSelectedId(null);
      loadData();
    } catch { toast.error("Purge Failed", { id: tid }); }
  };

  const filteredList = list.filter(item => item.employeeId.toString().includes(searchId));
  const selectedData = list.find(item => item.id === selectedId);

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans transition-all duration-300">
      <Toaster position="top-right" />

      {/* CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-2xl p-6 border border-slate-200 text-center shadow-2xl">
              <Info size={30} className="mx-auto text-amber-500 mb-3" />
              <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-4">{confirm.title}?</h3>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({show:false})} className="flex-1 py-2 bg-slate-50 border text-slate-400 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                <button onClick={() => { confirm.action(); setConfirm({show:false}); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <LogOut size={22} className="text-rose-500" /> Exit Terminal
          </h2>
          <div className="flex items-center gap-2 mt-1">
             <input type="text" placeholder="FILTER ID..." className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-[9px] font-black outline-none w-24" onChange={(e) => setSearchId(e.target.value)}/>
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{isManager ? "Global View" : "My Terminal"}</span>
          </div>
        </div>
        {/* Only User can initiate their own exit */}
        {isUser && list.length === 0 && (
            <button onClick={() => setShowCreate(true)} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2">
            <Plus size={14} strokeWidth={3} /> Initiate Exit
            </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: Records Table */}
        <div className="col-span-12 lg:col-span-8 space-y-2">
          <SectionHeader title="Active Exit Records" count={filteredList.length} />
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Last Day</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Overall</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer transition-all ${selectedId === item.id ? "bg-rose-50" : "hover:bg-slate-50"}`}>
                    <td className="px-5 py-3.5 relative text-[12px]">
                      {selectedId === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}
                      <p className="font-black text-slate-700 uppercase leading-none">ID: #{item.employeeId}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[200px]">{item.reason}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 uppercase">
                        {new Date(item.lastWorkingDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${item.overallStatus === 'Closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {item.overallStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {isManager && (
                        <button onClick={(e) => {e.stopPropagation(); setSelectedId(item.id); setShowStatusModal(true);}} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"><ClipboardList size={14}/></button>
                      )}
                      <button onClick={(e) => {e.stopPropagation(); handleActionRequest("Purge Record", () => executeDelete(item.id));}} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-500" /></div>}
            {!loading && filteredList.length === 0 && <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No Records found</div>}
          </div>
        </div>

        {/* RIGHT: Checklist Monitor */}
        <div className="col-span-12 lg:col-span-4 space-y-2">
          <SectionHeader title="Inspector Terminal" count={selectedId ? "Live" : "Idle"} />
          <div className="bg-white p-5 rounded-xl border border-slate-200 min-h-[350px] shadow-sm">
            {selectedData ? (
              <div className="space-y-4">
                <StatusRow label="Knowledge Transfer" status={selectedData.knowledgeTransferStatus} />
                <StatusRow label="Asset Return" status={selectedData.assetReturnStatus} />
                <StatusRow label="Exit Interview" status={selectedData.exitInterviewStatus} />
                
                <div className="pt-4 border-t border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><ShieldAlert size={10}/> Account Deactivation</p>
                   <div className={`text-[10px] font-black p-3 rounded-xl text-center uppercase border shadow-sm ${selectedData.accountDeactivation ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {selectedData.accountDeactivation ? "Access Revoked" : "Pending Deactivation"}
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-24 opacity-20">
                <Search size={32} />
                <p className="text-[10px] font-black uppercase mt-2 tracking-widest italic">Select a record</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showCreate && (
          <Modal title="Initiate Exit Application" onClose={() => setShowCreate(false)}>
            <form onSubmit={(e) => {e.preventDefault(); handleActionRequest("Confirm Application", executeCreate);}} className="space-y-4">
              <div className="opacity-50">
                <InputField label="Employee ID" value={currentUser?.id} disabled />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Resignation Date" type="date" required onChange={e => setForm({...form, resignationDate: e.target.value})} />
                <InputField label="Last Working Date" type="date" required onChange={e => setForm({...form, lastWorkingDate: e.target.value})} />
              </div>
              <InputField label="Primary Reason" placeholder="Describe reason for leaving..." required onChange={e => setForm({...form, reason: e.target.value})} />
              <button type="submit" className="w-full py-3 bg-rose-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Submit Exit Request</button>
            </form>
          </Modal>
        )}

        {showStatusModal && (
          <Modal title="Terminal Update (Manager Only)" onClose={() => setShowStatusModal(false)}>
            <form onSubmit={(e) => {e.preventDefault(); handleActionRequest("Sync Terminal", executeUpdate);}} className="space-y-4">
              <StatusSelect label="Knowledge Transfer" value={statusForm.knowledgeTransferStatus} onChange={v => setStatusForm({...statusForm, knowledgeTransferStatus: v})} />
              <StatusSelect label="Asset Management" value={statusForm.assetReturnStatus} onChange={v => setStatusForm({...statusForm, assetReturnStatus: v})} />
              <StatusSelect label="Exit Interview" value={statusForm.exitInterviewStatus} onChange={v => setStatusForm({...statusForm, exitInterviewStatus: v})} />
              <InputField label="Overall Progression Status" value={statusForm.overallStatus} onChange={e => setStatusForm({...statusForm, overallStatus: e.target.value})} />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Sync All States</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// SHARED MINI COMPONENTS
const SectionHeader = ({ title, count }) => (
  <div className="flex items-center justify-between mb-1 px-1">
    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h3>
    <span className="text-[9px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full border border-rose-100">{count}</span>
  </div>
);

const StatusRow = ({ label, status }) => (
  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
    <span className={`text-[9px] font-black uppercase ${status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{status || "Pending"}</span>
  </div>
);

const StatusSelect = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">{label}</label>
    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" value={value} onChange={e => onChange(e.target.value)}>
      <option value="Pending">Pending</option>
      <option value="Completed">Completed</option>
      <option value="Waived">Waived</option>
    </select>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center rounded-t-3xl">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">{title}</h3>
        <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:opacity-50" />
  </div>
);