// import React, { useEffect, useState, useCallback, useMemo } from "react";
// import { 
//   Search, Loader2, Activity, History, X, 
//   Calendar as CalendarIcon, Clock, ArrowRight, User, LogIn, LogOut, ChevronLeft, ChevronRight, AlertCircle, AlertTriangle, CheckCircle2
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { jwtDecode } from "jwt-decode";

// // API IMPORTS
// import { getAdminUsers } from "../../api/admin/users.api";
// import { checkIn, checkOut, getAttendanceHistory, getTotalHours } from "../api/api.attendance";

// export default function Attendance() {
//   const [employees, setEmployees] = useState([]);
//   const [attendanceMap, setAttendanceMap] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterType, setFilterType] = useState("all"); 
//   const [currentTime, setCurrentTime] = useState(new Date());
  
//   // Modals
//   const [showModal, setShowModal] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [pendingAction, setPendingAction] = useState(null);

//   // History States
//   const [historyData, setHistoryData] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv')); 
//   const [currentMonth, setCurrentMonth] = useState(new Date());

//   // Global Timer for Live Ticking
//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   const auth = useMemo(() => {
//     const token = localStorage.getItem("accessToken");
//     if (!token) return { userId: null, isManager: false };
//     try {
//       const decoded = jwtDecode(token);
//       const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
//       return { 
//         userId: Number(decoded.sub || decoded.id), 
//         isManager: decoded[ROLE_CLAIM] === "HR_MANAGER" || decoded.role === "ADMIN",
//         name: decoded.username || decoded.unique_name || "Me"
//       };
//     } catch (e) { return { userId: null, isManager: false }; }
//   }, []);

//   // Updated Work Stats to support Live Ticking
//   const getWorkStats = useCallback((logs, targetDate, isLive = false) => {
//     const dayLogs = logs.filter(l => l.attendanceDate?.split('T')[0] === targetDate);
//     let totalMs = 0;
//     let activeSessionStart = null;

//     dayLogs.forEach(log => {
//       if (log.checkInTime && log.checkOutTime) {
//         totalMs += (new Date(log.checkOutTime) - new Date(log.checkInTime));
//       } else if (log.checkInTime && !log.checkOutTime) {
//         activeSessionStart = new Date(log.checkInTime);
//       }
//     });

//     // If it's today and they are clocked in, add running time
//     if (isLive && activeSessionStart) {
//       totalMs += (currentTime - activeSessionStart);
//     }

//     const totalSeconds = Math.floor(totalMs / 1000);
//     const hours = Math.floor(totalSeconds / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const seconds = totalSeconds % 60;
    
//     const isGoalMet = (totalSeconds / 60) >= 480;

//     if (isLive && activeSessionStart) {
//       return {
//         formatted: `${hours}h : ${minutes}m : ${seconds}s`,
//         totalMinutes: totalSeconds / 60,
//         isGoalMet
//       };
//     }

//     return {
//       formatted: `${hours}h : ${minutes}m`,
//       totalMinutes: totalSeconds / 60,
//       isGoalMet
//     };
//   }, [currentTime]);

//   const loadData = useCallback(async () => {
//     setLoading(true);
//     try {
//       let usersToProcess = [];
//       if (auth.isManager) {
//         const uRes = await getAdminUsers({ page: 1, pageSize: 100 });
//         usersToProcess = uRes?.users ?? [];
//       } else {
//         usersToProcess = [{ userId: auth.userId, username: auth.name }];
//       }

//       const localToday = new Date().toLocaleDateString('sv');
//       const newMap = {};

//       await Promise.all(usersToProcess.map(async (emp) => {
//         let state = { isCheckedIn: false, count: 0, lastAction: "---", totalToday: "0h : 0m", rawTime: null, history: [], goalMet: false };
//         try {
//           const hRes = await getAttendanceHistory(emp.userId);
//           const history = hRes?.data || [];
//           state.history = history;
          
//           if (Array.isArray(history) && history.length > 0) {
//             const stats = getWorkStats(history, localToday, false); // Static for table
//             state.totalToday = stats.formatted;
//             state.goalMet = stats.isGoalMet;
            
