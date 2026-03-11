import React, { useEffect, useState, useMemo } from "react";
import { 
  ShieldCheck, Search, Clock, Building2, 
  Activity, Hash, Loader2, Lock
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

// API IMPORTS
import { getOvertimePolicies } from "../../api/overtimePolicy.api";
import { getDepartments } from "../../api/hr.dept";

export default function OvertimePolicy() {
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null); // Selection State (selemp)

  // --- 🔐 MASTER AUTH LOGIC ---
  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [], isAdmin: false, isHRManager: false };
    try {
      const decoded = jwtDecode(token);
      const perms = Array.isArray(decoded.perm) ? decoded.perm : [];
      const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const role = decoded[ROLE_CLAIM] || decoded.role || "";
      
      return { 
        perms, 
        isAdmin: role === "ADMIN" || perms.includes("CRM_FULL_ACCESS"),
        isHRManager: role === "HR_MANAGER" 
      };
    } catch (e) { return { perms: [], isAdmin: false, isHRManager: false }; }
  }, [token]);

  // --- 🛠️ PERMISSION FLAGS ---
  const canView = auth.isAdmin || auth.isHRManager || auth.perms.includes("OT_POLICY_VIEW");

  const loadData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        getOvertimePolicies(),
        getDepartments()
      ]);
      setPolicies(Array.isArray(pRes) ? pRes : pRes?.data || []);
      setDepartments(dRes || []);
    } catch (err) {
      toast.error("Failed to load overtime policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [canView]);

  const getDeptName = (deptId) => {
    const found = departments.find(d => Number(d.departmentId) === Number(deptId));
    return found ? found.departmentName : `Dept #${deptId}`;
  };

  // 🛑 PAGE GUARD
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-none">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">Policy clearance required</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2 uppercase leading-none">
            <ShieldCheck size={22} className="text-indigo-500" /> OT Protocols
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">
            {auth.isAdmin || auth.isHRManager ? "Master Policy Framework" : "Corporate Guidelines"}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg pl-9 pr-4 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* DATA GRID */}
      {loading && policies.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {policies
            .filter(p =>
              getDeptName(p.departmentId).toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((p) => {
              const isSelected = selectedId === p.overtimePolicyId;
              return (
                <motion.div
                  layout
                  key={p.overtimePolicyId}
                  onClick={() => setSelectedId(p.overtimePolicyId)}
                  className={`bg-[var(--bg-card)] border rounded-xl p-3 transition-all relative overflow-hidden shadow-sm hover:shadow-md cursor-pointer ${
                    isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/10' : 'border-[var(--border-color)]'
                  }`}
                >
                  {/* LEFT ACCENT BAR */}
                  <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${isSelected ? 'bg-indigo-600' : 'bg-indigo-500'}`} />

                  <div className="flex justify-between items-start mb-3 pl-1">
                    <div className="flex items-center gap-3">
                      {/* PROFILE BOX STYLE (Matching Attendance) */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                        isSelected 
                        ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' 
                        : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                      }`}>
                        <Building2 size={14} />
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-tight text-[var(--text-main)] leading-tight">
                          {getDeptName(p.departmentId)}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 opacity-70">
                          <Hash size={8} className="text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            UID-{p.overtimePolicyId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DATA BOXES */}
                  <div className="flex gap-2 pl-1">
                    <div className="flex-1 bg-emerald-500/5 rounded-lg border border-emerald-500/20 p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={11} className="text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest leading-none">
                          Base Day
                        </span>
                      </div>
                      <span className="text-xs font-black text-[var(--text-main)]">
                        {p.standardDailyHours}
                        <span className="text-[9px] text-slate-500"> HRS</span>
                      </span>
                    </div>

                    <div className="flex-1 bg-indigo-500/5 rounded-lg border border-indigo-500/20 p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={11} className="text-indigo-500" />
                        <span className="text-[8px] font-black text-indigo-500/70 uppercase tracking-widest leading-none">
                          Weekly Cap
                        </span>
                      </div>
                      <span className="text-xs font-black text-[var(--text-main)]">
                        {p.maxWeeklyOvertimeHours}
                        <span className="text-[9px] text-slate-500"> HRS</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && policies.length === 0 && (
        <div className="col-span-full py-20 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">No policies found</p>
        </div>
      )}
    </div>
  );
}