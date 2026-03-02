import React, { useEffect, useState, useCallback } from "react";
import { getAdminUsers } from "../../api/admin/users.api";
import { checkIn, checkOut, getAttendanceHistory } from "../api/api.attendance";
import { getAssignedUsers } from "../api/shift.api";
import {
  Clock, History, X, Loader2, Search, CheckCircle2,
  AlertTriangle, LogIn, LogOut, UserCircle, ChevronRight
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // LOGIC UNCHANGED
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, assignedRes] = await Promise.all([
        getAdminUsers({ page: 1, pageSize: 100 }),
        getAssignedUsers()
      ]);
      const users = userRes?.users ?? [];
      const shiftAssignments = assignedRes || [];
      const todayGMT = new Date().toISOString().slice(0, 10);
      const newStatusMap = {};

      await Promise.all(users.map(async (emp) => {
        const shift = shiftAssignments.find((s) => String(s.userId) === String(emp.userId));
        let status = { isCheckedIn: false, isCompleted: false, lastAction: "Never" };
        try {
          const hRes = await getAttendanceHistory(emp.userId);
          const history = hRes?.data || [];
          const todayLog = history.find((log) => log.attendanceDate?.slice(0, 10) === todayGMT);
          if (todayLog) {
            status.isCheckedIn = !!todayLog.checkInTime && !todayLog.checkOutTime;
            status.isCompleted = !!todayLog.checkInTime && !!todayLog.checkOutTime;
            status.lastAction = todayLog.checkOutTime ? `Out: ${todayLog.checkOutTime}` : `In: ${todayLog.checkInTime}`;
          }
        } catch (err) {}
        newStatusMap[emp.userId] = { hasShift: !!shift, shiftName: shift?.shiftName || "Unassigned", ...status };
      }));
      setAttendanceMap(newStatusMap);
      setEmployees(users);
    } catch (err) {
      toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePunch = async (userId, type) => {
    const toastId = toast.loading(`${type}...`);
    try {
      if (type === "in") await checkIn(userId);
      else await checkOut(userId);
      toast.success("Punch Sync", { id: toastId });
      setTimeout(() => loadData(), 400);
    } catch (err) {
      toast.error("Punch Failed", { id: toastId });
    }
  };

  const fetchHistory = async (user) => {
    setSelectedUser(user);
    setShowModal(true);
    setHistoryData([]);
    try {
      const res = await getAttendanceHistory(user.userId);
      setHistoryData(res?.data || []);
    } catch (err) { setHistoryData([]); }
  };

  return (
    <div className="flex flex-col h-[520px] w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans mt-1">
      <Toaster position="top-right" />

      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Clock size={16} />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Attendance Manager</h2>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Real-time Terminal v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-40">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
            <input 
              type="text" placeholder="Search ID/Name..."
              className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-7 py-1 outline-none focus:ring-1 focus:ring-indigo-100"
              onChange={(e) => setSearch(e.target.value.toLowerCase())}
            />
          </div>
          <button onClick={loadData} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
            <Loader2 size={14} className={loading ? "animate-spin text-indigo-500" : "text-slate-300"} />
          </button>
        </div>
      </div>

      {/* COMPACT TABLE SECTION */}
      <div className="flex-1 overflow-auto bg-slate-50/20 p-3">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Shift Status</th>
                <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Control</th>
                <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees
                .filter(e => (e.name || e.username || "").toLowerCase().includes(search))
                .map((emp) => {
                  const st = attendanceMap[emp.userId] || { hasShift: false };
                  return (
                    <tr key={emp.userId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400">
                            {emp.name?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-800 uppercase truncate leading-none mb-0.5">{emp.name || emp.username}</p>
                            <p className="text-[8px] font-bold text-slate-400">ID: {emp.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${
                          st.hasShift ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${st.hasShift ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {st.shiftName}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            disabled={!st.hasShift || st.isCheckedIn || st.isCompleted}
                            onClick={() => handlePunch(emp.userId, "in")}
                            className="px-2 py-1 text-[8px] font-black bg-indigo-600 text-white rounded-md uppercase disabled:opacity-20 hover:bg-indigo-700 transition-all"
                          >
                            Punch In
                          </button>
                          <button
                            disabled={!st.isCheckedIn || st.isCompleted}
                            onClick={() => handlePunch(emp.userId, "out")}
                            className="px-2 py-1 text-[8px] font-black bg-white border border-slate-200 text-slate-600 rounded-md uppercase disabled:opacity-20 hover:border-rose-300 hover:text-rose-500 transition-all"
                          >
                            Punch Out
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => fetchHistory(emp)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <History size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MINI HISTORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <History size={12} className="text-indigo-600" /> {selectedUser?.name}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-rose-500"><X size={14}/></button>
            </div>
            <div className="p-3 max-h-60 overflow-y-auto custom-scrollbar space-y-2">
              {historyData.length > 0 ? historyData.map((log, i) => (
                <div key={i} className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">{log.attendanceDate}</p>
                    <p className="text-[10px] font-bold text-slate-700">{log.checkInTime} - {log.checkOutTime || '...'}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    log.status === 'Present' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>{log.status}</span>
                </div>
              )) : <p className="text-center py-5 text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">No Data</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}