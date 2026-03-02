import React, { useEffect, useState } from "react";
import { 
  Clock, X, Search, Plus, Loader2, CheckCircle2, 
  UserPlus, Building2, Filter, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getShifts, createShift, getAssignedUsers, assignShiftToUser } from "../api/shift.api";
import { getDepartments } from "../api/hr.dept";

export default function Shift() {
  const [shifts, setShifts] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // NEW: Filter State
  const [selectedShiftId, setSelectedShiftId] = useState(null);

  // Form States
  const [shiftForm, setShiftForm] = useState({
    shiftName: "", startTime: "", endTime: "", departmentId: ""
  });
  const [assignForm, setAssignForm] = useState({ userId: "", shiftId: "" });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sData, aData, dData] = await Promise.all([
        getShifts(),
        getAssignedUsers(),
        getDepartments()
      ]);
      setShifts(sData || []);
      setAssignedUsers(aData || []);
      setDepartments(dData || []);
    } catch (err) {
      toast.error("Failed to sync shift data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await createShift({ ...shiftForm, departmentId: Number(shiftForm.departmentId) });
      toast.success("New Shift Created");
      setShowAddShift(false);
      setShiftForm({ shiftName: "", startTime: "", endTime: "", departmentId: "" });
      loadAllData();
    } catch { toast.error("Creation Failed"); }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    try {
      await assignShiftToUser(assignForm.userId, assignForm.shiftId);
      toast.success("Shift Assigned Successfully");
      setShowAssignModal(false);
      loadAllData();
    } catch { toast.error("Assignment Failed"); }
  };

  // Logic: Filter users based on selected shift
  const displayedUsers = selectedShiftId 
    ? assignedUsers.filter(u => u.shiftId === selectedShiftId)
    : assignedUsers;

  const selectedShiftName = shifts.find(s => s.shiftId === selectedShiftId)?.shiftName;

  return (
    <div className="max-w-7xl mx-auto h-[540px] flex flex-col bg-white border border-slate-200 rounded-2xl mt-1 overflow-hidden shadow-sm">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 shrink-0 bg-white">
        <div>
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
            <Clock size={18} className="text-indigo-600" /> Shift Terminal
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Schedules & Assignments</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAssignModal(true)}
            className="bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all"
          >
            Assign User
          </button>
          <button 
            onClick={() => setShowAddShift(true)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            + Create Shift
          </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-0">
        
        {/* LEFT: Shift Templates */}
        <div className="col-span-7 border-r border-slate-100 p-6 overflow-y-auto custom-scrollbar bg-white">
          <SectionHeader title="Shift Templates" count={shifts.length} />
          <p className="text-[9px] text-slate-400 font-bold uppercase mb-4 ml-1">Click a shift to view assigned staff</p>
          
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Shift Name</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shifts.map((s) => (
                  <tr 
                    key={s.shiftId} 
                    onClick={() => setSelectedShiftId(s.shiftId)}
                    className={`cursor-pointer transition-all ${
                      selectedShiftId === s.shiftId 
                      ? "bg-indigo-50/50 border-l-4 border-l-indigo-600" 
                      : "hover:bg-slate-50/50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="text-[11px] font-black text-slate-700 uppercase">{s.shiftName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {s.shiftId}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600">
                        {s.startTime} - {s.endTime}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                       <span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">Template</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Dynamic Staff List */}
        <div className="col-span-5 p-6 bg-slate-50/40 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader 
              title={selectedShiftId ? `Staff: ${selectedShiftName}` : "All Assignments"} 
              count={displayedUsers.length} 
            />
            {selectedShiftId && (
              <button 
                onClick={() => setSelectedShiftId(null)}
                className="text-[9px] font-black text-indigo-600 hover:underline uppercase"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="space-y-2">
            {displayedUsers.length > 0 ? (
              displayedUsers.map((user, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-[11px]">
                      {user.userId}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase">Employee Assignment</p>
                      <p className="text-[9px] font-bold text-slate-400">UID: #{user.userId} • {user.shiftName}</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <Users size={32} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Staff Found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE SHIFT MODAL */}
      <AnimatePresence>
        {showAddShift && (
          <Modal title="New Shift Definition" onClose={() => setShowAddShift(false)}>
            <form onSubmit={handleCreateShift} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField label="Shift Label" value={shiftForm.shiftName} onChange={e => setShiftForm({...shiftForm, shiftName: e.target.value})} placeholder="e.g. MORNING_V1" required />
              </div>
              <InputField label="Start" type="time" value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})} required />
              <InputField label="End" type="time" value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})} required />
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Department</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" value={shiftForm.departmentId} onChange={e => setShiftForm({...shiftForm, departmentId: e.target.value})} required>
                  <option value="">Select Dept...</option>
                  {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                </select>
              </div>
              <button type="submit" className="col-span-2 mt-4 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-indigo-100">Create Template</button>
            </form>
          </Modal>
        )}

        {/* ASSIGN SHIFT MODAL */}
        {showAssignModal && (
          <Modal title="Deploy Staff to Shift" onClose={() => setShowAssignModal(false)}>
            <form onSubmit={handleAssignShift} className="space-y-4">
              <InputField label="Employee ID" type="number" value={assignForm.userId} onChange={e => setAssignForm({...assignForm, userId: e.target.value})} placeholder="Enter UID" required />
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Target Shift</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" value={assignForm.shiftId} onChange={e => setAssignForm({...assignForm, shiftId: e.target.value})} required>
                  <option value="">Select Shift Template...</option>
                  {shifts.map(s => <option key={s.shiftId} value={s.shiftId}>{s.shiftName} ({s.startTime})</option>)}
                </select>
              </div>
              <button type="submit" className="w-full mt-4 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">Confirm Deployment</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// SUB-COMPONENTS
const SectionHeader = ({ title, count }) => (
  <div className="flex items-center gap-2">
    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
    <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">{count}</span>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
      <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-indigo-600 transition-colors"/></button>
      </div>
      <div className="p-8">{children}</div>
    </motion.div>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label}</label>
    <input {...props} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-400 transition-all" />
  </div>
);