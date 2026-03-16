import React, { useEffect, useState, useMemo, useRef } from "react";
import { 
  Clock, X, Search, Plus, Loader2, Users, Lock, Check, UserPlus 
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
  const [allUsers, setAllUsers] = useState([]);
  const [userLookup, setUserLookup] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(null);

  // Bulk & Search States
  const [selectedPersonnel, setSelectedPersonnel] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  const [shiftForm, setShiftForm] = useState({ shiftName: "", startTime: "", endTime: "", departmentId: "" });
  const [assignForm, setAssignForm] = useState({ userId: "", shiftId: "" });

  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [], isAdmin: false };
    try {
      const decoded = jwtDecode(token);
      const perms = Array.isArray(decoded.perm) ? decoded.perm : [];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      return { perms, isAdmin: role === "ADMIN" || perms.includes("CRM_FULL_ACCESS") };
    } catch (e) { return { perms: [], isAdmin: false }; }
  }, [token]);

  const canView = auth.isAdmin || auth.perms.includes("SHIFT_VIEW");
  const canCreate = auth.isAdmin || auth.perms.includes("SHIFT_CREATE");
  const canAssign = auth.isAdmin || auth.perms.includes("SHIFT_ASSIGN");

  const loadAllData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [sData, aData, dData, uData] = await Promise.all([
        getShifts(), getAssignedUsers(), getDepartments(), getAdminUsers({ page: 1, pageSize: 200 })
      ]);
      setShifts(sData || []);
      setAssignedUsers(aData || []);
      setDepartments(dData || []);
      const usersList = uData?.users || [];
      setAllUsers(usersList);
      const lookup = {};
      usersList.forEach(u => lookup[u.userId] = u.username || u.name);
      setUserLookup(lookup);
    } catch (err) { toast.error("Sync Error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    loadAllData();
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) setShowUserDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [canView]);

  const toggleSelection = (id) => {
    setSelectedPersonnel(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const filteredSearchUsers = useMemo(() => {
    const query = userQuery.toLowerCase();
    if (!query) return allUsers.slice(0, 5);
    return allUsers.filter(u => (u.username || u.name || "").toLowerCase().includes(query) || u.userId?.toString().includes(query)).slice(0, 5);
  }, [userQuery, allUsers]);

  const availableShifts = useMemo(() => {
    if (selectedPersonnel.length > 0) return shifts;
    if (!assignForm.userId) return shifts;
    const currentAssignment = assignedUsers.find(au => Number(au.userId) === Number(assignForm.userId));
    return currentAssignment ? shifts.filter(s => s.shiftId !== currentAssignment.shiftId) : shifts;
  }, [assignForm.userId, shifts, assignedUsers, selectedPersonnel]);

  const handleAction = async (e) => {
    e.preventDefault();
    const ids = selectedPersonnel.length > 0 ? selectedPersonnel : [Number(assignForm.userId)];
    const tid = toast.loading("Processing...");
    try {
      await Promise.all(ids.map(id => assignShiftToUser(id, Number(assignForm.shiftId))));
      toast.success("Allocation Success", { id: tid });
      setShowAssignModal(false);
      setSelectedPersonnel([]);
      setUserQuery("");
      loadAllData();
    } catch { toast.error("Action Failed", { id: tid }); }
  };

  if (!canView) return <div className="h-[60vh] flex items-center justify-center font-black uppercase text-[10px] text-slate-400">Access Restricted</div>;

  const displayedUsers = selectedShiftId ? assignedUsers.filter(u => u.shiftId === selectedShiftId) : assignedUsers;

  return (
    <div className="max-w-7xl mx-auto space-y-3 p-1 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2 uppercase leading-none">
            <Clock size={22} className="text-indigo-500" /> Shift Terminal
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Schedules</p>
        </div>
        <div className="flex items-center gap-2">
          {canAssign && <button onClick={() => setShowAssignModal(true)} className="bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-500/10 transition-all active:scale-95">{selectedPersonnel.length > 0 ? `Assign (${selectedPersonnel.length})` : 'Assign Staff'}</button>}
          {canCreate && <button onClick={() => setShowAddShift(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"><Plus size={14} strokeWidth={3} /> Create Shift</button>}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-7 space-y-1.5">
          <div className="flex items-center gap-2 px-1"><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Templates</h3><span className="text-[9px] font-black bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-500/20">{shifts.length}</span></div>
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Name</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">Hours</th>
                  <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase text-right tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/30">
                {shifts.map((s) => (
                  <tr key={s.shiftId} onClick={() => setSelectedShiftId(s.shiftId)} className={`cursor-pointer transition-all ${selectedShiftId === s.shiftId ? "bg-indigo-500/10" : "hover:bg-indigo-500/[0.02]"}`}>
                    <td className="px-4 py-3 relative">
                      {selectedShiftId === s.shiftId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                      <p className="font-black text-[11px] uppercase leading-none">{s.shiftName}</p>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">Ref: {s.shiftId}</p>
                    </td>
                    <td className="px-4 py-3 text-center"><span className="text-[11px] font-black text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase">{s.startTime} — {s.endTime}</span></td>
                    <td className="px-4 py-3 text-right"><span className="text-[8px] font-black px-2 py-0.5 bg-[var(--bg-body)] text-slate-400 rounded border border-[var(--border-color)] uppercase">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-5 space-y-1.5">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2"><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff</h3><span className="text-[9px] font-black bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-500/20">{displayedUsers.length}</span></div>
             {selectedPersonnel.length > 0 && <button onClick={()=>setSelectedPersonnel([])} className="text-[8px] font-black text-rose-500 uppercase underline decoration-2">Clear Selection</button>}
          </div>
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            {displayedUsers.map((user) => (
              <div key={user.userId} onClick={() => toggleSelection(user.userId)} className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedPersonnel.includes(user.userId) ? 'border-indigo-500 bg-indigo-500/5' : 'bg-[var(--bg-card)] border-[var(--border-color)]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-[10px] uppercase border ${selectedPersonnel.includes(user.userId) ? 'bg-indigo-500 text-white' : 'bg-indigo-500/5 text-indigo-500 border-indigo-500/10'}`}>{(userLookup[user.userId] || "S").charAt(0)}</div>
                  <div>
                    <p className="text-[11px] font-black uppercase leading-none">{userLookup[user.userId] || `Staff Member`}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">UID: #{user.userId}</p>
                  </div>
                </div>
                {selectedPersonnel.includes(user.userId) && <Check size={14} className="text-indigo-500" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddShift && (
          <Modal title="Create Template" onClose={() => setShowAddShift(false)}>
            <form onSubmit={async (e) => { e.preventDefault(); await createShift({...shiftForm, departmentId: Number(shiftForm.departmentId)}); setShowAddShift(false); loadAllData(); }} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><InputField label="Template Name" value={shiftForm.shiftName} onChange={e => setShiftForm({...shiftForm, shiftName: e.target.value})} required /></div>
              <InputField label="Start" type="time" value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})} required />
              <InputField label="End" type="time" value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})} required />
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Department</label>
                <select className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none" value={shiftForm.departmentId} onChange={e => setShiftForm({...shiftForm, departmentId: e.target.value})} required>
                  <option value="">Select...</option>
                  {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                </select>
              </div>
              <button type="submit" className="col-span-2 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Save Template</button>
            </form>
          </Modal>
        )}

        {showAssignModal && (
          <Modal title="Assign Staff" onClose={() => setShowAssignModal(false)}>
            <form onSubmit={handleAction} className="space-y-4">
              {selectedPersonnel.length > 0 ? (
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-center"><p className="text-[9px] font-black text-indigo-600 uppercase">Updating {selectedPersonnel.length} Personnel</p></div>
              ) : (
                <div className="relative" ref={userDropdownRef}>
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Personnel</label>
                  <div className="relative mt-1">
                    <input type="text" value={userQuery} placeholder="Search Name..." className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none" onFocus={() => setShowUserDropdown(true)} onChange={(e) => setUserQuery(e.target.value)} />
                    <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {showUserDropdown && filteredSearchUsers.length > 0 && (
                    <div className="absolute z-[120] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-32 overflow-y-auto">
                      {filteredSearchUsers.map(u => (
                        <button key={u.userId} type="button" className="w-full px-3 py-2 text-left hover:bg-indigo-500/10 flex flex-col border-b border-[var(--border-color)]/30 last:border-0" onClick={() => { setAssignForm({...assignForm, userId: u.userId}); setUserQuery(u.username || u.name); setShowUserDropdown(false); }}>
                          <span className="text-[10px] font-black uppercase">{u.username || u.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Select Shift</label>
                <select className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none" value={assignForm.shiftId} onChange={e => setAssignForm({...assignForm, shiftId: e.target.value})} required>
                  <option value="">Target...</option>
                  {availableShifts.map(s => <option key={s.shiftId} value={s.shiftId}>{s.shiftName}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Confirm Allocation</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
      <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-widest">{title}</h3>
        <button onClick={onClose}><X size={18} className="text-slate-500 hover:text-rose-500"/></button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none transition-all" />
  </div>
);