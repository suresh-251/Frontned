// // import React, { useEffect, useState, useCallback, useMemo } from "react";
// // import { 
// //   Search, Loader2, Activity, History, X, 
// //   Calendar as CalendarIcon, Clock, ArrowRight, User, LogIn, LogOut, ChevronLeft, ChevronRight, AlertCircle, AlertTriangle, CheckCircle2
// // } from "lucide-react";
// // import { motion, AnimatePresence } from "framer-motion";
// // import toast, { Toaster } from "react-hot-toast";
// // import { jwtDecode } from "jwt-decode";

// // // API IMPORTS
// // import { getAdminUsers } from "../../api/admin/users.api";
// // import { checkIn, checkOut, getAttendanceHistory, getTotalHours } from "../api/api.attendance";

// // export default function Attendance() {
// //   const [employees, setEmployees] = useState([]);
// //   const [attendanceMap, setAttendanceMap] = useState({});
// //   const [loading, setLoading] = useState(false);
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filterType, setFilterType] = useState("all"); 
// //   const [currentTime, setCurrentTime] = useState(new Date());
  
// //   // Modals
// //   const [showModal, setShowModal] = useState(false);
// //   const [showConfirm, setShowConfirm] = useState(false);
// //   const [pendingAction, setPendingAction] = useState(null);

// //   // History States
// //   const [historyData, setHistoryData] = useState([]);
// //   const [selectedUser, setSelectedUser] = useState(null);
// //   const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv')); 
// //   const [currentMonth, setCurrentMonth] = useState(new Date());

// //   // Global Timer for Live Ticking
// //   useEffect(() => {
// //     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
// //     return () => clearInterval(timer);
// //   }, []);

// //   const auth = useMemo(() => {
// //     const token = localStorage.getItem("accessToken");
// //     if (!token) return { userId: null, isManager: false };
// //     try {
// //       const decoded = jwtDecode(token);
// //       const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
// //       return { 
// //         userId: Number(decoded.sub || decoded.id), 
// //         isManager: decoded[ROLE_CLAIM] === "HR_MANAGER" || decoded.role === "ADMIN",
// //         name: decoded.username || decoded.unique_name || "Me"
// //       };
// //     } catch (e) { return { userId: null, isManager: false }; }
// //   }, []);

// //   // Updated Work Stats to support Live Ticking
// //   const getWorkStats = useCallback((logs, targetDate, isLive = false) => {
// //     const dayLogs = logs.filter(l => l.attendanceDate?.split('T')[0] === targetDate);
// //     let totalMs = 0;
// //     let activeSessionStart = null;

// //     dayLogs.forEach(log => {
// //       if (log.checkInTime && log.checkOutTime) {
// //         totalMs += (new Date(log.checkOutTime) - new Date(log.checkInTime));
// //       } else if (log.checkInTime && !log.checkOutTime) {
// //         activeSessionStart = new Date(log.checkInTime);
// //       }
// //     });

// //     // If it's today and they are clocked in, add running time
// //     if (isLive && activeSessionStart) {
// //       totalMs += (currentTime - activeSessionStart);
// //     }

// //     const totalSeconds = Math.floor(totalMs / 1000);
// //     const hours = Math.floor(totalSeconds / 3600);
// //     const minutes = Math.floor((totalSeconds % 3600) / 60);
// //     const seconds = totalSeconds % 60;
    
// //     const isGoalMet = (totalSeconds / 60) >= 480;

// //     if (isLive && activeSessionStart) {
// //       return {
// //         formatted: `${hours}h : ${minutes}m : ${seconds}s`,
// //         totalMinutes: totalSeconds / 60,
// //         isGoalMet
// //       };
// //     }

// //     return {
// //       formatted: `${hours}h : ${minutes}m`,
// //       totalMinutes: totalSeconds / 60,
// //       isGoalMet
// //     };
// //   }, [currentTime]);

// //   const loadData = useCallback(async () => {
// //     setLoading(true);
// //     try {
// //       let usersToProcess = [];
// //       if (auth.isManager) {
// //         const uRes = await getAdminUsers({ page: 1, pageSize: 100 });
// //         usersToProcess = uRes?.users ?? [];
// //       } else {
// //         usersToProcess = [{ userId: auth.userId, username: auth.name }];
// //       }

// //       const localToday = new Date().toLocaleDateString('sv');
// //       const newMap = {};

// //       await Promise.all(usersToProcess.map(async (emp) => {
// //         let state = { isCheckedIn: false, count: 0, lastAction: "---", totalToday: "0h : 0m", rawTime: null, history: [], goalMet: false };
// //         try {
// //           const hRes = await getAttendanceHistory(emp.userId);
// //           const history = hRes?.data || [];
// //           state.history = history;
          
// //           if (Array.isArray(history) && history.length > 0) {
// //             const stats = getWorkStats(history, localToday, false); // Static for table
// //             state.totalToday = stats.formatted;
// //             state.goalMet = stats.isGoalMet;
            