//             const todayLogs = history.filter(l => l.attendanceDate?.split('T')[0] === localToday);
//             state.count = todayLogs.length;
//             if (todayLogs.length > 0) {
//               const latest = todayLogs.sort((a,b) => new Date(b.checkInTime) - new Date(a.checkInTime))[0];
//               state.isCheckedIn = !!latest.checkInTime && !latest.checkOutTime;
//               state.rawTime = latest.checkInTime; 
//               state.lastAction = latest.checkOutTime 
//                 ? `OUT ${latest.checkOutTime.slice(11, 16)}` 
//                 : `IN ${latest.checkInTime.slice(11, 16)}`;
//             }
//           }
//         } catch (e) {}
//         newMap[emp.userId] = state;
//       }));

//       setAttendanceMap(newMap);
//       setEmployees(usersToProcess);
//     } catch (err) { toast.error("Sync Failed"); }
//     finally { setLoading(false); }
//   }, [auth, getWorkStats]);

//   useEffect(() => { loadData(); }, [loadData]);

//   const confirmPunch = async () => {
//     const userId = pendingAction;
//     const isCurrentlyIn = attendanceMap[userId]?.isCheckedIn;
//     setShowConfirm(false);
//     const tid = toast.loading("Processing...");
//     try {
//       isCurrentlyIn ? await checkOut(userId) : await checkIn(userId);
//       toast.success("Success", { id: tid });
//       await loadData(); 
//     } catch (e) { toast.error("Action Failed", { id: tid }); }
//   };

//   const filteredEmployees = useMemo(() => {
//     return employees.filter(e => {
//       const matchesSearch = (e.username || e.name || "").toLowerCase().includes(searchTerm.toLowerCase());
//       const status = attendanceMap[e.userId]?.isCheckedIn;
//       if (filterType === 'active') return matchesSearch && status === true;
//       if (filterType === 'inactive') return matchesSearch && status === false;
//       return matchesSearch;
//     });
//   }, [employees, searchTerm, filterType, attendanceMap]);

//   const liveActivity = useMemo(() => {
//     return employees
//       .filter(e => attendanceMap[e.userId]?.rawTime)
//       .sort((a, b) => new Date(attendanceMap[b.userId].rawTime) - new Date(attendanceMap[a.userId].rawTime))
//       .slice(0, 5);
//   }, [employees, attendanceMap]);

//   // For Modal View with Dynamic Ticking
//   const selectedDayStats = useMemo(() => {
//     if (!selectedUser) return { formatted: "0h : 0m", totalMinutes: 0, isGoalMet: false };
//     const isToday = selectedDate === new Date().toLocaleDateString('sv');
//     return getWorkStats(attendanceMap[selectedUser.userId]?.history || [], selectedDate, isToday);
//   }, [selectedUser, selectedDate, attendanceMap, getWorkStats]);

//   return (
//     <div className="flex h-[550px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans transition-colors duration-300">
//       <Toaster position="top-right" />

//       {/* SIDEBAR */}
//       {auth.isManager && (
//         <div className="w-64 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
//           <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-body)]/30">
//             <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Dashboard</h2>
//           </div>
//           <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-[var(--bg-body)]/30 custom-scrollbar">
//             <div className="grid grid-cols-3 gap-1.5">
//               <button onClick={() => setFilterType('all')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'all' ? 'border-indigo-500 bg-indigo-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
//                 <p className="text-[7px] font-black text-slate-400 uppercase">Staff</p>
//                 <p className="text-sm font-black text-[var(--text-main)]">{employees.length}</p>
//               </button>
//               <button onClick={() => setFilterType('active')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'active' ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
//                 <p className="text-[7px] font-black text-slate-400 uppercase">Active</p>
//                 <p className="text-sm font-black text-emerald-500">{Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
//               </button>
//               <button onClick={() => setFilterType('inactive')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'inactive' ? 'border-rose-500 bg-rose-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
//                 <p className="text-[7px] font-black text-slate-400 uppercase">Inactive</p>
//                 <p className="text-sm font-black text-rose-500">{employees.length - Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
//               </button>
//             </div>

