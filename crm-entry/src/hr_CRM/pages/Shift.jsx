// import React, { useEffect, useState } from "react";
// import { 
//   Clock, X, Search, Plus, Loader2, CheckCircle2, 
//   UserPlus, Building2, Filter, Users
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { getShifts, createShift, getAssignedUsers, assignShiftToUser } from "../api/shift.api";
// import { getDepartments } from "../api/hr.dept";
// import { getAdminUsers } from "../../api/admin/users.api";

// export default function Shift() {
//   const [shifts, setShifts] = useState([]);
//   const [assignedUsers, setAssignedUsers] = useState([]);
//   const [userLookup, setUserLookup] = useState({}); // New state to map ID -> Username
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showAddShift, setShowAddShift] = useState(false);
//   const [showAssignModal, setShowAssignModal] = useState(false);
  
//   const [selectedShiftId, setSelectedShiftId] = useState(null);

//   // Form States
//   const [shiftForm, setShiftForm] = useState({
//     shiftName: "", startTime: "", endTime: "", departmentId: ""
//   });
//   const [assignForm, setAssignForm] = useState({ userId: "", shiftId: "" });

//   const loadAllData = async () => {
//     setLoading(true);
//     try {
//       const [sData, aData, dData, uData] = await Promise.all([
//         getShifts(),
//         getAssignedUsers(),
//         getDepartments(),
//         getAdminUsers({ page: 1, pageSize: 100 }) // Fetch user details
//       ]);

//       // Create a lookup object: { "userId": "userName" }
//       const lookup = {};
//       (uData?.users || []).forEach(user => {
//         lookup[user.userId] = user.username || user.name;
//       });

//       setUserLookup(lookup);
//       setShifts(sData || []);
//       setAssignedUsers(aData || []);
//       setDepartments(dData || []);
//     } catch (err) {
//       toast.error("Failed to sync shift data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadAllData(); }, []);

//   const handleCreateShift = async (e) => {
//     e.preventDefault();
//     try {
//       await createShift({ ...shiftForm, departmentId: Number(shiftForm.departmentId) });
//       toast.success("New Shift Created");
//       setShowAddShift(false);
//       setShiftForm({ shiftName: "", startTime: "", endTime: "", departmentId: "" });
//       loadAllData();
//     } catch { toast.error("Creation Failed"); }
//   };

//   const handleAssignShift = async (e) => {
//     e.preventDefault();
//     try {
//       await assignShiftToUser(assignForm.userId, assignForm.shiftId);
//       toast.success("Shift Assigned Successfully");
//       setShowAssignModal(false);
//       loadAllData();
//     } catch { toast.error("Assignment Failed"); }
//   };

//   const displayedUsers = selectedShiftId 
//     ? assignedUsers.filter(u => u.shiftId === selectedShiftId)
//     : assignedUsers;

//   const selectedShiftName = shifts.find(s => s.shiftId === selectedShiftId)?.shiftName;

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
//       <Toaster position="top-right" />

//       {/* COMPACT HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
//             <Clock size={22} className="text-indigo-600" /> Shift Terminal
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Schedules & Assignments</p>
//         </div>

