//THEME CHNAGE 

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, Search, Clock, Building2, 
  Activity, Hash, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ONLY GET API
import { getOvertimePolicies } from "../../api/overtimePolicy.api";

export default function OvertimePolicy() {

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getOvertimePolicies();
      const data = Array.isArray(res) ? res : res?.data || [];
      setPolicies(data);
    } catch (err) {
      toast.error("Failed to load overtime policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getDeptName = (deptId) => {
    return deptId ? `Dept #${deptId}` : "Unknown Department";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">

      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-500" /> OT Protocols
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
            Policy Framework
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
              getDeptName(p.departmentId)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((p) => (
              <motion.div
                layout
                key={p.overtimePolicyId}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 transition-all relative overflow-hidden shadow-sm hover:shadow-md"
              >
                {/* LEFT BAR */}
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />

                <div className="flex justify-between items-start mb-3 pl-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-500/20 text-indigo-500 bg-indigo-500/10">
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
                      <span className="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest">
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
                      <span className="text-[8px] font-black text-indigo-500/70 uppercase tracking-widest">
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
            ))}
            {policies.length === 0 && !loading && (
               <div className="col-span-full py-20 text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">No policies found</p>
               </div>
            )}
        </div>
      )}
    </div>
  );
}