//             <div className="space-y-1.5">
//               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Live Activity</p>
//               {liveActivity.map(emp => (
//                 <div key={emp.userId} className="flex items-center justify-between p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-sm">
//                    <div className="flex items-center gap-2 overflow-hidden">
//                       <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${attendanceMap[emp.userId]?.isCheckedIn ? 'bg-emerald-500' : 'bg-slate-300'}`} />
//                       <p className="text-[9px] font-bold text-[var(--text-main)] truncate uppercase">{emp.username || emp.name}</p>
//                    </div>
//                    <span className="text-[7px] font-black text-indigo-500 bg-indigo-500/5 px-1 rounded uppercase tracking-tighter">{attendanceMap[emp.userId]?.lastAction.split(' ')[0]}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* MAIN CONTENT AREA */}
//       <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg"><Activity size={18} /></div>
//             <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Attendance Log</h2>
//           </div>
//           <input type="text" placeholder="Search team..." className="text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg px-4 py-1.5 outline-none w-48" onChange={(e) => setSearchTerm(e.target.value)} />
//         </div>

//         <div className="flex-1 overflow-auto p-4 bg-[var(--bg-body)]/20 custom-scrollbar">
//           <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
//             <table className="w-full text-left">
//               <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
//                 <tr>
//                   <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
//                   <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Work Hours</th>
//                   <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Status</th>
//                   <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-right tracking-widest">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-[var(--border-color)]/30">
//                 {filteredEmployees.map((emp) => {
//                   const st = attendanceMap[emp.userId] || {};
//                   const isSelf = Number(emp.userId) === auth.userId;
//                   return (
//                     <tr key={emp.userId} className="hover:bg-indigo-500/[0.01]">
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-3">
//                           <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${st.isCheckedIn ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30 shadow-sm' : 'bg-[var(--bg-body)] text-slate-400 border-[var(--border-color)]'}`}>
//                             {emp.username?.charAt(0).toUpperCase()}
//                           </div>
//                           <div>
//                             <p className="text-[10px] font-black text-[var(--text-main)] uppercase leading-none">{emp.name || emp.username}</p>
//                             <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">ID: {emp.userId}</p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 text-center">
//                          <span className={`text-[10px] font-black ${st.goalMet ? 'text-emerald-500' : 'text-indigo-500'}`}>{st.totalToday || "0h : 0m"}</span>
//                          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Goal: 8h</p>
//                       </td>
//                       <td className="px-4 py-3 text-center">
//                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${st.isCheckedIn ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-100 text-slate-400 border-transparent"}`}>
//                           {st.lastAction}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 text-right">
//                         <div className="flex justify-end gap-2">
//                           {isSelf && (
//                             <button onClick={() => { setPendingAction(emp.userId); setShowConfirm(true); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all shadow-md active:scale-95 ${st.isCheckedIn ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
//                               {st.isCheckedIn ? 'Punch Out' : 'Punch In'}
//                             </button>
//                           )}
//                           <button onClick={() => { 
//                             setSelectedUser(emp); 
//                             setShowModal(true); 
//                             setHistoryData(st.history || []);
//                           }} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-slate-400 hover:text-indigo-500 transition-all">
//                             <CalendarIcon size={14}/>
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* CONFIRMATION MODAL */}
//       <AnimatePresence>
//         {showConfirm && (
//           <div className="fixed inset-0 flex items-center justify-center z-[150] backdrop-blur-md bg-slate-900/40 p-4" onClick={() => setShowConfirm(false)}>
//             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 w-80 text-center" onClick={e => e.stopPropagation()}>
//               <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div>
//               <h3 className="text-sm font-black uppercase text-slate-800 mb-2">Punch Confirmation</h3>
//               <p className="text-[10px] font-bold text-slate-500 uppercase mb-6 leading-relaxed">Proceed with current check-in/out action?</p>
//               <div className="flex gap-3">
//                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-xl">Cancel</button>
//                 <button onClick={confirmPunch} className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md">Confirm</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* HISTORY MODAL */}
//       <AnimatePresence>
//         {showModal && (
//           <div className="fixed inset-0 flex items-center justify-center z-[110] backdrop-blur-sm bg-slate-900/60 p-4" onClick={() => setShowModal(false)}>
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[var(--border-color)] flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
//               <div className="flex-1">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-xs font-black uppercase text-[var(--text-main)]">History Calendar</h3>
//                   <div className="flex gap-2">
//                     <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1.5 hover:bg-[var(--bg-body)] rounded-lg"><ChevronLeft size={14}/></button>
//                     <span className="text-[10px] font-black uppercase text-indigo-500 mt-1">{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
//                     <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1.5 hover:bg-[var(--bg-body)] rounded-lg"><ChevronRight size={14}/></button>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-7 gap-1">
//                    {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[8px] font-black text-slate-400 text-center py-1">{d}</span>)}
//                    {Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()).fill(0).map((_, i) => <div key={i} />)}
//                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
//                       const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
//                       const dStr = date.toLocaleDateString('sv');
//                       const dayLogs = historyData.filter(h => h.attendanceDate?.split('T')[0] === dStr);
//                       const hasMissingCheckout = dayLogs.some(l => l.checkInTime && !l.checkOutTime);
//                       const hasCheckin = dayLogs.length > 0;
//                       const isPast = date < new Date().setHours(0,0,0,0);
//                       const isToday = dStr === new Date().toLocaleDateString('sv');

