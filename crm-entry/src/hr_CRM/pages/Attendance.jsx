import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Search, Loader2, Activity, 
  History, X, ArrowUpRight
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// API IMPORTS
import { getAdminUsers } from "../../api/admin/users.api";
import { checkIn, checkOut, getAttendanceHistory } from "../api/api.attendance";
import { getAssignedUsers } from "../api/shift.api";

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const currentUser = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return { userId: null, role: 'USER' };
      const payload = JSON.parse(atob(token.split(".")[1]));
      return { 
        userId: payload.id || payload.userId, 
        role: payload.role || "USER",
        username: payload.username || "Me" 
      };
    } catch (e) { return { userId: null, role: 'USER' }; }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, aRes] = await Promise.allSettled([
        getAdminUsers({ page: 1, pageSize: 100 }), 
        getAssignedUsers()
      ]);

      let users = uRes.status === "fulfilled" ? (uRes.value?.users ?? []) : [];
      if (users.length === 0 && currentUser.userId) {
        users = [{ ...currentUser, name: "My Profile" }];
      }
      
      const shifts = aRes.status === "fulfilled" ? (aRes.value || []) : [];
      const today = new Date().toISOString().slice(0, 10);
      const newMap = {};

      // Fetch history for each user
      await Promise.all(users.map(async (emp) => {
        const shift = shifts.find((s) => String(s.userId) === String(emp.userId));
        let state = { isCheckedIn: false, count: 0, lastAction: "---", rawTime: null };
        
        try {
          const res = await getAttendanceHistory(emp.userId);
          const history = res?.data || [];
          
          if (Array.isArray(history) && history.length > 0) {
            const todayLogs = history
              .filter(l => l.attendanceDate?.slice(0, 10) === today)
              .sort((a,b) => new Date(b.checkInTime) - new Date(a.checkInTime));

            if (todayLogs.length > 0) {
              const latest = todayLogs[0];
              state.count = todayLogs.length;
              state.isCheckedIn = !!latest.checkInTime && !latest.checkOutTime;
              state.rawTime = latest.checkOutTime || latest.checkInTime;
              state.lastAction = latest.checkOutTime 
                ? `OUT ${latest.checkOutTime.slice(11, 16)}` 
                : `IN ${latest.checkInTime.slice(11, 16)}`;
            }
          }
        } catch (e) {
          // Errors are now handled quietly in the API file
        }

        newMap[emp.userId] = { 
          shiftName: shift?.shiftName || "Standard", 
          ...state 
        };
      }));

      setAttendanceMap(newMap);
      setEmployees(users);
    } catch (err) {
      toast.error("Sync Failed");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePunch = async (userId, type) => {
    const tid = toast.loading("Syncing...");
    try {
      type === "in" ? await checkIn(userId) : await checkOut(userId);
      toast.success("Success", { id: tid });
      await loadData(); 
    } catch (e) {
      toast.error("Punch failed", { id: tid });
    }
  };

  const recentActivity = useMemo(() => {
    return employees
      .filter(e => attendanceMap[e.userId]?.rawTime)
      .sort((a, b) => new Date(attendanceMap[b.userId].rawTime) - new Date(attendanceMap[a.userId].rawTime))
      .slice(0, 8);
  }, [employees, attendanceMap]);

  const filteredEmployees = employees.filter(e => 
    (e.name || e.username || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[550px] w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans">
      <Toaster position="top-right" />

      {/* SIDEBAR */}
      <div className="w-64 border-r border-slate-100 flex flex-col shrink-0 bg-white">
        <div className="p-4 border-b border-slate-50">
          <div className="flex items-center justify-between mb-3">
             <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dashboard</h2>
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
            <input 
              type="text" placeholder="Filter team..."
              className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-8 py-1.5 outline-none focus:ring-1 focus:ring-indigo-100"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-slate-50/30">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[8px] font-black text-slate-400 uppercase">Active</p>
              <p className="text-lg font-black text-indigo-600">{Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[8px] font-black text-slate-400 uppercase">Staff</p>
              <p className="text-lg font-black text-slate-800">{employees.length}</p>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Live Activity</p>
            <div className="space-y-1.5">
              {recentActivity.length > 0 ? recentActivity.map(emp => {
                const st = attendanceMap[emp.userId];
                return (
                  <div key={emp.userId} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${st?.isCheckedIn ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-rose-400'}`} />
                        <p className="text-[9px] font-bold text-slate-600 truncate uppercase">{emp.name || emp.username}</p>
                     </div>
                     <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1 rounded uppercase">{st?.lastAction.split(' ')[0]}</span>
                  </div>
                );
              }) : (
                <p className="text-[9px] text-center text-slate-300 py-4 italic">No activity today</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><Activity size={16} /></div>
            <div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Attendance Log</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{currentUser.role} Access</p>
            </div>
          </div>
          <button onClick={loadData} className="p-2 hover:bg-slate-50 rounded-full">
            <Loader2 size={16} className={loading ? "animate-spin text-indigo-600" : "text-slate-300"} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-50/20">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase">Employee</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase text-center">Logs</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase text-center">Status</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEmployees.map((emp) => {
                  const st = attendanceMap[emp.userId] || { isCheckedIn: false, count: 0, lastAction: '---' };
                  return (
                    <tr key={emp.userId} className="group hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black ${st.isCheckedIn ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {emp.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{emp.name || emp.username}</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{st.shiftName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-black text-slate-700">{st.count}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                          st.isCheckedIn ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-transparent"
                        }`}>
                          {st.lastAction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                         <div className="flex justify-end gap-2">
                           <button disabled={st.isCheckedIn} onClick={() => handlePunch(emp.userId, "in")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${!st.isCheckedIn ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "opacity-20"}`}>In</button>
                           <button disabled={!st.isCheckedIn} onClick={() => handlePunch(emp.userId, "out")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${st.isCheckedIn ? "bg-rose-500 text-white shadow-md shadow-rose-100" : "opacity-20"}`}>Out</button>
                           <button onClick={() => { setSelectedUser(emp); setShowModal(true); getAttendanceHistory(emp.userId).then(r => setHistoryData(r?.data || [])) }} className="p-1.5 text-slate-300 hover:text-indigo-600"><History size={14}/></button>
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

      {/* HISTORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] backdrop-blur-sm bg-slate-900/20 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Employee Log</h3>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase">{selectedUser?.name || selectedUser?.username}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="bg-slate-50 p-1 rounded-lg text-slate-400 hover:text-rose-500"><X size={16}/></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {historyData && historyData.length > 0 ? historyData.map((log, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">{log.attendanceDate?.split('T')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-700">{log.checkInTime?.slice(11, 16)} — {log.checkOutTime?.slice(11, 16) || 'ACTIVE'}</p>
                   </div>
                   <ArrowUpRight size={12} className="text-slate-300" />
                </div>
              )) : (
                <p className="text-[10px] text-center text-slate-400 py-4 uppercase font-bold">No Records Found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}