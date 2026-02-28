import { useEffect, useState } from "react";
import { getAdminUsers } from "../../api/admin/users.api";
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
} from "../api/api.attendance";
import { getUserShift } from "../api/shift.api"; 
import { Clock, UserCheck, History, X, AlertCircle, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page: 1, pageSize: 50 });
      const users = res?.users ?? [];
      setEmployees(users);
      
      const map = {};
      const todayStr = new Date().toISOString().split('T')[0];

      await Promise.all(users.map(async (emp) => {
        try {
          const historyRes = await getAttendanceHistory(emp.userId);
          const history = historyRes.data || [];
          
          if (history.length > 0) {
            // Sort to get the absolute latest record
            const latest = history.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate))[0];
            const recordDate = new Date(latest.attendanceDate).toISOString().split('T')[0];

            // LOGIC: Is the latest check-in from TODAY and still active?
            const isActiveToday = (recordDate === todayStr && latest.checkInTime && !latest.checkOutTime);

            map[emp.userId] = {
              status: recordDate === todayStr ? latest.status : "Absent",
              isCheckedIn: isActiveToday, 
            };
          } else {
            map[emp.userId] = { status: "Absent", isCheckedIn: false };
          }
        } catch (err) {
          // Handle 404s and errors silently for the map
          map[emp.userId] = { status: "Absent", isCheckedIn: false };
        }
      }));
      setAttendanceMap(map);
    } catch (error) {
      console.error("Data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  const handleCheckIn = async (userId) => {
    try {
      // 1. Shift Check
      const shiftRes = await getUserShift(userId);
      if (!shiftRes?.data || Object.keys(shiftRes.data).length === 0) {
        toast.error("No shift assigned to this employee!");
        return;
      }

      await checkIn(userId);
      toast.success("Punch-In Successful");
      loadInitialData(); // Refresh to update UI
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async (userId) => {
    try {
      await checkOut(userId);
      toast.success("Punch-Out Successful");
      loadInitialData(); 
    } catch (err) {
      toast.error("Check-out failed. Ensure there is an active session.");
    }
  };

  const handleViewHistory = async (userId) => {
    setHistoryData([]); // Reset modal state
    try {
      const res = await getAttendanceHistory(userId);
      if (res.data && res.data.length > 0) {
        setHistoryData(res.data);
        setShowModal(true);
      } else {
        toast.error("No records found.");
      }
    } catch (err) {
      // Specifically handle the 404 here for the user
      toast.error("This employee has no attendance history yet.");
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      <Toaster position="top-right" />
      
      <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Attendance Portal</h1>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Daily Log Management</p>
        </div>
        {loading && <Loader2 className="animate-spin text-indigo-600" />}
      </div>

      <div className="p-8 overflow-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-8 py-5">Employee</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-center">Actions</th>
                <th className="px-8 py-5 text-center">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const session = attendanceMap[emp.userId] || { status: "Absent", isCheckedIn: false };
                return (
                  <tr key={emp.userId} className="hover:bg-indigo-50/30 transition-all">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-800">{emp.name || emp.username}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {emp.userId}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        session.isCheckedIn ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {session.isCheckedIn ? "• Active Now" : session.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-3">
                        <button
                          disabled={session.isCheckedIn}
                          onClick={() => handleCheckIn(emp.userId)}
                          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                            session.isCheckedIn 
                            ? "bg-slate-100 text-slate-300" 
                            : "bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5"
                          }`}
                        >
                          Check In
                        </button>
                        <button
                          disabled={!session.isCheckedIn}
                          onClick={() => handleCheckOut(emp.userId)}
                          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                            !session.isCheckedIn 
                            ? "bg-slate-100 text-slate-300" 
                            : "bg-rose-500 text-white hover:bg-rose-600 hover:-translate-y-0.5"
                          }`}
                        >
                          Check Out
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => handleViewHistory(emp.userId)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                      >
                        <History size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Attendance Log</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="text-[10px] text-slate-400 font-black uppercase border-b">
                  <tr>
                    <th className="pb-4 text-left">Date</th>
                    <th className="pb-4 text-left">In</th>
                    <th className="pb-4 text-left">Out</th>
                    <th className="pb-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyData.map((row) => (
                    <tr key={row.attendanceId} className="text-xs">
                      <td className="py-4 font-bold">{new Date(row.attendanceDate).toLocaleDateString()}</td>
                      <td className="py-4 text-indigo-600 font-mono">{row.checkInTime || "--:--"}</td>
                      <td className="py-4 text-rose-500 font-mono">{row.checkOutTime || "--:--"}</td>
                      <td className="py-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}