//                       let bgColor = "bg-[var(--bg-body)] text-slate-400";
//                       let icon = null;

//                       if (hasCheckin) {
//                         if (hasMissingCheckout && !isToday) {
//                           bgColor = "bg-amber-100 text-amber-700 border border-amber-200";
//                           icon = <AlertTriangle size={8} className="absolute top-0.5 right-0.5" />;
//                         } else {
//                           bgColor = "bg-emerald-500 text-white";
//                         }
//                       } else if (isPast) {
//                         bgColor = "bg-rose-50 text-rose-400 border border-rose-100";
//                       }

//                       return (
//                         <button key={dStr} onClick={() => setSelectedDate(dStr)} className={`h-9 w-full rounded-lg text-[9px] font-bold transition-all relative ${bgColor} ${selectedDate === dStr ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}>
//                           {i + 1}
//                           {icon}
//                         </button>
//                       )
//                    })}
//                 </div>
//               </div>
//               <div className="w-full md:w-64 border-l border-[var(--border-color)] pl-6 flex flex-col">
//                 <h4 className="text-sm font-black text-indigo-500 uppercase mb-4 truncate">{selectedUser?.username}</h4>
//                 <div className="bg-[var(--bg-body)] rounded-xl p-3 mb-4 border border-[var(--border-color)]">
//                   <div className="flex justify-between mb-1">
//                     <span className="text-[8px] font-black text-slate-400 uppercase">Sessions</span>
//                     <span className="text-[10px] font-black text-[var(--text-main)]">{historyData.filter(h => h.attendanceDate?.split('T')[0] === selectedDate).length}</span>
//                   </div>
//                   <div className="flex justify-between items-center min-h-[1.5rem]">
//                     <span className="text-[8px] font-black text-slate-400 uppercase">Total Time</span>
//                     <span className={`text-[10px] font-black tabular-nums ${selectedDayStats.isGoalMet ? 'text-emerald-500' : 'text-indigo-500'}`}>
//                       {selectedDayStats.formatted}
//                     </span>
//                   </div>
//                   <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
//                     <div 
//                       className={`h-full transition-all duration-300 ${selectedDayStats.isGoalMet ? 'bg-emerald-500' : 'bg-indigo-500'}`}
//                       style={{ width: `${Math.min((selectedDayStats.totalMinutes / 480) * 100, 100)}%` }}
//                     />
//                   </div>
//                   <p className="text-[6px] font-black text-slate-400 mt-1 uppercase text-right tracking-widest">Target: 8h Net</p>
//                 </div>
//                 <div className="flex-1 space-y-2 overflow-y-auto max-h-40 custom-scrollbar pr-1">
//                   {historyData.filter(h => h.attendanceDate?.split('T')[0] === selectedDate).map((log, i) => (
//                     <div key={i} className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] flex items-center justify-between">
//                        <Clock size={10} className="text-slate-400" />
//                        <p className="text-[9px] font-bold text-[var(--text-main)] uppercase">{log.checkInTime.slice(11, 16)} — {log.checkOutTime?.slice(11, 16) || 'ACTIVE'}</p>
//                     </div>
//                   ))}
//                 </div>
//                 <button onClick={() => setShowModal(false)} className="mt-4 w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md active:scale-95 transition-all">Close Viewer</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Search, Loader2, Activity, History, X, 
  Calendar as CalendarIcon, Clock, ArrowRight, User, LogIn, LogOut, ChevronLeft, ChevronRight, AlertCircle, AlertTriangle, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

