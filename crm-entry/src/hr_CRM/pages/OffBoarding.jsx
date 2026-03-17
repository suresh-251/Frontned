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

  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      const decoded = jwtDecode(token);
      return { id: decoded.sub || decoded.id };
    } catch { return null; }
  }, []);

  const [form, setForm] = useState({
    employeeId: auth?.id || "", resignationDate: "", lastWorkingDate: "", reason: "", accountDeactivation: false
  });

  const [statusForm, setStatusForm] = useState({
    knowledgeTransferStatus: "Pending", assetReturnStatus: "Pending", exitInterviewStatus: "Pending", overallStatus: "In Progress"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getOffBoardingList();
      // Handle plain array, .NET $values wrapper, or { data: [] } wrapper
      let rawData = [];
      if (Array.isArray(res)) rawData = res;
      else if (Array.isArray(res?.$values)) rawData = res.$values;
      else if (Array.isArray(res?.data)) rawData = res.data;

      if (isManager) {
        setList(rawData);
      } else {
        setList(rawData.filter(item => item && String(item.employeeId) === String(auth?.id)));
      }
    } catch {
      toast.error("Sync Failure");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (auth?.id) loadData(); }, [isManager, auth?.id]);

  const handleActionRequest = (title, action) => { setConfirm({ show: true, title, action }); };
  const formatDate = (d) => d ? d.replace(/-/g, '/') : "";

  const executeCreate = async () => {
    const tid = toast.loading("Initiating...");
    try {
      await createOffBoarding({
        ...form,
        employeeId: Number(auth?.id),
        resignationDate: formatDate(form.resignationDate),
        lastWorkingDate: formatDate(form.lastWorkingDate)
      });
      toast.success("Exit Logged", { id: tid });
      setShowCreate(false); loadData();
    } catch { toast.error("Failed", { id: tid }); }
  };

  const executeDelete = async (id) => {
    const tid = toast.loading("Purging...");
    try {
      await deleteOffBoarding(id);
      toast.success("Deleted", { id: tid });
      if (selectedId === id) setSelectedId(null);
      loadData();
    } catch { toast.error("Failed", { id: tid }); }
  };

  // ✅ STABILITY FIX: Added safe navigation for employeeId
  const filteredList = useMemo(() => {
    return list.filter(item =>
      String(item?.employeeId ?? "").includes(searchId)
    );
  }, [list, searchId]);

  const selectedData = list.find(item => item.id === selectedId);

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans transition-all duration-300">
      <Toaster position="top-right" />

      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl">
              <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
              <h3 className="text-[12px] font-black uppercase mb-4">{confirm.title}?</h3>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({show:false})} className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase">No</button>
                <button onClick={() => { confirm.action(); setConfirm({show:false}); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase">Yes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase"><LogOut size={22} className="text-rose-500" /> Exit Terminal</h2>
        <div className="flex gap-2">
            <input type="text" placeholder="FILTER ID..." className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-[9px] font-black outline-none w-24" onChange={(e) => setSearchId(e.target.value)}/>
            {isUser && list.length === 0 && (
                <button onClick={() => setShowCreate(true)} className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2">
                    <Plus size={14} strokeWidth={3} /> Initiate Exit
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Last Day</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={3} className="px-5 py-8 text-center"><Loader2 size={18} className="animate-spin mx-auto text-slate-300" /></td></tr>
              )}
              {!loading && filteredList.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-[9px] font-black text-slate-300 uppercase">No records found</td></tr>
              )}
              {!loading && filteredList.map((item) => (
                <tr key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer ${selectedId === item.id ? "bg-rose-50" : "hover:bg-slate-50"}`}>
                  <td className="px-5 py-3.5 relative">
                    {selectedId === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}
                    <p className="font-black text-slate-700 uppercase leading-none">ID: #{item.employeeId || "---"}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[200px]">{item.reason || "No Reason"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 uppercase">
                      {item.lastWorkingDate ? item.lastWorkingDate.split('T')[0].replace(/-/g, '/') : "---"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={(e) => {e.stopPropagation(); handleActionRequest("Delete Record", () => executeDelete(item.id));}} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 min-h-[350px] shadow-sm">
            {selectedData ? (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 border-b pb-2">Record Inspector</h3>
                    <StatusRow label="Knowledge Transfer" status={selectedData.knowledgeTransferStatus} />
                    <StatusRow label="Asset Return" status={selectedData.assetReturnStatus} />
                    <StatusRow label="Exit Interview" status={selectedData.exitInterviewStatus} />
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Current Lifecycle</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase">{selectedData.overallStatus || "Processing"}</p>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center py-24 opacity-20"><Search size={32} /><p className="text-[10px] font-black uppercase mt-2">Select a record</p></div>
            )}
        </div>
      </div>
    </div>
  );
}

const StatusRow = ({ label, status }) => (
    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
      <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
      <span className={`text-[9px] font-black uppercase ${status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{status || "Pending"}</span>
    </div>
);