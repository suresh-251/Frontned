import { useEffect, useState } from "react";
import { 
  Clock, Calendar, Users, X, Search, 
  Plus, Loader2, CheckCircle2, UserPlus, Building2 
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

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col bg-white">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
            <Clock size={22} className="text-indigo-600" /> Shift Management
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Schedules & Rotations</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAssignModal(true)}
            className="bg-slate-50 text-slate-600 border border-slate-200 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all"
          >
            Assign User
          </button>
          <button 
            onClick={() => setShowAddShift(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            + Create Shift
          </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-0">
        
        {/* LEFT: Shift Definitions Table */}
        <div className="col-span-7 border-r border-slate-50 p-6 overflow-y-auto">
          <SectionHeader title="Active Shift Templates" count={shifts.length} />
          <div className="border border-slate-100 rounded-2xl overflow-hidden mt-4">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">Shift Name</th>
                  <th className="px-4 py-3">Timing</th>
                  <th className="px-4 py-3">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shifts.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-[12px] font-black text-slate-700">{s.shiftName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 bg-indigo-50/50 w-fit px-2 py-1 rounded-lg">
                        {s.startTime} - {s.endTime}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-500">
                      Dept ID: {s.departmentId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Assigned Users List */}
        <div className="col-span-5 p-6 bg-slate-50/30 overflow-y-auto">
          <SectionHeader title="Current Assignments" count={assignedUsers.length} />
          <div className="mt-4 space-y-3">
            {assignedUsers.map((user, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-xs">
                    {user.userId}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-800">User Assignment</p>
                    <p className="text-[10px] font-bold text-slate-400">ID: {user.userId}</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-[9px] font-black px-2 py-1 bg-green-50 text-green-600 rounded-md uppercase border border-green-100">
                    Active
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE SHIFT MODAL */}
      <AnimatePresence>
        {showAddShift && (
          <Modal title="Create Shift Template" onClose={() => setShowAddShift(false)}>
            <form onSubmit={handleCreateShift} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField label="Shift Name" value={shiftForm.shiftName} onChange={e => setShiftForm({...shiftForm, shiftName: e.target.value})} placeholder="e.g. Morning Shift" required />
              </div>
              <InputField label="Start Time" type="time" value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})} required />
              <InputField label="End Time" type="time" value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})} required />
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Department</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-300" value={shiftForm.departmentId} onChange={e => setShiftForm({...shiftForm, departmentId: e.target.value})} required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                </select>
              </div>
              <div className="col-span-2 pt-4 flex justify-end gap-3 border-t border-slate-50 mt-2">
                <button type="button" onClick={() => setShowAddShift(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                <button type="submit" className="px-10 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">Save Shift</button>
              </div>
            </form>
          </Modal>
        )}

        {/* ASSIGN SHIFT MODAL */}
        {showAssignModal && (
          <Modal title="Assign Shift to User" onClose={() => setShowAssignModal(false)}>
            <form onSubmit={handleAssignShift} className="space-y-4">
              <InputField label="User ID" type="number" value={assignForm.userId} onChange={e => setAssignForm({...assignForm, userId: e.target.value})} placeholder="Enter Employee ID" required />
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Select Shift</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-300" value={assignForm.shiftId} onChange={e => setAssignForm({...assignForm, shiftId: e.target.value})} required>
                  <option value="">Choose a shift template...</option>
                  {shifts.map(s => <option key={s.shiftId} value={s.shiftId}>{s.shiftName} ({s.startTime}-{s.endTime})</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-50 mt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                <button type="submit" className="px-10 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">Confirm Assignment</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// REUSABLE SUB-COMPONENTS
const SectionHeader = ({ title, count }) => (
  <div className="flex items-center justify-between px-2">
    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{count}</span>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-red-500"/></button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label}</label>
    <input {...props} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 transition-all" />
  </div>
);