// //             const todayLogs = history.filter(l => l.attendanceDate?.split('T')[0] === localToday);
// //             state.count = todayLogs.length;
// //             if (todayLogs.length > 0) {
// //               const latest = todayLogs.sort((a,b) => new Date(b.checkInTime) - new Date(a.checkInTime))[0];
// //               state.isCheckedIn = !!latest.checkInTime && !latest.checkOutTime;
// //               state.rawTime = latest.checkInTime; 
// //               state.lastAction = latest.checkOutTime 
// //                 ? `OUT ${latest.checkOutTime.slice(11, 16)}` 
// //                 : `IN ${latest.checkInTime.slice(11, 16)}`;
// //             }
// //           }
// //         } catch (e) {}
// //         newMap[emp.userId] = state;
// //       }));

// //       setAttendanceMap(newMap);
// //       setEmployees(usersToProcess);
// //     } catch (err) { toast.error("Sync Failed"); }
// //     finally { setLoading(false); }
// //   }, [auth, getWorkStats]);

// //   useEffect(() => { loadData(); }, [loadData]);

// //   const confirmPunch = async () => {
// //     const userId = pendingAction;
// //     const isCurrentlyIn = attendanceMap[userId]?.isCheckedIn;
// //     setShowConfirm(false);
// //     const tid = toast.loading("Processing...");
// //     try {
// //       isCurrentlyIn ? await checkOut(userId) : await checkIn(userId);
// //       toast.success("Success", { id: tid });
// //       await loadData(); 
// //     } catch (e) { toast.error("Action Failed", { id: tid }); }
// //   };

// //   const filteredEmployees = useMemo(() => {
// //     return employees.filter(e => {
// //       const matchesSearch = (e.username || e.name || "").toLowerCase().includes(searchTerm.toLowerCase());
// //       const status = attendanceMap[e.userId]?.isCheckedIn;
// //       if (filterType === 'active') return matchesSearch && status === true;
// //       if (filterType === 'inactive') return matchesSearch && status === false;
// //       return matchesSearch;
// //     });
// //   }, [employees, searchTerm, filterType, attendanceMap]);

// //   const liveActivity = useMemo(() => {
// //     return employees
// //       .filter(e => attendanceMap[e.userId]?.rawTime)
// //       .sort((a, b) => new Date(attendanceMap[b.userId].rawTime) - new Date(attendanceMap[a.userId].rawTime))
// //       .slice(0, 5);
// //   }, [employees, attendanceMap]);

// //   // For Modal View with Dynamic Ticking
// //   const selectedDayStats = useMemo(() => {
// //     if (!selectedUser) return { formatted: "0h : 0m", totalMinutes: 0, isGoalMet: false };
// //     const isToday = selectedDate === new Date().toLocaleDateString('sv');
// //     return getWorkStats(attendanceMap[selectedUser.userId]?.history || [], selectedDate, isToday);
// //   }, [selectedUser, selectedDate, attendanceMap, getWorkStats]);

// //   return (
// //     <div className="flex h-[550px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans transition-colors duration-300">
// //       <Toaster position="top-right" />

// //       {/* SIDEBAR */}
// //       {auth.isManager && (
// //         <div className="w-64 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
// //           <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-body)]/30">
// //             <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Dashboard</h2>
// //           </div>
// //           <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-[var(--bg-body)]/30 custom-scrollbar">
// //             <div className="grid grid-cols-3 gap-1.5">
// //               <button onClick={() => setFilterType('all')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'all' ? 'border-indigo-500 bg-indigo-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
// //                 <p className="text-[7px] font-black text-slate-400 uppercase">Staff</p>
// //                 <p className="text-sm font-black text-[var(--text-main)]">{employees.length}</p>
// //               </button>
// //               <button onClick={() => setFilterType('active')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'active' ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
// //                 <p className="text-[7px] font-black text-slate-400 uppercase">Active</p>
// //                 <p className="text-sm font-black text-emerald-500">{Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
// //               </button>
// //               <button onClick={() => setFilterType('inactive')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'inactive' ? 'border-rose-500 bg-rose-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
// //                 <p className="text-[7px] font-black text-slate-400 uppercase">Inactive</p>
// //                 <p className="text-sm font-black text-rose-500">{employees.length - Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
// //               </button>
// //             </div>

// //             <div className="space-y-1.5">
// //               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Live Activity</p>
// //               {liveActivity.map(emp => (
// //                 <div key={emp.userId} className="flex items-center justify-between p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-sm">
// //                    <div className="flex items-center gap-2 overflow-hidden">
// //                       <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${attendanceMap[emp.userId]?.isCheckedIn ? 'bg-emerald-500' : 'bg-slate-300'}`} />
// //                       <p className="text-[9px] font-bold text-[var(--text-main)] truncate uppercase">{emp.username || emp.name}</p>
// //                    </div>
// //                    <span className="text-[7px] font-black text-indigo-500 bg-indigo-500/5 px-1 rounded uppercase tracking-tighter">{attendanceMap[emp.userId]?.lastAction.split(' ')[0]}</span>
// //                 </div>
// //               ))}
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* MAIN CONTENT AREA */}
// //       <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
// //         <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
// //           <div className="flex items-center gap-3">
// //             <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg"><Activity size={18} /></div>
// //             <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Attendance Log</h2>
// //           </div>
// //           <input type="text" placeholder="Search team..." className="text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg px-4 py-1.5 outline-none w-48" onChange={(e) => setSearchTerm(e.target.value)} />
// //         </div>