//         <div className="flex items-center gap-2">
//           <button 
//             onClick={() => setShowAssignModal(true)}
//             className="bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100 transition-all shadow-sm"
//           >
//             Assign User
//           </button>
//           <button 
//             onClick={() => setShowAddShift(true)}
//             className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
//           >
//             <Plus size={14} strokeWidth={3} /> Create Shift
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-12 gap-4">
//         {/* LEFT: Shift Templates */}
//         <div className="col-span-12 lg:col-span-7 space-y-2">
//           <SectionHeader title="Shift Templates" count={shifts.length} />
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//             <table className="w-full text-left border-collapse">
//               <thead className="bg-slate-50 border-b border-slate-200">
//                 <tr>
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Shift Name</th>
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Duration</th>
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {loading && shifts.length === 0 ? (
//                   <tr><td colSpan="3" className="py-10 text-center"><Loader2 className="animate-spin inline text-indigo-500" /></td></tr>
//                 ) : (
//                   shifts.map((s) => (
//                     <tr 
//                       key={s.shiftId} 
//                       onClick={() => setSelectedShiftId(s.shiftId)}
//                       className={`cursor-pointer transition-all ${selectedShiftId === s.shiftId ? "bg-indigo-50/50" : "hover:bg-slate-50/50"}`}
//                     >
//                       <td className="px-5 py-3.5 relative">
//                         {selectedShiftId === s.shiftId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />}
//                         <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-0.5">{s.shiftName}</p>
//                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">ID: {s.shiftId}</p>
//                       </td>
//                       <td className="px-5 py-3.5 text-center">
//                         <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase">
//                           {s.startTime} — {s.endTime}
//                         </span>
//                       </td>
//                       <td className="px-5 py-3.5 text-right">
//                          <span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase">Template</span>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* RIGHT: Dynamic Staff List with Username Mapping */}
//         <div className="col-span-12 lg:col-span-5 space-y-2">
//           <div className="flex items-center justify-between">
//             <SectionHeader 
//               title={selectedShiftId ? `Staff: ${selectedShiftName}` : "All Assignments"} 
//               count={displayedUsers.length} 
//             />
//             {selectedShiftId && (
//               <button 
//                 onClick={() => setSelectedShiftId(null)}
//                 className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors"
//               >
//                 Clear Filter
//               </button>
//             )}
//           </div>

//           <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
//             {displayedUsers.length > 0 ? (
//               displayedUsers.map((user, idx) => {
//                 const username = userLookup[user.userId] || "Loading...";
//                 return (
//                   <motion.div 
//                     initial={{ opacity: 0, y: 5 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     key={idx} 
//                     className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-[11px] border uppercase ${username === "Loading..." ? "bg-slate-50 text-slate-300 border-slate-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"}`}>
//                         {username.charAt(0)}
//                       </div>
//                       <div>
//                         {/* FIXED: Displays username mapped from getAdminUsers */}
//                         <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-0.5">
//                           {username}
//                         </p>
//                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
//                           UID: #{user.userId} • {user.shiftName}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
//                   </motion.div>
//                 );
//               })
//             ) : (
//               <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-xl border border-dashed border-slate-300 text-slate-300">
//                 <Users size={32} className="mb-2 opacity-20" />
//                 <p className="text-[10px] font-black uppercase tracking-widest">No Staff Linked</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* MODALS */}
//       <AnimatePresence>
//         {showAddShift && (
//           <Modal title="New Shift Definition" onClose={() => setShowAddShift(false)}>
//             <form onSubmit={handleCreateShift} className="grid grid-cols-2 gap-4">
//               <div className="col-span-2">
//                 <InputField label="Shift Label" value={shiftForm.shiftName} onChange={e => setShiftForm({...shiftForm, shiftName: e.target.value})} placeholder="e.g. MORNING_V1" required />
//               </div>
//               <InputField label="Start" type="time" value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})} required />
//               <InputField label="End" type="time" value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})} required />
//               <div className="col-span-2 space-y-1">
//                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
//                 <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all" value={shiftForm.departmentId} onChange={e => setShiftForm({...shiftForm, departmentId: e.target.value})} required>
//                   <option value="">Select Dept...</option>
//                   {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
//                 </select>
//               </div>
//               <button type="submit" className="col-span-2 mt-2 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Create Template</button>
//             </form>
//           </Modal>
//         )}

//         {showAssignModal && (
//           <Modal title="Deploy Staff" onClose={() => setShowAssignModal(false)}>
//             <form onSubmit={handleAssignShift} className="space-y-4">
//               <InputField label="Employee ID" type="number" value={assignForm.userId} onChange={e => setAssignForm({...assignForm, userId: e.target.value})} placeholder="Enter UID" required />
//               <div className="space-y-1">
//                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Target Shift</label>
//                 <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all" value={assignForm.shiftId} onChange={e => setAssignForm({...assignForm, shiftId: e.target.value})} required>
//                   <option value="">Select Shift Template...</option>
//                   {shifts.map(s => <option key={s.shiftId} value={s.shiftId}>{s.shiftName} ({s.startTime})</option>)}
//                 </select>
//               </div>
//               <button type="submit" className="w-full mt-2 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Confirm Deployment</button>
//             </form>
//           </Modal>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// const SectionHeader = ({ title, count }) => (
//   <div className="flex items-center gap-2 mb-1">
//     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h3>
//     <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200">{count}</span>
//   </div>
// );

// const Modal = ({ title, children, onClose }) => (
//   <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//     <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
//       <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
//         <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
//         <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-red-500 transition-colors"/></button>
//       </div>
//       <div className="p-6">{children}</div>
//     </motion.div>
//   </div>
// );

// const InputField = ({ label, ...props }) => (
//   <div className="space-y-1">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
//     <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all" />
//   </div>
// );




import React, { useEffect, useState, useMemo } from "react";
import { 
  Clock, X, Search, Plus, Loader2, Users, Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

import { getShifts, createShift, getAssignedUsers, assignShiftToUser } from "../api/shift.api";
import { getDepartments } from "../api/hr.dept";
import { getAdminUsers } from "../../api/admin/users.api";

export default function Shift() {
  const [shifts, setShifts] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [userLookup, setUserLookup] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(null);

  // --- 🔑 PERMISSION SYSTEM ---
  const token = localStorage.getItem("accessToken");
  
  const auth = useMemo(() => {
    if (!token) return { perms: [], isManager: false };
    try {
      const decoded = jwtDecode(token);
      // Microsoft Identity Role Claim URL
      const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      
      return {
        // Ensure we get the 'perm' array exactly as it appears in your console
        perms: Array.isArray(decoded.perm) ? decoded.perm : [], 
        isManager: decoded[ROLE_CLAIM] === "HR_MANAGER"
      };
    } catch (e) {
      console.error("Token Decode Error:", e);
      return { perms: [], isManager: false };
    }
  }, [token]);

  // Use the EXACT strings from your list of 27
  const canView = auth.perms.includes("SHIFT_VIEW") || auth.isManager;
  const canCreate = auth.perms.includes("SHIFT_CREATE") || auth.isManager;
  const canAssign = auth.perms.includes("SHIFT_ASSIGN") || auth.isManager;
  
  // These are needed for the dropdowns inside the modals
  const canSeeDepts = auth.perms.includes("DOMAIN_VIEW") || auth.isManager;
  const canSeeUsers = auth.perms.includes("USER_VIEW_ALL") || auth.isManager;

  const [shiftForm, setShiftForm] = useState({ shiftName: "", startTime: "", endTime: "", departmentId: "" });
  const [assignForm, setAssignForm] = useState({ userId: "", shiftId: "" });

  const loadAllData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      // Basic Shift Data
      const [sData, aData] = await Promise.all([
        getShifts(),
        getAssignedUsers()
      ]);
      setShifts(sData || []);
      setAssignedUsers(aData || []);

      // Admin Data for Lookups (Only if user has permission to see them)
      if (canSeeDepts || canSeeUsers) {
        const [dData, uData] = await Promise.all([
          getDepartments(),
          getAdminUsers({ page: 1, pageSize: 200 })
        ]);
        setDepartments(dData || []);
        const lookup = {};
        (uData?.users || []).forEach(u => lookup[u.userId] = u.username || u.name);
        setUserLookup(lookup);
      }
    } catch (err) {
      if (err.response?.status !== 403) toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, [canView]);

  const handleCreateShift = async (e) => {
    e.preventDefault();
    if (!canCreate) return toast.error("Action Blocked: Missing SHIFT_CREATE");
    try {
      await createShift({ ...shiftForm, departmentId: Number(shiftForm.departmentId) });
      toast.success("Shift Created");
      setShowAddShift(false);
      loadAllData();
    } catch { toast.error("Failed to create shift"); }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    if (!canAssign) return toast.error("Action Blocked: Missing SHIFT_ASSIGN");
    try {
      await assignShiftToUser(Number(assignForm.userId), Number(assignForm.shiftId));
      toast.success("Staff Assigned");
      setShowAssignModal(false);
      loadAllData();
    } catch { toast.error("Assignment Failed"); }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <Lock size={40} className="mb-4 opacity-20" />
        <p className="font-black uppercase text-[10px] tracking-widest text-center">
          Access Denied <br /> SHIFT_VIEW Permission Required
        </p>
      </div>
    );
  }

  const displayedUsers = selectedShiftId 
    ? assignedUsers.filter(u => u.shiftId === selectedShiftId)
    : assignedUsers;

  const selectedShiftName = shifts.find(s => s.shiftId === selectedShiftId)?.shiftName;

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Clock size={22} className="text-indigo-600" /> Shift Terminal
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Schedules</p>
        </div>

        <div className="flex items-center gap-2">
          {/* 🔑 ACTION BUTTONS: Now using strict checks against your 27 permissions */}
          {canAssign && (
            <button onClick={() => setShowAssignModal(true)} className="bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100 transition-all">
              Assign Staff
            </button>
          )}
          {canCreate && (
            <button onClick={() => setShowAddShift(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Plus size={14} strokeWidth={3} /> Create Shift
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: Shifts */}
        <div className="col-span-12 lg:col-span-7 space-y-2">
          <SectionHeader title="Templates" count={shifts.length} />
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Shift Name</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Hours</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((s) => (
                  <tr key={s.shiftId} onClick={() => setSelectedShiftId(s.shiftId)} className={`cursor-pointer transition-all ${selectedShiftId === s.shiftId ? "bg-indigo-50/50" : "hover:bg-slate-50/50"}`}>
                    <td className="px-5 py-3.5 relative text-[12px]">
                      {selectedShiftId === s.shiftId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />}
                      <p className="font-black text-slate-700 uppercase leading-none">{s.shiftName}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">ID: {s.shiftId}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase">
                        {s.startTime} — {s.endTime}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right"><span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Staff List */}
        <div className="col-span-12 lg:col-span-5 space-y-2">
          <SectionHeader title={selectedShiftId ? `Staff: ${selectedShiftName}` : "Global Staff"} count={displayedUsers.length} />
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {displayedUsers.map((user, idx) => {
              const username = userLookup[user.userId] || `Staff Member #${user.userId}`;
              return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center font-black text-[11px] border uppercase bg-indigo-50 text-indigo-600 border-indigo-100">
                      {username.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-0.5">{username}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">UID: #{user.userId}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODALS guarded by specific permissions */}
      <AnimatePresence>
        {canCreate && showAddShift && (
          <Modal title="Create Shift" onClose={() => setShowAddShift(false)}>
            <form onSubmit={handleCreateShift} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField label="Name" value={shiftForm.shiftName} onChange={e => setShiftForm({...shiftForm, shiftName: e.target.value})} required />
              </div>
              <InputField label="Start" type="time" value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})} required />
              <InputField label="End" type="time" value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})} required />
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Department</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" value={shiftForm.departmentId} onChange={e => setShiftForm({...shiftForm, departmentId: e.target.value})} required>
                  <option value="">Select...</option>
                  {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                </select>
              </div>
              <button type="submit" className="col-span-2 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Save Template</button>
            </form>
          </Modal>
        )}

        {canAssign && showAssignModal && (
          <Modal title="Assign Staff" onClose={() => setShowAssignModal(false)}>
            <form onSubmit={handleAssignShift} className="space-y-4">
              <InputField label="User ID" type="number" value={assignForm.userId} onChange={e => setAssignForm({...assignForm, userId: e.target.value})} required />
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Shift</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" value={assignForm.shiftId} onChange={e => setAssignForm({...assignForm, shiftId: e.target.value})} required>
                  <option value="">Select...</option>
                  {shifts.map(s => <option key={s.shiftId} value={s.shiftId}>{s.shiftName}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Confirm</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ... Helper Components (SectionHeader, Modal, InputField) stay exactly the same ...
const SectionHeader = ({ title, count }) => (
  <div className="flex items-center gap-2 mb-1">
    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h3>
    <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200">{count}</span>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-red-500 transition-colors"/></button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all" />
  </div>
);