import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Search, Loader2, Activity, History, X, 
  Calendar as CalendarIcon, Clock, ArrowRight, User, LogIn, LogOut, ChevronLeft, ChevronRight
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
  
  // Modal & History States
  const [showModal, setShowModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv')); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalTotalHours, setModalTotalHours] = useState("00:00:00");

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
        let state = { isCheckedIn: false, count: 0, lastAction: "---", totalToday: "00:00:00", rawTime: null };
        try {
          const hRes = await getAttendanceHistory(emp.userId);
          const history = hRes?.data || [];
          
          if (Array.isArray(history) && history.length > 0) {
            const todayLogs = history.filter(l => l.attendanceDate?.split('T')[0] === localToday);
            state.count = todayLogs.length; // This is the (4 --> no. of checkins) logic
            
            if (todayLogs.length > 0) {
              const latest = todayLogs.sort((a,b) => new Date(b.checkInTime) - new Date(a.checkInTime))[0];
              state.isCheckedIn = !!latest.checkInTime && !latest.checkOutTime;
              state.rawTime = latest.checkInTime; // For live activity sorting
              state.lastAction = latest.checkOutTime 
                ? `OUT ${latest.checkOutTime.slice(11, 16)}` 
                : `IN ${latest.checkInTime.slice(11, 16)}`;
            }
          }
          
          if (emp.userId === auth.userId) {
            const tRes = await getTotalHours(emp.userId);
            state.totalToday = tRes.data?.totalHours?.split('.')[0] || "00:00:00";
          }
        } catch (e) {}
        newMap[emp.userId] = state;
      }));

      setAttendanceMap(newMap);
      setEmployees(usersToProcess);
    } catch (err) { toast.error("Sync Failed"); }
    finally { setLoading(false); }
  }, [auth]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePunch = async (userId) => {
    const isCurrentlyIn = attendanceMap[userId]?.isCheckedIn;
    const tid = toast.loading(isCurrentlyIn ? "Checking Out..." : "Checking In...");
    try {
      isCurrentlyIn ? await checkOut(userId) : await checkIn(userId);
      toast.success("Success", { id: tid });
      await loadData(); 
    } catch (e) { toast.error("Action Failed", { id: tid }); }
  };

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const modalDailyStats = useMemo(() => {
    const logs = historyData.filter(h => h.attendanceDate.split('T')[0] === selectedDate);
    return {
      count: logs.length,
      logs: logs.sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime))
    };
  }, [historyData, selectedDate]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      (e.username || e.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // LIVE ACTIVITY LOGIC
  const liveActivity = useMemo(() => {
    return employees
      .filter(e => attendanceMap[e.userId]?.rawTime)
      .sort((a, b) => new Date(attendanceMap[b.userId].rawTime) - new Date(attendanceMap[a.userId].rawTime))
      .slice(0, 5);
  }, [employees, attendanceMap]);

  return (
    <div className="flex h-[550px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans transition-colors duration-300">
      <Toaster position="top-right" />

      {/* SIDEBAR (Managers Only) */}
      {auth.isManager && (
        <div className="w-64 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-body)]/30">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Dashboard</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-[var(--bg-body)]/30 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase">Active</p>
                <p className="text-lg font-black text-emerald-500">{Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
              </div>
              <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase">Staff</p>
                <p className="text-lg font-black text-[var(--text-main)]">{employees.length}</p>
              </div>
            </div>

            {/* LIVE ACTIVITY SECTION */}
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg"><Activity size={18} /></div>
            <div>
              <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Attendance Log</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{auth.isManager ? 'Manager' : 'Personal'} View</p>
            </div>
          </div>
          {auth.isManager && (
            <input type="text" placeholder="Search team..." className="text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg px-4 py-1.5 outline-none text-[var(--text-main)] w-48 shadow-inner" onChange={(e) => setSearchTerm(e.target.value)} />
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 bg-[var(--bg-body)]/20 custom-scrollbar">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Logs</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-right tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/30">
                {filteredEmployees.map((emp) => {
                  const st = attendanceMap[emp.userId] || {};
                  const isSelf = Number(emp.userId) === auth.userId;
                  return (
                    <tr key={emp.userId} className="hover:bg-indigo-500/[0.01] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${st.isCheckedIn ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-[var(--bg-body)] text-slate-400 border-[var(--border-color)]'}`}>
                            {emp.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--text-main)] uppercase leading-none">{emp.name || emp.username}</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">ID: {emp.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-[var(--text-main)]">{st.count} Sessions</span>
                           {isSelf && <span className="text-[8px] font-bold text-indigo-500 uppercase">{st.totalToday} Worked</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${st.isCheckedIn ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm" : "bg-slate-100 text-slate-400 border-transparent"}`}>
                          {st.lastAction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {isSelf && (
                            <button 
                              onClick={() => handlePunch(emp.userId)} 
                              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all shadow-md active:scale-95 ${st.isCheckedIn ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/20'}`}
                            >
                              {st.isCheckedIn ? 'Punch Out' : 'Punch In'}
                            </button>
                          )}
                          <button onClick={() => { 
                            setSelectedUser(emp); 
                            setShowModal(true); 
                            getAttendanceHistory(emp.userId).then(r => setHistoryData(r?.data || [])); 
                            if(isSelf) getTotalHours(emp.userId).then(r => setModalTotalHours(r.data?.totalHours?.split('.')[0] || "00:00:00"));
                          }} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-slate-400 hover:text-indigo-500 transition-all hover:bg-white hover:shadow-sm">
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

      {/* VIEW MODAL (Logic for selected date history) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] backdrop-blur-sm bg-slate-900/60 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[var(--border-color)] flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase text-[var(--text-main)]">Employee Calendar</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1.5 hover:bg-[var(--bg-body)] rounded-lg"><ChevronLeft size={14}/></button>
                    <span className="text-[10px] font-black uppercase text-indigo-500 mt-1">{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1.5 hover:bg-[var(--bg-body)] rounded-lg"><ChevronRight size={14}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                   {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[8px] font-black text-slate-400">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                   {Array(daysInMonth[0]?.getDay()).fill(0).map((_, i) => <div key={i} />)}
                   {daysInMonth.map(date => {
                      const dStr = date.toLocaleDateString('sv');
                      const hasData = historyData.some(h => h.attendanceDate.split('T')[0] === dStr);
                      const isSelected = selectedDate === dStr;
                      return (
                        <button key={dStr} onClick={() => setSelectedDate(dStr)} className={`h-8 w-full rounded-lg text-[9px] font-bold transition-all ${hasData ? 'bg-emerald-500 text-white shadow-sm' : 'bg-[var(--bg-body)] text-slate-400'} ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}>
                          {date.getDate()}
                        </button>
                      )
                   })}
                </div>
              </div>
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-[var(--border-color)] pt-4 md:pt-0 md:pl-6 flex flex-col">
                <div className="mb-4">
                  <h4 className="text-sm font-black text-indigo-500 uppercase tracking-tight truncate">{selectedUser?.username || selectedUser?.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</p>
                </div>
                <div className="bg-[var(--bg-body)] rounded-xl p-3 mb-4 border border-[var(--border-color)]">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Sessions</span>
                      <span className="text-[10px] font-black text-[var(--text-main)]">{modalDailyStats.count} Logs</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Total Hours</span>
                      <span className="text-[10px] font-black text-indigo-500">{selectedDate === new Date().toLocaleDateString('sv') && Number(selectedUser?.userId) === auth.userId ? modalTotalHours : '--:--'}</span>
                   </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-48 custom-scrollbar pr-1">
                  {modalDailyStats.logs.map((log, i) => (
                    <div key={i} className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] flex items-center justify-between">
                       <Clock size={12} className="text-slate-400" />
                       <p className="text-[9px] font-bold text-[var(--text-main)] uppercase">{log.checkInTime.slice(11, 16)} — {log.checkOutTime?.slice(11, 16) || 'ACTIVE'}</p>
                    </div>
                  ))}
                  {modalDailyStats.logs.length === 0 && <p className="text-[9px] text-center text-slate-400 py-6 uppercase font-bold italic tracking-widest opacity-50">Empty Record</p>}
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