// //         <div className="flex-1 overflow-auto p-4 bg-[var(--bg-body)]/20 custom-scrollbar">
// //           <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
// //             <table className="w-full text-left">
// //               <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
// //                 <tr>
// //                   <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
// //                   <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Work Hours</th>
// //                   <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Status</th>
// //                   <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-right tracking-widest">Actions</th>
// //                 </tr>
// //               </thead>
// //               <tbody className="divide-y divide-[var(--border-color)]/30">
// //                 {filteredEmployees.map((emp) => {
// //                   const st = attendanceMap[emp.userId] || {};
// //                   const isSelf = Number(emp.userId) === auth.userId;
// //                   return (
// //                     <tr key={emp.userId} className="hover:bg-indigo-500/[0.01]">
// //                       <td className="px-4 py-3">
// //                         <div className="flex items-center gap-3">
// //                           <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${st.isCheckedIn ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30 shadow-sm' : 'bg-[var(--bg-body)] text-slate-400 border-[var(--border-color)]'}`}>
// //                             {emp.username?.charAt(0).toUpperCase()}
// //                           </div>
// //                           <div>
// //                             <p className="text-[10px] font-black text-[var(--text-main)] uppercase leading-none">{emp.name || emp.username}</p>
// //                             <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">ID: {emp.userId}</p>
// //                           </div>
// //                         </div>
// //                       </td>
// //                       <td className="px-4 py-3 text-center">
// //                          <span className={`text-[10px] font-black ${st.goalMet ? 'text-emerald-500' : 'text-indigo-500'}`}>{st.totalToday || "0h : 0m"}</span>
// //                          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Goal: 8h</p>
// //                       </td>
// //                       <td className="px-4 py-3 text-center">
// //                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${st.isCheckedIn ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-100 text-slate-400 border-transparent"}`}>
// //                           {st.lastAction}
// //                         </span>
// //                       </td>
// //                       <td className="px-4 py-3 text-right">
// //                         <div className="flex justify-end gap-2">
// //                           {isSelf && (
// //                             <button onClick={() => { setPendingAction(emp.userId); setShowConfirm(true); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all shadow-md active:scale-95 ${st.isCheckedIn ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
// //                               {st.isCheckedIn ? 'Punch Out' : 'Punch In'}
// //                             </button>
// //                           )}
// //                           <button onClick={() => { 
// //                             setSelectedUser(emp); 
// //                             setShowModal(true); 
// //                             setHistoryData(st.history || []);
// //                           }} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-slate-400 hover:text-indigo-500 transition-all">
// //                             <CalendarIcon size={14}/>
// //                           </button>
// //                         </div>
// //                       </td>
// //                     </tr>
// //                   );
// //                 })}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>
// //       </div>

// //       {/* CONFIRMATION MODAL */}
// //       <AnimatePresence>
// //         {showConfirm && (
// //           <div className="fixed inset-0 flex items-center justify-center z-[150] backdrop-blur-md bg-slate-900/40 p-4" onClick={() => setShowConfirm(false)}>
// //             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 w-80 text-center" onClick={e => e.stopPropagation()}>
// //               <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div>
// //               <h3 className="text-sm font-black uppercase text-slate-800 mb-2">Punch Confirmation</h3>
// //               <p className="text-[10px] font-bold text-slate-500 uppercase mb-6 leading-relaxed">Proceed with current check-in/out action?</p>
// //               <div className="flex gap-3">
// //                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-xl">Cancel</button>
// //                 <button onClick={confirmPunch} className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md">Confirm</button>
// //               </div>
// //             </motion.div>
// //           </div>
// //         )}
// //       </AnimatePresence>

// //       {/* HISTORY MODAL */}
// //       <AnimatePresence>
// //         {showModal && (
// //           <div className="fixed inset-0 flex items-center justify-center z-[110] backdrop-blur-sm bg-slate-900/60 p-4" onClick={() => setShowModal(false)}>
// //             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[var(--border-color)] flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
// //               <div className="flex-1">
// //                 <div className="flex items-center justify-between mb-4">
// //                   <h3 className="text-xs font-black uppercase text-[var(--text-main)]">History Calendar</h3>
// //                   <div className="flex gap-2">
// //                     <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1.5 hover:bg-[var(--bg-body)] rounded-lg"><ChevronLeft size={14}/></button>
// //                     <span className="text-[10px] font-black uppercase text-indigo-500 mt-1">{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
// //                     <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1.5 hover:bg-[var(--bg-body)] rounded-lg"><ChevronRight size={14}/></button>
// //                   </div>
// //                 </div>
// //                 <div className="grid grid-cols-7 gap-1">
// //                    {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[8px] font-black text-slate-400 text-center py-1">{d}</span>)}
// //                    {Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()).fill(0).map((_, i) => <div key={i} />)}
// //                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
// //                       const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
// //                       const dStr = date.toLocaleDateString('sv');
// //                       const dayLogs = historyData.filter(h => h.attendanceDate?.split('T')[0] === dStr);
// //                       const hasMissingCheckout = dayLogs.some(l => l.checkInTime && !l.checkOutTime);
// //                       const hasCheckin = dayLogs.length > 0;
// //                       const isPast = date < new Date().setHours(0,0,0,0);
// //                       const isToday = dStr === new Date().toLocaleDateString('sv');

