import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  Loader2,
  Activity,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

// API IMPORTS
import { getAdminUsers } from "../../api/admin/users.api";
import { checkIn, checkOut, getAllLeaves, getAttendanceHistory, getLocationTrail, getTotalHours, getUserLiveLocation, updateLiveLocation } from "../api/api.attendance";

// --- localStorage helpers for persisting HR_USER check-in state across page refreshes ---
// Needed because GET /history/{userId} may return 403 while backend RBAC is being rolled out.
const _attKey = (uid) => `att_checkin_${uid}`;
const getStoredAttendanceState = (userId) => {
  try { const r = localStorage.getItem(_attKey(userId)); return r ? JSON.parse(r) : null; }
  catch { return null; }
};
const saveStoredAttendanceState = (userId, state) => {
  try { localStorage.setItem(_attKey(userId), JSON.stringify(state)); } catch { void 0; }
};
const clearStoredAttendanceState = (userId) => {
  try { localStorage.removeItem(_attKey(userId)); } catch { void 0; }
};

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
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
  const [locationTrail, setLocationTrail] = useState([]);
  const [locationTrailLoading, setLocationTrailLoading] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [liveLocationLoading, setLiveLocationLoading] = useState(false);
  const [onLeaveUserIds, setOnLeaveUserIds] = useState([]);

  const locationWatchIdRef = useRef(null);
  const lastLocationUpdateRef = useRef(0);
  const locationErrorShownRef = useRef(false);
  const pendingCoordsRef = useRef(null);
  const currentTimeRef = useRef(new Date());

  const parseApiDate = useCallback((value) => {
    if (!value) return null;
    const s = String(value);
    if (s.startsWith("0001-01-01") || s.startsWith("0000-00-00")) return null;
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  }, []);

  const openInMaps = useCallback((lat, lng) => {
    if (typeof lat !== "number" || typeof lng !== "number") return;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // Global Timer for Live Ticking
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      currentTimeRef.current = now;
    }, 1000);
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
    } catch { return { userId: null, isManager: false }; }
  }, []);

  const MotionDiv = motion.div;

  const getWorkStats = useCallback((logs, targetDate, isLive = false) => {
    const dayLogs = logs.filter(l => l.attendanceDate?.split('T')[0] === targetDate);
    let totalMs = 0;
    let activeSessionStart = null;

    dayLogs.forEach(log => {
      const inDt = parseApiDate(log?.checkInTime);
      const outDt = parseApiDate(log?.checkOutTime);

      if (inDt && outDt && outDt > inDt) {
        totalMs += (outDt - inDt);
      } else if (inDt && !outDt) {
        activeSessionStart = inDt;
      }
    });

    if (isLive && activeSessionStart) {
      totalMs += (currentTimeRef.current - activeSessionStart);
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
  }, [parseApiDate]);

  const loadData = useCallback(async () => {
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

      if (auth.isManager) {
        try {
          const leaveRes = await getAllLeaves();
          const leaveData = leaveRes?.data || [];
          const today = localToday;
          const ids = new Set();

          const normalizeDateOnly = (value) => {
            if (!value) return null;
            if (typeof value === "string" && value.includes("T")) return value.split("T")[0];
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return null;
            return d.toLocaleDateString("sv");
          };

          (Array.isArray(leaveData) ? leaveData : []).forEach((l) => {
            const status = String(l?.status || "").toLowerCase().trim();
            if (status !== "approved") return;
            const start = normalizeDateOnly(l?.startDate);
            const end = normalizeDateOnly(l?.endDate);
            if (!start || !end) return;
            if (start <= today && today <= end) {
              const uid = Number(l?.userId ?? l?.employeeId);
              if (uid) ids.add(uid);
            }
          });
          setOnLeaveUserIds(Array.from(ids));
        } catch { setOnLeaveUserIds([]); }
      } else { setOnLeaveUserIds([]); }

      await Promise.all(usersToProcess.map(async (emp) => {
        let state = { isCheckedIn: false, count: 0, lastAction: "---", totalToday: "0h : 0m", rawTime: null, history: [], goalMet: false };
        try {
          const [hRes, hoursRes] = await Promise.all([
            getAttendanceHistory(emp.userId),
            getTotalHours(emp.userId),
          ]);
          const history = hRes?.data || [];
          state.history = history;

          // Use getTotalHours API for accurate hours display
          const hoursHistory = hoursRes?.data?.totalHoursHistory || [];
          const todayHoursEntry = hoursHistory.find(h => (h.date ?? h.Date)?.split('T')[0] === localToday);
          if (todayHoursEntry) {
            const totalH = todayHoursEntry.totalHours ?? todayHoursEntry.TotalHours ?? 0;
            const h = Math.floor(totalH);
            const m = Math.floor((totalH - h) * 60);
            state.totalToday = `${h}h : ${m}m`;
            state.goalMet = totalH >= 8;
          }

          if (Array.isArray(history) && history.length > 0) {
            // Fallback hours from local calculation if API returned nothing for today
            if (!todayHoursEntry) {
              const stats = getWorkStats(history, localToday, false);
              state.totalToday = stats.formatted;
              state.goalMet = stats.isGoalMet;
            }
            const todayLogs = history.filter(l => {
              const dateStr = l.attendanceDate?.split('T')[0] ?? parseApiDate(l.checkInTime)?.toLocaleDateString('sv');
              return dateStr === localToday;
            });
            state.count = todayLogs.length;
            if (todayLogs.length > 0) {
              const latest = todayLogs.slice().sort((a, b) => {
                const aIn = parseApiDate(a?.checkInTime)?.getTime() ?? 0;
                const bIn = parseApiDate(b?.checkInTime)?.getTime() ?? 0;
                return bIn - aIn;
              })[0];
              const inDt = parseApiDate(latest?.checkInTime);
              const outDt = parseApiDate(latest?.checkOutTime);
              state.isCheckedIn = !!inDt && !outDt;
              state.rawTime = inDt ? inDt.toISOString() : null;
              state.lastAction = outDt ? `OUT ${String(latest?.checkOutTime).slice(11, 16)}` : inDt ? `IN ${String(latest?.checkInTime).slice(11, 16)}` : "---";
            }
          }
          // If history is empty (e.g. 403 still active on backend), fall back to
          // the last state we persisted in localStorage for this user.
          if (history.length === 0 && !auth.isManager) {
            const stored = getStoredAttendanceState(emp.userId);
            if (stored) {
              state.isCheckedIn = stored.isCheckedIn ?? false;
              state.rawTime     = stored.rawTime     ?? null;
              state.lastAction  = stored.lastAction  ?? "---";
            }
          }
        } catch { void 0; }
        newMap[emp.userId] = state;
      }));
      setAttendanceMap(newMap);
      setEmployees(usersToProcess);
    } catch { toast.error("Sync Failed"); }
  }, [auth, getWorkStats, parseApiDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const getBrowserLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) { reject(new Error("GEOLOCATION_UNSUPPORTED")); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  const requestPunchConfirm = useCallback(async (userId) => {
    const isCurrentlyIn = attendanceMap[userId]?.isCheckedIn;
    const isSelfAction = Number(userId) === Number(auth.userId);
    pendingCoordsRef.current = null;
    // Only require GPS for self check-in; managers punching on behalf of others skip GPS
    if (!isCurrentlyIn && isSelfAction) {
      try { pendingCoordsRef.current = await getBrowserLocation(); }
      catch { toast.error("Please enable location access to punch in."); return; }
    }
    setPendingAction(userId);
    setShowConfirm(true);
  }, [attendanceMap, auth.userId, getBrowserLocation]);

  const startLiveLocationWatch = useCallback((userId) => {
    if (!userId || !("geolocation" in navigator) || locationWatchIdRef.current !== null) return;
    locationErrorShownRef.current = false;
    lastLocationUpdateRef.current = 0;
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastLocationUpdateRef.current < 60_000) return;
        lastLocationUpdateRef.current = now;
        try { await updateLiveLocation(userId, pos.coords.latitude, pos.coords.longitude); } catch { void 0; }
      },
      () => { if (!locationErrorShownRef.current) { locationErrorShownRef.current = true; toast.error("Location access required."); } },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10_000 }
    );
    locationWatchIdRef.current = watchId;
  }, []);

  const stopLiveLocationWatch = useCallback(() => {
    if (locationWatchIdRef.current === null) return;
    try { navigator.geolocation.clearWatch(locationWatchIdRef.current); } catch { void 0; }
    locationWatchIdRef.current = null;
  }, []);

  const isSelfCheckedIn = useMemo(() => {
    if (!auth.userId) return false;
    return !!attendanceMap?.[auth.userId]?.isCheckedIn;
  }, [attendanceMap, auth.userId]);

  useEffect(() => {
    if (!auth.userId) return;
    if (isSelfCheckedIn) startLiveLocationWatch(auth.userId);
    else stopLiveLocationWatch();
    return () => stopLiveLocationWatch();
  }, [auth.userId, isSelfCheckedIn, startLiveLocationWatch, stopLiveLocationWatch]);

  const confirmPunch = async () => {
    const userId = pendingAction;
    const isCurrentlyIn = attendanceMap[userId]?.isCheckedIn;
    const isSelfAction = Number(userId) === Number(auth.userId);
    setShowConfirm(false);
    const tid = toast.loading("Processing...");
    try {
      const nowStr = new Date().toISOString().slice(11, 16);
      if (isCurrentlyIn) {
        await checkOut(userId);
        // Only stop the live watch when the current user punches themselves out
        if (isSelfAction) stopLiveLocationWatch();
        setAttendanceMap(prev => ({
          ...prev,
          [userId]: { ...(prev[userId] || {}), isCheckedIn: false, lastAction: `OUT ${nowStr}` },
        }));
        // Persist punch-out so page refresh reflects correct state even when history is 403
        if (isSelfAction) clearStoredAttendanceState(userId);
      } else {
        let lat = 0, lng = 0;
        if (isSelfAction) {
          // Self check-in: use GPS captured in requestPunchConfirm (or re-fetch)
          const coords = pendingCoordsRef.current || await getBrowserLocation();
          const c = coords || {};
          if (typeof c.lat !== "number" || typeof c.lng !== "number") {
            toast.error("Location required to punch in.", { id: tid });
            return;
          }
          lat = c.lat;
          lng = c.lng;
        }
        await checkIn(userId, lat, lng);
        // Only start the live watch for the current user's own check-in
        if (isSelfAction) startLiveLocationWatch(userId);
        const checkinTime = new Date().toISOString();
        setAttendanceMap(prev => ({
          ...prev,
          [userId]: { ...(prev[userId] || {}), isCheckedIn: true, lastAction: `IN ${nowStr}`, rawTime: checkinTime },
        }));
        // Persist punch-in so page refresh reflects correct state even when history is 403
        if (isSelfAction) saveStoredAttendanceState(userId, { isCheckedIn: true, rawTime: checkinTime, lastAction: `IN ${nowStr}` });
      }
      pendingCoordsRef.current = null;
      toast.success("Success", { id: tid });
      // Targeted refresh: update history/hours without overwriting the optimistic isCheckedIn state
      setTimeout(async () => {
        try {
          const [hRes, hoursRes] = await Promise.all([
            getAttendanceHistory(userId),
            getTotalHours(userId),
          ]);
          const history = hRes?.data || [];
          const hoursHistory = hoursRes?.data?.totalHoursHistory || [];
          const localToday = new Date().toLocaleDateString('sv');
          const todayEntry = hoursHistory.find(h => (h.date ?? h.Date)?.split('T')[0] === localToday);
          const updates = { history };
          if (todayEntry) {
            const totalH = todayEntry.totalHours ?? todayEntry.TotalHours ?? 0;
            updates.totalToday = `${Math.floor(totalH)}h : ${Math.floor((totalH - Math.floor(totalH)) * 60)}m`;
            updates.goalMet = totalH >= 8;
          }
          setAttendanceMap(prev => ({
            ...prev,
            [userId]: { ...(prev[userId] || {}), ...updates },
          }));
        } catch { void 0; }
      }, 1500);
    } catch (err) {
      const status = err?.response?.status;
      // 400 on check-in most likely means the backend already has the user marked as
      // checked-in (UI was stale due to 403 on history). Sync UI to reflect that.
      if (!isCurrentlyIn && status === 400) {
        const nowStr2 = new Date().toISOString().slice(11, 16);
        toast.error("Already checked in — syncing status.", { id: tid });
        setAttendanceMap(prev => ({
          ...prev,
          [pendingAction]: { ...(prev[pendingAction] || {}), isCheckedIn: true, lastAction: `IN ${nowStr2}` },
        }));
        if (Number(pendingAction) === Number(auth.userId)) {
          saveStoredAttendanceState(pendingAction, { isCheckedIn: true, rawTime: new Date().toISOString(), lastAction: `IN ${nowStr2}` });
          startLiveLocationWatch(pendingAction);
        }
      } else {
        toast.error("Action Failed", { id: tid });
      }
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = (e.username || e.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const status = attendanceMap[e.userId]?.isCheckedIn;
      const isOnLeave = onLeaveUserIds.includes(Number(e.userId));
      if (filterType === 'active') return matchesSearch && status === true;
      if (filterType === 'inactive') return matchesSearch && status === false && !isOnLeave;
      if (filterType === 'leave') return matchesSearch && isOnLeave;
      return matchesSearch;
    });
  }, [employees, searchTerm, filterType, attendanceMap, onLeaveUserIds]);

  const liveActivity = useMemo(() => {
    return employees
      .filter(e => attendanceMap[e.userId]?.rawTime)
      .sort((a, b) => new Date(attendanceMap[b.userId].rawTime) - new Date(attendanceMap[a.userId].rawTime))
      .slice(0, 5);
  }, [employees, attendanceMap]);

  // currentTime is included so live ticking re-computes every second inside the modal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedDayStats = useMemo(() => {
    if (!selectedUser) return { formatted: "0h : 0m", totalMinutes: 0, isGoalMet: false };
    const isToday = selectedDate === new Date().toLocaleDateString('sv');
    return getWorkStats(attendanceMap[selectedUser.userId]?.history || [], selectedDate, isToday);
  }, [selectedUser, selectedDate, attendanceMap, getWorkStats, currentTime]);

  const timelineItems = useMemo(() => {
    const items = [];
    const dayLogs = (historyData || []).filter(h => h.attendanceDate?.split("T")[0] === selectedDate);
    dayLogs.forEach((log) => {
      if (log?.checkInTime) {
        const dt = parseApiDate(log.checkInTime);
        if (dt) {
          const lat = log?.checkInLatitude ?? log?.latitude ?? log?.lat;
          const lng = log?.checkInLongitude ?? log?.longitude ?? log?.lng ?? log?.lon;
          const coords = (typeof lat === "number" && typeof lng === "number") ? { lat, lng } : null;
          items.push({ type: "in", at: dt, label: coords ? `IN ${String(log.checkInTime).slice(11, 16)} ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : `IN ${String(log.checkInTime).slice(11, 16)}`, coords });
        }
      }
      if (log?.checkOutTime) {
        const dt = parseApiDate(log.checkOutTime);
        if (dt) items.push({ type: "out", at: dt, label: `OUT ${String(log.checkOutTime).slice(11, 16)}` });
      }
    });
    const liveLat = liveLocation?.latitude ?? liveLocation?.lat;
    const liveLng = liveLocation?.longitude ?? liveLocation?.lng ?? liveLocation?.lon;
    if (typeof liveLat === "number" && typeof liveLng === "number") {
      const t = liveLocation?.dateTime ?? liveLocation?.timestamp ?? liveLocation?.time ?? liveLocation?.updatedAt;
      items.push({ type: "live", at: parseApiDate(t) ?? new Date(), label: `LIVE ${liveLat.toFixed(5)}, ${liveLng.toFixed(5)}`, coords: { lat: liveLat, lng: liveLng } });
    }
    (Array.isArray(locationTrail) ? locationTrail : []).forEach((p) => {
      const lat = p?.latitude ?? p?.lat;
      const lng = p?.longitude ?? p?.lng;
      const dt = parseApiDate(p?.dateTime ?? p?.timestamp);
      if (typeof lat === "number" && typeof lng === "number" && dt) {
        items.push({ type: "loc", at: dt, label: `LOC ${lat.toFixed(5)}, ${lng.toFixed(5)}`, coords: { lat, lng } });
      }
    });
    return items.sort((a, b) => a.at - b.at);
  }, [historyData, selectedDate, locationTrail, liveLocation, parseApiDate]);

  useEffect(() => {
    if (!showModal || !selectedUser?.userId || !selectedDate) return;
    let cancelled = false;
    setLocationTrailLoading(true);
    getLocationTrail(selectedUser.userId, `${selectedDate}T00:00:00.000Z`)
      .then((res) => { if (!cancelled) setLocationTrail(res?.data || []); })
      .catch(() => { if (!cancelled) setLocationTrail([]); })
      .finally(() => { if (!cancelled) setLocationTrailLoading(false); });
    return () => { cancelled = true; };
  }, [showModal, selectedUser?.userId, selectedDate]);

  useEffect(() => {
    if (!showModal || !selectedUser?.userId) { setLiveLocation(null); setLiveLocationLoading(false); return; }
    let cancelled = false;
    setLiveLocationLoading(true);
    getUserLiveLocation(selectedUser.userId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        setLiveLocation(Array.isArray(data) ? (data[data.length - 1] ?? null) : (data ?? null));
      })
      .catch(() => { if (!cancelled) setLiveLocation(null); })
      .finally(() => { if (!cancelled) setLiveLocationLoading(false); });
    return () => { cancelled = true; };
  }, [showModal, selectedUser?.userId]);

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
            <div className="grid grid-cols-4 gap-1.5">
              <button onClick={() => setFilterType('all')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'all' ? 'border-indigo-500 bg-indigo-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
                <p className="text-[7px] font-black text-slate-400 uppercase">Total Employees</p>
                <p className="text-sm font-black text-[var(--text-main)]">{employees.length}</p>
              </button>
              <button onClick={() => setFilterType('active')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'active' ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
                <p className="text-[7px] font-black text-slate-400 uppercase">Present Employees</p>
                <p className="text-sm font-black text-emerald-500">{Object.values(attendanceMap).filter(v => v.isCheckedIn).length}</p>
              </button>
              <button onClick={() => setFilterType('inactive')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'inactive' ? 'border-rose-500 bg-rose-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
                <p className="text-[7px] font-black text-slate-400 uppercase">Absent Employees</p>
                <p className="text-sm font-black text-rose-500">{Math.max(employees.length - Object.values(attendanceMap).filter(v => v.isCheckedIn).length - onLeaveUserIds.length, 0)}</p>
              </button>
              <button onClick={() => setFilterType('leave')} className={`p-2 rounded-xl border transition-all text-center ${filterType === 'leave' ? 'border-amber-500 bg-amber-500/5' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}>
                <p className="text-[7px] font-black text-slate-400 uppercase">On Leave</p>
                <p className="text-sm font-black text-amber-600">{onLeaveUserIds.length}</p>
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
                            <button onClick={() => requestPunchConfirm(emp.userId)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all shadow-md active:scale-95 ${st.isCheckedIn ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
                              {st.isCheckedIn ? 'Punch Out' : 'Punch In'}
                            </button>
                          )}
                          <button onClick={() => { setSelectedUser(emp); setShowModal(true); setHistoryData(st.history || []); }} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-slate-400 hover:text-indigo-500 transition-all">
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
            <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 w-80 text-center" onClick={e => e.stopPropagation()}>
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} /></div>
              <h3 className="text-sm font-black uppercase text-slate-800 mb-2">Punch Confirmation</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-6 leading-relaxed">Proceed with current check-in/out action?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-xl">Cancel</button>
                <button onClick={confirmPunch} className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md">Confirm</button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] backdrop-blur-sm bg-slate-900/60 p-4" onClick={() => setShowModal(false)}>
            <MotionDiv initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[var(--border-color)] flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
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
                      const stats = getWorkStats(historyData, dStr, false);
                      const hasCheckin = historyData.some(h => h.attendanceDate?.split('T')[0] === dStr);
                      const isPast = date < new Date().setHours(0,0,0,0);
                      const isToday = dStr === new Date().toLocaleDateString('sv');
                      let bgColor = "bg-[var(--bg-body)] text-slate-400";
                      let icon = null;
                      if (hasCheckin) {
                        if (!stats.isGoalMet && !isToday) { bgColor = "bg-amber-100 text-amber-700 border border-amber-200"; icon = <AlertTriangle size={8} className="absolute top-0.5 right-0.5" />; } 
                        else if (stats.isGoalMet) { bgColor = "bg-emerald-500 text-white"; } 
                        else { bgColor = "bg-indigo-600 text-white"; }
                      } else if (isPast) { bgColor = "bg-rose-50 text-rose-400 border border-rose-100"; }
                      return (
                        <button key={dStr} onClick={() => setSelectedDate(dStr)} className={`h-9 w-full rounded-lg text-[9px] font-bold transition-all relative ${bgColor} ${selectedDate === dStr ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}>{i + 1}{icon}</button>
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
                    <span className={`text-[10px] font-black tabular-nums ${selectedDayStats.isGoalMet ? 'text-emerald-500' : 'text-indigo-500'}`}>{selectedDayStats.formatted}</span>
                  </div>
                  <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${selectedDayStats.isGoalMet ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((selectedDayStats.totalMinutes / 480) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[6px] font-black text-slate-400 mt-1 uppercase text-right tracking-widest">Target: 8h Net</p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-40 custom-scrollbar pr-1">
                  {(locationTrailLoading || liveLocationLoading) && (
                    <div className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] flex items-center justify-between"><Loader2 size={10} className="text-slate-400 animate-spin" /><p className="text-[9px] font-bold text-[var(--text-main)] uppercase">Syncing...</p></div>
                  )}
                  {!locationTrailLoading && timelineItems.length === 0 && (
                    <div className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] flex items-center justify-between"><Clock size={10} className="text-slate-400" /><p className="text-[9px] font-bold text-[var(--text-main)] uppercase">No activity</p></div>
                  )}
                  {!locationTrailLoading && timelineItems.map((item, i) => {
                    const clickable = !!item?.coords;
                    const Wrapper = clickable ? "button" : "div";
                    return (
                      <Wrapper key={`${item.type}-${i}`} onClick={clickable ? () => openInMaps(item.coords.lat, item.coords.lng) : undefined} className={`p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] flex items-center justify-between w-full text-left ${clickable ? "hover:border-indigo-400/40 hover:bg-indigo-500/[0.02] cursor-pointer" : ""}`}>
                        <Clock size={10} className="text-slate-400" /><p className="text-[9px] font-bold text-[var(--text-main)] uppercase">{item.label}</p>
                      </Wrapper>
                    );
                  })}
                </div>
                <button onClick={() => setShowModal(false)} className="mt-4 w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md active:scale-95 transition-all">Close Viewer</button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}