// API IMPORTS
import { getAdminUsers } from "../../api/admin/users.api";
import { checkIn, checkOut, getAttendanceHistory, getTotalHours } from "../api/api.attendance";

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); 
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // History States
  const [historyData, setHistoryData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv')); 
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Global Timer for Live Ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const auth = useMemo(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return { userId: null, isManager: false };
    try {
      const decoded = jwtDecode(token);
      const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      return { 
        userId: Number(decoded.sub || decoded.id), 
        isManager: decoded[ROLE_CLAIM] === "HR_MANAGER" || decoded.role === "ADMIN",
        name: decoded.username || decoded.unique_name || "Me"
      };
    } catch (e) { return { userId: null, isManager: false }; }
  }, []);

  const getWorkStats = useCallback((logs, targetDate, isLive = false) => {
    const dayLogs = logs.filter(l => l.attendanceDate?.split('T')[0] === targetDate);
    let totalMs = 0;
    let activeSessionStart = null;

    dayLogs.forEach(log => {
      if (log.checkInTime && log.checkOutTime) {
        totalMs += (new Date(log.checkOutTime) - new Date(log.checkInTime));
      } else if (log.checkInTime && !log.checkOutTime) {
        activeSessionStart = new Date(log.checkInTime);
      }
    });

    if (isLive && activeSessionStart) {
      totalMs += (currentTime - activeSessionStart);
    }

    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const isGoalMet = (totalSeconds / 60) >= 480; // 8 Hours

    if (isLive && activeSessionStart) {
      return {
        formatted: `${hours}h : ${minutes}m : ${seconds}s`,
        totalMinutes: totalSeconds / 60,
        isGoalMet
      };
    }

    return {
      formatted: `${hours}h : ${minutes}m`,
      totalMinutes: totalSeconds / 60,
      isGoalMet
    };
  }, [currentTime]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let usersToProcess = [];
      if (auth.isManager) {
        const uRes = await getAdminUsers({ page: 1, pageSize: 100 });
        usersToProcess = uRes?.users ?? [];
      } else {
        usersToProcess = [{ userId: auth.userId, username: auth.name }];
      }

      const localToday = new Date().toLocaleDateString('sv');
      const newMap = {};

      await Promise.all(usersToProcess.map(async (emp) => {
        let state = { isCheckedIn: false, count: 0, lastAction: "---", totalToday: "0h : 0m", rawTime: null, history: [], goalMet: false };
        try {
          const hRes = await getAttendanceHistory(emp.userId);
          const history = hRes?.data || [];
          state.history = history;
          
          if (Array.isArray(history) && history.length > 0) {
            const stats = getWorkStats(history, localToday, false);
            state.totalToday = stats.formatted;
            state.goalMet = stats.isGoalMet;
            
            const todayLogs = history.filter(l => l.attendanceDate?.split('T')[0] === localToday);
            state.count = todayLogs.length;
            if (todayLogs.length > 0) {
              const latest = todayLogs.sort((a,b) => new Date(b.checkInTime) - new Date(a.checkInTime))[0];
              state.isCheckedIn = !!latest.checkInTime && !latest.checkOutTime;
              state.rawTime = latest.checkInTime; 
              state.lastAction = latest.checkOutTime 
                ? `OUT ${latest.checkOutTime.slice(11, 16)}` 
                : `IN ${latest.checkInTime.slice(11, 16)}`;
            }
          }
        } catch (e) {}
        newMap[emp.userId] = state;
      }));

      setAttendanceMap(newMap);
      setEmployees(usersToProcess);
    } catch (err) { toast.error("Sync Failed"); }
    finally { setLoading(false); }
  }, [auth, getWorkStats]);

  useEffect(() => { loadData(); }, [loadData]);

  const confirmPunch = async () => {
    const userId = pendingAction;
    const isCurrentlyIn = attendanceMap[userId]?.isCheckedIn;
    setShowConfirm(false);
    const tid = toast.loading("Processing...");
    try {
      isCurrentlyIn ? await checkOut(userId) : await checkIn(userId);
      toast.success("Success", { id: tid });
      await loadData(); 
    } catch (e) { toast.error("Action Failed", { id: tid }); }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = (e.username || e.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const status = attendanceMap[e.userId]?.isCheckedIn;
      if (filterType === 'active') return matchesSearch && status === true;
      if (filterType === 'inactive') return matchesSearch && status === false;
      return matchesSearch;
    });
  }, [employees, searchTerm, filterType, attendanceMap]);

  const liveActivity = useMemo(() => {
    return employees
      .filter(e => attendanceMap[e.userId]?.rawTime)
      .sort((a, b) => new Date(attendanceMap[b.userId].rawTime) - new Date(attendanceMap[a.userId].rawTime))
      .slice(0, 5);
  }, [employees, attendanceMap]);

  const selectedDayStats = useMemo(() => {
    if (!selectedUser) return { formatted: "0h : 0m", totalMinutes: 0, isGoalMet: false };
    const isToday = selectedDate === new Date().toLocaleDateString('sv');
    return getWorkStats(attendanceMap[selectedUser.userId]?.history || [], selectedDate, isToday);
  }, [selectedUser, selectedDate, attendanceMap, getWorkStats]);

  return (
    <div className="flex h-[550px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans transition-colors duration-300">
      <Toaster position="top-right" />

      {/* SIDEBAR */}
      {auth.isManager && (
        <div className="w-64 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-body)]/30">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Dashboard</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-[var(--bg-body)]/30 custom-scrollbar">
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => setFilterType('all')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'all' ? 'border-indigo-500 bg-indigo-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
                <p className="text-[7px] font-black text-slate-400 uppercase">Staff</p>
                <p className="text-sm font-black text-[var(--text-main)]">{employees.length}</p>
              </button>
              <button onClick={() => setFilterType('active')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'active' ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
                <p className="text-[7px] font-black text-slate-400 uppercase">Active</p>
                <p className="text-sm font-black text-emerald-500">{Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
              </button>
              <button onClick={() => setFilterType('inactive')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'inactive' ? 'border-rose-500 bg-rose-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
                <p className="text-[7px] font-black text-slate-400 uppercase">Inactive</p>
                <p className="text-sm font-black text-rose-500">{employees.length - Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Live Activity</p>
              {liveActivity.map(emp => (
                <div key={emp.userId} className="flex items-center justify-between p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-sm">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${attendanceMap[emp.userId]?.isCheckedIn ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <p className="text-[9px] font-bold text-[var(--text-main)] truncate uppercase">{emp.username || emp.name}</p>
                   </div>
                   <span className="text-[7px] font-black text-indigo-500 bg-indigo-500/5 px-1 rounded uppercase tracking-tighter">{attendanceMap[emp.userId]?.lastAction.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg"><Activity size={18} /></div>
            <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Attendance Log</h2>
          </div>
          <input type="text" placeholder="Search team..." className="text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg px-4 py-1.5 outline-none w-48" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex-1 overflow-auto p-4 bg-[var(--bg-body)]/20 custom-scrollbar">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Work Hours</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-right tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/30">
                {filteredEmployees.map((emp) => {
                  const st = attendanceMap[emp.userId] || {};
                  const isSelf = Number(emp.userId) === auth.userId;
                  return (
                    <tr key={emp.userId} className="hover:bg-indigo-500/[0.01]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${st.isCheckedIn ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30 shadow-sm' : 'bg-[var(--bg-body)] text-slate-400 border-[var(--border-color)]'}`}>
                            {emp.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--text-main)] uppercase leading-none">{emp.name || emp.username}</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">ID: {emp.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                         <span className={`text-[10px] font-black ${st.goalMet ? 'text-emerald-500' : 'text-indigo-500'}`}>{st.totalToday || "0h : 0m"}</span>
                         <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Goal: 8h</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${st.isCheckedIn ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-100 text-slate-400 border-transparent"}`}>
                          {st.lastAction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {isSelf && (
                            <button onClick={() => { setPendingAction(emp.userId); setShowConfirm(true); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all shadow-md active:scale-95 ${st.isCheckedIn ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
                              {st.isCheckedIn ? 'Punch Out' : 'Punch In'}
                            </button>
                          )}
                          <button onClick={() => { 
                            setSelectedUser(emp); 
                            setShowModal(true); 
                            setHistoryData(st.history || []);
                          }} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-slate-400 hover:text-indigo-500 transition-all">
                            <CalendarIcon size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-[150] backdrop-blur-md bg-slate-900/40 p-4" onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 w-80 text-center" onClick={e => e.stopPropagation()}>
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div>
              <h3 className="text-sm font-black uppercase text-slate-800 mb-2">Punch Confirmation</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-6 leading-relaxed">Proceed with current check-in/out action?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-xl">Cancel</button>
                <button onClick={confirmPunch} className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] backdrop-blur-sm bg-slate-900/60 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[var(--border-color)] flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase text-[var(--text-main)]">History Calendar</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1.5 hover:bg-[var(--bg-body)] rounded-lg"><ChevronLeft size={14}/></button>
                    <span className="text-[10px] font-black uppercase text-indigo-500 mt-1">{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1.5 hover:bg-[var(--bg-body)] rounded-lg"><ChevronRight size={14}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                   {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[8px] font-black text-slate-400 text-center py-1">{d}</span>)}
                   {Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()).fill(0).map((_, i) => <div key={i} />)}
                   {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                      const dStr = date.toLocaleDateString('sv');
                      const dayLogs = historyData.filter(h => h.attendanceDate?.split('T')[0] === dStr);
                      
                      // Status Checking
                      const stats = getWorkStats(historyData, dStr, false);
                      const hasMissingCheckout = dayLogs.some(l => l.checkInTime && !l.checkOutTime);
                      const hasCheckin = dayLogs.length > 0;
                      const isPast = date < new Date().setHours(0,0,0,0);
                      const isToday = dStr === new Date().toLocaleDateString('sv');

                      let bgColor = "bg-[var(--bg-body)] text-slate-400";
                      let icon = null;

                      if (hasCheckin) {
                        // FIX: If goal is not met (even if checkout exists), show yellow caution icon
                        if (!stats.isGoalMet && !isToday) {
                          bgColor = "bg-amber-100 text-amber-700 border border-amber-200";
                          icon = <AlertTriangle size={8} className="absolute top-0.5 right-0.5" />;
                        } else if (stats.isGoalMet) {
                          bgColor = "bg-emerald-500 text-white";
                        } else {
                          // Today in progress
                          bgColor = "bg-indigo-600 text-white";
                        }
                      } else if (isPast) {
                        bgColor = "bg-rose-50 text-rose-400 border border-rose-100";
                      }

                      return (
                        <button key={dStr} onClick={() => setSelectedDate(dStr)} className={`h-9 w-full rounded-lg text-[9px] font-bold transition-all relative ${bgColor} ${selectedDate === dStr ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}>
                          {i + 1}
                          {icon}
                        </button>
                      )
                   })}
                </div>
              </div>
              <div className="w-full md:w-64 border-l border-[var(--border-color)] pl-6 flex flex-col">
                <h4 className="text-sm font-black text-indigo-500 uppercase mb-4 truncate">{selectedUser?.username}</h4>
                <div className="bg-[var(--bg-body)] rounded-xl p-3 mb-4 border border-[var(--border-color)]">
                  <div className="flex justify-between mb-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Sessions</span>
                    <span className="text-[10px] font-black text-[var(--text-main)]">{historyData.filter(h => h.attendanceDate?.split('T')[0] === selectedDate).length}</span>
                  </div>
                  <div className="flex justify-between items-center min-h-[1.5rem]">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Total Time</span>
                    <span className={`text-[10px] font-black tabular-nums ${selectedDayStats.isGoalMet ? 'text-emerald-500' : 'text-indigo-500'}`}>
                      {selectedDayStats.formatted}
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${selectedDayStats.isGoalMet ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min((selectedDayStats.totalMinutes / 480) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[6px] font-black text-slate-400 mt-1 uppercase text-right tracking-widest">Target: 8h Net</p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-40 custom-scrollbar pr-1">
                  {historyData.filter(h => h.attendanceDate?.split('T')[0] === selectedDate).map((log, i) => (
                    <div key={i} className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] flex items-center justify-between">
                       <Clock size={10} className="text-slate-400" />
                       <p className="text-[9px] font-bold text-[var(--text-main)] uppercase">{log.checkInTime.slice(11, 16)} — {log.checkOutTime?.slice(11, 16) || 'ACTIVE'}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowModal(false)} className="mt-4 w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md active:scale-95 transition-all">Close Viewer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}