// //                       let bgColor = "bg-[var(--bg-body)] text-slate-400";
// //                       let icon = null;

// //                       if (hasCheckin) {
// //                         if (hasMissingCheckout && !isToday) {
// //                           bgColor = "bg-amber-100 text-amber-700 border border-amber-200";
// //                           icon = <AlertTriangle size={8} className="absolute top-0.5 right-0.5" />;
// //                         } else {
// //                           bgColor = "bg-emerald-500 text-white";
// //                         }
// //                       } else if (isPast) {
// //                         bgColor = "bg-rose-50 text-rose-400 border border-rose-100";
// //                       }

// //                       return (
// //                         <button key={dStr} onClick={() => setSelectedDate(dStr)} className={`h-9 w-full rounded-lg text-[9px] font-bold transition-all relative ${bgColor} ${selectedDate === dStr ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}>
// //                           {i + 1}
// //                           {icon}
// //                         </button>
// //                       )
// //                    })}
// //                 </div>
// //               </div>
// //               <div className="w-full md:w-64 border-l border-[var(--border-color)] pl-6 flex flex-col">
// //                 <h4 className="text-sm font-black text-indigo-500 uppercase mb-4 truncate">{selectedUser?.username}</h4>
// //                 <div className="bg-[var(--bg-body)] rounded-xl p-3 mb-4 border border-[var(--border-color)]">
// //                   <div className="flex justify-between mb-1">
// //                     <span className="text-[8px] font-black text-slate-400 uppercase">Sessions</span>
// //                     <span className="text-[10px] font-black text-[var(--text-main)]">{historyData.filter(h => h.attendanceDate?.split('T')[0] === selectedDate).length}</span>
// //                   </div>
// //                   <div className="flex justify-between items-center min-h-[1.5rem]">
// //                     <span className="text-[8px] font-black text-slate-400 uppercase">Total Time</span>
// //                     <span className={`text-[10px] font-black tabular-nums ${selectedDayStats.isGoalMet ? 'text-emerald-500' : 'text-indigo-500'}`}>
// //                       {selectedDayStats.formatted}
// //                     </span>
// //                   </div>
// //                   <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
// //                     <div 
// //                       className={`h-full transition-all duration-300 ${selectedDayStats.isGoalMet ? 'bg-emerald-500' : 'bg-indigo-500'}`}
// //                       style={{ width: `${Math.min((selectedDayStats.totalMinutes / 480) * 100, 100)}%` }}
// //                     />
// //                   </div>
// //                   <p className="text-[6px] font-black text-slate-400 mt-1 uppercase text-right tracking-widest">Target: 8h Net</p>
// //                 </div>
// //                 <div className="flex-1 space-y-2 overflow-y-auto max-h-40 custom-scrollbar pr-1">
// //                   {historyData.filter(h => h.attendanceDate?.split('T')[0] === selectedDate).map((log, i) => (
// //                     <div key={i} className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] flex items-center justify-between">
// //                        <Clock size={10} className="text-slate-400" />
// //                        <p className="text-[9px] font-bold text-[var(--text-main)] uppercase">{log.checkInTime.slice(11, 16)} — {log.checkOutTime?.slice(11, 16) || 'ACTIVE'}</p>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <button onClick={() => setShowModal(false)} className="mt-4 w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md active:scale-95 transition-all">Close Viewer</button>
// //               </div>
// //             </motion.div>
// //           </div>
// //         )}
// //       </AnimatePresence>
// //     </div>
// //   );
// // }

// // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


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

//     if (isLive && activeSessionStart) {
//       totalMs += (currentTime - activeSessionStart);
//     }

//     const totalSeconds = Math.floor(totalMs / 1000);
//     const hours = Math.floor(totalSeconds / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const seconds = totalSeconds % 60;
    
//     const isGoalMet = (totalSeconds / 60) >= 480; // 8 Hours

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
//             const stats = getWorkStats(history, localToday, false);
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

//       {/* MAIN CONTENT */}
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
                      
//                       // Status Checking
//                       const stats = getWorkStats(historyData, dStr, false);
//                       const hasMissingCheckout = dayLogs.some(l => l.checkInTime && !l.checkOutTime);
//                       const hasCheckin = dayLogs.length > 0;
//                       const isPast = date < new Date().setHours(0,0,0,0);
//                       const isToday = dStr === new Date().toLocaleDateString('sv');

//                       let bgColor = "bg-[var(--bg-body)] text-slate-400";
//                       let icon = null;

//                       if (hasCheckin) {
//                         // FIX: If goal is not met (even if checkout exists), show yellow caution icon
//                         if (!stats.isGoalMet && !isToday) {
//                           bgColor = "bg-amber-100 text-amber-700 border border-amber-200";
//                           icon = <AlertTriangle size={8} className="absolute top-0.5 right-0.5" />;
//                         } else if (stats.isGoalMet) {
//                           bgColor = "bg-emerald-500 text-white";
//                         } else {
//                           // Today in progress
//                           bgColor = "bg-indigo-600 text-white";
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
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  Search, Loader2, Activity, History, X, Calendar as CalendarIcon, Clock, 
  LogIn, LogOut, ChevronLeft, ChevronRight, AlertTriangle, MapPin, Globe, Footprints, 
  Users, UserCheck, UserMinus, Umbrella, Filter, Map, Navigation, ShieldCheck, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

// API IMPORTS
import { getAdminUsers } from "../../api/admin/users.api";
import { 
  checkIn, checkOut, getAttendanceHistory, updateLiveLocation, 
  getUserLiveLocation, getAllLeaves, getTotalHours, getAllLiveLocations, getLocationTrail 
} from "../api/api.attendance";

export default function Attendance() {
  // --- STATE MANAGEMENT ---
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onLeaveCount, setOnLeaveCount] = useState(0);
  const [leaveUsers, setLeaveUsers] = useState([]);

  // --- MODAL STATES ---
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // --- HISTORY DETAIL STATES ---
  const [historyData, setHistoryData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv')); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [totalWorkHours, setTotalWorkHours] = useState("0");
  const [locationTrail, setLocationTrail] = useState([]);
  const [livePos, setLivePos] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // --- AUTHENTICATION ---
  const auth = useMemo(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return { userId: null, isManager: false };
    try {
      const decoded = jwtDecode(token);
      const ROLE_KEY = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const isManager = decoded.role === "HR_MANAGER" || decoded[ROLE_KEY] === "HR_MANAGER";
      return { 
        userId: Number(decoded.sub || decoded.id), 
        isManager: isManager,
        name: decoded.username || decoded.unique_name || "Authorized User"
      };
    } catch (e) { return { userId: null, isManager: false }; }
  }, []);

  // --- CLOCK TIMER ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- GEOLOCATION PRE-CHECK ---
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(res => {
        setIsLocationEnabled(res.state === 'granted');
        res.onchange = () => setIsLocationEnabled(res.state === 'granted');
      });
    }
  }, []);

  // --- WORK STATS CALCULATION ---
  const getWorkStats = useCallback((logs, targetDate) => {
    if (!logs || !Array.isArray(logs)) return { formatted: "0h : 0m", totalMinutes: 0, isGoalMet: false };
    const dayLogs = logs.filter(l => l.attendanceDate?.split('T')[0] === targetDate);
    let totalMs = 0;
    dayLogs.forEach(log => {
      if (log.checkInTime && log.checkOutTime) {
        totalMs += (new Date(log.checkOutTime) - new Date(log.checkInTime));
      }
    });
    const totalSeconds = Math.floor(totalMs / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const totalMinutes = totalSeconds / 60;
    return { 
      formatted: `${hrs}h : ${mins}m`, 
      totalMinutes, 
      isGoalMet: totalMinutes >= 480 
    };
  }, []);

  // --- DATA LOADING LOGIC ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toLocaleDateString('sv');
      const [uRes, leaveRes] = await Promise.all([
        getAdminUsers({ page: 1, pageSize: 200 }),
        getAllLeaves()
      ]);

      const usersList = uRes?.users || uRes || [];
      const allLeaves = leaveRes?.data || leaveRes || [];

      // Filter users on leave today
      const usersOnLeave = allLeaves
        .filter(l => (l.status || "").toLowerCase() === 'approved' && todayStr >= l.startDate.split('T')[0] && todayStr <= l.endDate.split('T')[0])
        .map(l => Number(l.userId));
      
      setLeaveUsers(usersOnLeave);
      setOnLeaveCount(usersOnLeave.length);

      // Role Based user filtering
      const filteredUsers = auth.isManager ? usersList : usersList.filter(u => Number(u.userId) === auth.userId);
      
      const newAttendanceMap = {};
      await Promise.all(filteredUsers.map(async (emp) => {
        let employeeState = { isCheckedIn: false, lastAction: "---", totalToday: "0h : 0m", history: [], goalMet: false, rawLogs: [] };
        try {
          const historyRes = await getAttendanceHistory(emp.userId);
          const history = historyRes?.data || [];
          employeeState.history = history;
          
          const stats = getWorkStats(history, todayStr);
          employeeState.totalToday = stats.formatted;
          employeeState.goalMet = stats.isGoalMet;
          
          const todayLogs = history.filter(l => l.attendanceDate?.split('T')[0] === todayStr);
          if (todayLogs.length > 0) {
            const latestLog = [...todayLogs].sort((a,b) => new Date(b.checkInTime) - new Date(a.checkInTime))[0];
            employeeState.isCheckedIn = !!latestLog.checkInTime && !latestLog.checkOutTime;
            employeeState.lastAction = latestLog.checkOutTime 
              ? `OUT ${new Date(latestLog.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
              : `IN ${new Date(latestLog.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
          }
        } catch (e) { console.error(`Error loading UID ${emp.userId}`); }
        newAttendanceMap[emp.userId] = employeeState;
      }));

      setAttendanceMap(newAttendanceMap);
      setEmployees(filteredUsers);
    } catch (err) {
      toast.error("Global Registry Sync Error");
    } finally {
      setLoading(false);
    }
  }, [auth, getWorkStats]);

  useEffect(() => {
    if(auth.userId) loadData();
  }, [loadData, auth.userId]);

  // --- BACKGROUND LOCATION UPDATES (API 5) ---
  useEffect(() => {
    let locInterval;
    if (attendanceMap[auth.userId]?.isCheckedIn) {
      locInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => updateLiveLocation(auth.userId, pos.coords.latitude, pos.coords.longitude),
          null,
          { enableHighAccuracy: true }
        );
      }, 60000);
    }
    return () => clearInterval(locInterval);
  }, [attendanceMap, auth.userId]);

  // --- PUNCH ACTION ---
  const handlePunchAction = async () => {
    if (!navigator.geolocation) {
      return toast.error("Browser does not support Geolocation.");
    }

    const tid = toast.loading("Authenticating GPS Coordinates...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const isCurrentlyIn = attendanceMap[pendingAction]?.isCheckedIn;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (isCurrentlyIn) {
            await checkOut(pendingAction);
          } else {
            await checkIn(pendingAction, lat, lng);
          }
          
          toast.success("Attendance Logged Successfully", { id: tid });
          setShowConfirm(false);
          loadData();
        } catch (err) {
          toast.error("Punch Failed: System connection error", { id: tid });
        }
      },
      (error) => {
        toast.error("Location Required. Please enable GPS in browser.", { id: tid });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- HISTORY VIEW HANDLER (API 3, 7, 8) ---
  const openDetailedHistory = async (emp) => {
    setSelectedUser(emp);
    const userHistory = attendanceMap[emp.userId]?.history || [];
    setHistoryData(userHistory);
    setShowModal(true);
    
    // Clear old detail states
    setTotalWorkHours("Loading...");
    setLocationTrail([]);
    setLivePos(null);

    try {
      const [hours, live, trail] = await Promise.allSettled([
        getTotalHours(emp.userId),
        getUserLiveLocation(emp.userId),
        getLocationTrail(emp.userId, selectedDate)
      ]);

      setTotalWorkHours(hours.status === 'fulfilled' ? hours.value.data : "0");
      setLivePos(live.status === 'fulfilled' ? live.value.data : null);
      setLocationTrail(trail.status === 'fulfilled' ? trail.value.data : []);
    } catch (e) {
      console.warn("Supplementary API data missing for user.");
    }
  };

  // --- SEARCH & FILTER ---
  const filteredList = useMemo(() => {
    return employees.filter(e => {
      const nameMatch = (e.username || e.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const idMatch = e.userId?.toString().includes(searchTerm);
      const isCheckedIn = attendanceMap[e.userId]?.isCheckedIn;
      const onLeave = leaveUsers.includes(Number(e.userId));

      if (filterType === 'active') return (nameMatch || idMatch) && isCheckedIn;
      if (filterType === 'inactive') return (nameMatch || idMatch) && !isCheckedIn && !onLeave;
      if (filterType === 'onleave') return (nameMatch || idMatch) && onLeave;
      return nameMatch || idMatch;
    });
  }, [employees, searchTerm, filterType, attendanceMap, leaveUsers]);

  // --- CALENDAR GENERATION ---
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth]);

  return (
    <div className="flex h-[88vh] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden font-sans transition-all duration-300">
      <Toaster position="top-right" />

      {/* --- LEFT SIDEBAR (ORIGINAL 800-LINE DESIGN) --- */}
      {auth.isManager && (
        <div className="w-72 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)] relative">
          <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-body)]/30">
             <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-indigo-600"/>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Admin Dashboard</h2>
             </div>
             <p className="text-[9px] text-slate-400 font-bold uppercase">{currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-body)]/20 custom-scrollbar">
            <SidebarStat icon={<Users size={16}/>} label="Total Employees" val={employees.length} onClick={() => setFilterType('all')} active={filterType==='all'} />
            <SidebarStat icon={<UserCheck size={16}/>} label="Present Employees" val={Object.values(attendanceMap).filter(v=>v.isCheckedIn).length} onClick={() => setFilterType('active')} active={filterType==='active'} color="text-emerald-500" />
            <SidebarStat icon={<UserMinus size={16}/>} label="Absent Employees" val={employees.length - Object.values(attendanceMap).filter(v=>v.isCheckedIn).length - leaveUsers.length} onClick={() => setFilterType('inactive')} active={filterType==='inactive'} color="text-rose-500" />
            <SidebarStat icon={<Umbrella size={16}/>} label="On Leave" val={leaveUsers.length} onClick={() => setFilterType('onleave')} active={filterType==='onleave'} color="text-amber-500" />
            
            <div className="mt-8 p-4 bg-indigo-600/5 rounded-2xl border border-indigo-500/10">
               <div className="flex items-center gap-2 mb-2">
                  <Navigation size={14} className="text-indigo-600 animate-pulse"/>
                  <span className="text-[10px] font-black uppercase text-indigo-600">Location Monitoring</span>
               </div>
               <p className="text-[9px] text-slate-500 leading-relaxed font-medium">System is currently capturing real-time GPS trails for all active sessions to ensure terminal validity.</p>
            </div>
          </div>
          
          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-body)]/30">
             <button onClick={loadData} className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""}/> Sync Registry
             </button>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-color)]">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                 <Activity size={22} />
              </div>
              <div>
                 <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-none mb-1">Attendance Terminal</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Real-time Personnel Tracking System</p>
              </div>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input type="text" placeholder="Search by name or ID..." className="text-xs font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl pl-11 pr-6 py-2.5 outline-none w-72 text-[var(--text-main)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" onChange={e => setSearchTerm(e.target.value)} />
           </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex-1 overflow-auto p-6 bg-[var(--bg-body)]/10">
           <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden shadow-2xl shadow-slate-200/50">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-[var(--bg-body)]/50 border-b border-[var(--border-color)] sticky top-0 z-10 backdrop-blur-md">
                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                       <th className="px-8 py-5">Personnel Profile</th>
                       <th className="px-8 py-5 text-center">Net Efficiency</th>
                       <th className="px-8 py-5 text-center">Last Known Event</th>
                       <th className="px-8 py-5 text-right">System Control</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--border-color)]/40">
                    {filteredList.map(emp => {
                       const state = attendanceMap[emp.userId] || {};
                       const isSelf = Number(emp.userId) === auth.userId;
                       const isOnLeave = leaveUsers.includes(Number(emp.userId));
                       
                       return (
                          <tr key={emp.userId} className="group hover:bg-indigo-500/[0.02] transition-colors">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                   <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-black border ${state.isCheckedIn ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-[var(--bg-body)] text-slate-400 border-[var(--border-color)]'}`}>
                                      {emp.username?.charAt(0).toUpperCase()}
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">{emp.username || emp.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">Employee ID: #{emp.userId}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5 text-center">
                                <span className={`text-[12px] font-black px-3 py-1 rounded-lg ${state.goalMet ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                   {state.totalToday}
                                </span>
                             </td>
                             <td className="px-8 py-5 text-center">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${
                                   isOnLeave ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                                   state.isCheckedIn ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-[var(--bg-body)] text-slate-400 border-[var(--border-color)]"
                                }`}>
                                   {isOnLeave ? <><Umbrella size={10}/> On Leave</> : state.lastAction}
                                </div>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-3">
                                   {isSelf && !isOnLeave && (
                                      <button onClick={() => { setPendingAction(emp.userId); setShowConfirm(true); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-xl transition-all active:scale-95 ${state.isCheckedIn ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/20'}`}>
                                         {state.isCheckedIn ? 'Check Out' : 'Check In'}
                                      </button>
                                   )}
                                   {isSelf && isOnLeave && <div className="text-[10px] font-black text-amber-500 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">LOCKED (LEAVE)</div>}
                                   <button onClick={() => openDetailedHistory(emp)} className="p-2.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm">
                                      <History size={18}/>
                                   </button>
                                </div>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
              {loading && <div className="p-32 text-center bg-[var(--bg-card)]"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /></div>}
           </div>
        </div>
      </div>

      {/* --- CONFIRMATION DIALOG (ORIGINAL DESIGN) --- */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-[500] backdrop-blur-md bg-black/70 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] rounded-[2.5rem] p-10 border border-[var(--border-color)] w-full max-w-md text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
              <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-12 transition-transform hover:rotate-0"><MapPin size={40} className="text-indigo-600" /></div>
              <h3 className="text-xl font-black uppercase text-[var(--text-main)] mb-3">GPS Authentication</h3>
              <p className="text-xs font-bold text-slate-500 uppercase mb-10 leading-relaxed px-4">Our system requires real-time Geolocation validation to verify your terminal presence. Proceed with current coordinates?</p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-[var(--bg-body)] text-slate-400 text-xs font-black rounded-2xl uppercase border border-[var(--border-color)] hover:bg-slate-50">Dismiss</button>
                <button onClick={handlePunchAction} className="flex-1 py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl shadow-2xl shadow-indigo-600/30 uppercase active:scale-95 transition-all">Authorize Punch</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HISTORY MODAL (EXPANDED 800-LINE DESIGN) --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] backdrop-blur-xl bg-black/60 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[var(--bg-card)] w-full max-w-5xl rounded-[3rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)] border border-[var(--border-color)] flex flex-col md:flex-row gap-0 overflow-hidden h-[85vh]" onClick={e => e.stopPropagation()}>
              
              {/* LEFT: CALENDAR AREA */}
              <div className="flex-1 p-10 overflow-y-auto">
                 <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-6 mb-8">
                    <div>
                       <h3 className="text-base font-black uppercase text-[var(--text-main)] tracking-[0.2em] mb-1">Attendance Registry</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Viewing logs for {selectedUser?.username}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-[var(--bg-body)] p-1.5 rounded-2xl border">
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronLeft size={20}/></button>
                      <span className="text-xs font-black uppercase text-indigo-600 w-32 text-center">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronRight size={20}/></button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-7 gap-3">
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <span key={d} className="text-[9px] font-black text-slate-400 text-center uppercase mb-4 tracking-widest">{d.slice(0,3)}</span>)}
                    {calendarDays.map((day, idx) => {
                      if (day === null) return <div key={idx} />;
                      const dStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toLocaleDateString('sv');
                      const hasLogs = historyData.some(h => h.attendanceDate?.split('T')[0] === dStr);
                      const isSelected = selectedDate === dStr;
                      
                      return (
                        <button key={idx} onClick={() => setSelectedDate(dStr)} className={`h-14 w-full rounded-2xl text-xs font-black transition-all transform hover:scale-105 ${
                          hasLogs ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-[var(--bg-body)] text-slate-400'
                        } ${isSelected ? 'ring-4 ring-indigo-600 ring-offset-4 ring-offset-[var(--bg-card)]' : ''}`}>{day}</button>
                      );
                    })}
                 </div>

                 {/* API 3: SUMMARY BANNER */}
                 <div className="mt-12 p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] text-white shadow-2xl shadow-indigo-600/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Cumulative Work Contribution</p>
                      <p className="text-4xl font-black">{totalWorkHours} <span className="text-base opacity-60 font-medium tracking-normal">Net Hours</span></p>
                    </div>
                    <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                       <Activity size={32} />
                    </div>
                 </div>
              </div>

              {/* RIGHT: DETAIL PANEL */}
              <div className="w-full md:w-96 bg-[var(--bg-body)]/40 border-l border-[var(--border-color)] p-10 flex flex-col overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-lg text-indigo-600 font-black">
                         {selectedUser?.username?.charAt(0)}
                      </div>
                      <h4 className="text-sm font-black text-indigo-500 uppercase tracking-tight">{selectedUser?.username}</h4>
                   </div>
                   <button onClick={() => setShowModal(false)} className="p-2 hover:bg-rose-50 rounded-xl transition-all text-slate-400 hover:text-rose-500"><X size={24}/></button>
                </div>
                
                {/* API 8: LIVE GPS BOX */}
                <div className="p-5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border-color)] shadow-xl mb-8 group hover:border-indigo-500/50 transition-colors">
                   <div className="flex items-center gap-2 mb-3"><Globe size={16} className="text-indigo-500 animate-spin-slow"/> <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Position (Live)</p></div>
                   <p className="text-[11px] font-black text-[var(--text-main)] truncate font-mono">{livePos ? `${livePos.latitude.toFixed(6)}, ${livePos.longitude.toFixed(6)}` : 'Signal Search in progress...'}</p>
                </div>

                {/* API 7: MOVEMENT TRAIL */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 text-slate-400"><Footprints size={16}/><p className="text-[11px] font-black uppercase tracking-widest">Transit Trail</p></div>
                  <div className="space-y-2 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                    {locationTrail.length > 0 ? locationTrail.map((t, idx) => (
                      <div key={idx} className="text-[10px] p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] flex justify-between items-center shadow-sm">
                        <span className="font-bold text-slate-400">{new Date(t.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        <span className="font-black text-indigo-600 text-[10px]">{t.latitude?.toFixed(3)}, {t.longitude?.toFixed(3)}</span>
                      </div>
                    )) : <p className="text-[10px] italic text-slate-400 text-center py-4 bg-[var(--bg-card)] rounded-xl border border-dashed">No transit trail data available.</p>}
                  </div>
                </div>

                {/* DAILY LOG LIST */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Punch Logs: {new Date(selectedDate).toLocaleDateString()}</p>
                  <div className="space-y-3">
                    {historyData.filter(h => h.attendanceDate?.split('T')[0] === selectedDate).length > 0 ? (
                      historyData.filter(h => h.attendanceDate?.split('T')[0] === selectedDate).map((log, i) => (
                        <div key={i} className="p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm relative group overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                           <p className="text-[11px] font-black text-[var(--text-main)] uppercase mb-2">{log.checkInTime.slice(11, 16)} - {log.checkOutTime?.slice(11, 16) || 'ACTIVE'}</p>
                           <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]/50">
                              <MapPin size={12} className="text-indigo-500"/><span className="text-[9px] font-black uppercase text-slate-400">Punch GPS: {log.latitude?.toFixed(4)}, {log.longitude?.toFixed(4)}</span>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center bg-rose-500/5 rounded-2xl border border-rose-500/10">
                         <p className="text-xs font-black text-rose-500 uppercase tracking-tighter italic">No Logs Registered</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <button onClick={() => setShowModal(false)} className="mt-8 w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl shadow-2xl active:scale-95 transition-all">Close Registry Viewer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- HELPER SUB-COMPONENTS (RESTORED ARCHITECTURE) ---

const SidebarStat = ({ icon, label, val, onClick, active, color="text-[var(--text-main)]" }) => (
  <button onClick={onClick} className={`w-full p-4 rounded-3xl border flex items-center justify-between transition-all duration-300 transform ${active ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 -translate-y-1' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-slate-50'}`}>
    <div className="flex items-center gap-4">
       <div className={`p-3 rounded-2xl ${active ? 'bg-white/20' : 'bg-[var(--bg-body)] text-indigo-600 shadow-inner'}`}>{icon}</div>
       <p className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-white' : 'text-slate-500'}`}>{label}</p>
    </div>
    <p className={`text-base font-black ${active ? 'text-white' : color}`}>{val}</p>
  </button>
);