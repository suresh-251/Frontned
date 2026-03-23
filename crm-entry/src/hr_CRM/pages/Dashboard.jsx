import React, { useEffect, useState, useMemo } from "react";
import {
  Users, Clock, ListTodo, MapPin, Wallet, Building2, Briefcase,
  UserCheck, UserX, BookOpen, AlertCircle, CheckCircle2, Timer,
  TrendingUp, Loader2, RefreshCw, BarChart3, FileText, Award,
  BriefcaseBusiness,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

// API Imports
import { getAdminUsers }          from "../../api/admin/users.api";
import { getTodos }               from "../api/todo.api";
import { getKnowledgeList }       from "../api/api.knowledge";
import { getBranches }            from "../api/api.branch";
import { getDepartments }         from "../api/hr.dept";
import { getRecruitments }        from "../api/recruitment.api";
import { getAllOvertimeApprovals } from "../api/overtimeApproval.api";
import { getAllLeaves }            from "../api/LeaveService";
import { getProjects }            from "../api/project.api";
import { onboardingApi }          from "../api/onboarding.api";
import { getOffBoardingList }     from "../api/offboarding.api";
import { getAllPayroll }           from "../api/hr.payroll";
import { getAllJobOpenings }       from "../api/recruitment/jobOpening.api";

// ── helpers ──────────────────────────────────────────────────────────────────
// Unwrap any shape: plain array, axios {data:[...]}, or {data:{data:[...]}}
const toArr = (val) => {
  if (Array.isArray(val))          return val;
  if (Array.isArray(val?.data))    return val.data;
  if (Array.isArray(val?.data?.data)) return val.data.data;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [raw, setRaw]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getAdminUsers({ page: 1, pageSize: 200 }),  // 0  {users:[...], totalCount}
        getBranches(),                               // 1  array
        getDepartments(),                            // 2  array
        getRecruitments(),                           // 3  already unwrapped array
        getAllOvertimeApprovals(),                    // 4  array
        getAllLeaves(),                              // 5  axios → .data = array
        getProjects(),                               // 6  array
        onboardingApi.getOnboardingList(),           // 7  axios → .data = array
        getOffBoardingList(),                        // 8  already unwrapped array
        getTodos(),                                  // 9  array
        getKnowledgeList(),                          // 10 array
        getAllPayroll(),                             // 11 axios → .data = array
        getAllJobOpenings(),                         // 12 already unwrapped
      ]);

      const v = (i) => results[i].status === "fulfilled" ? results[i].value : null;

      const userPayload = v(0);
      const onboardRaw  = v(7);
      const payrollRaw  = v(11);

      // Mirror exactly how Leave.jsx unwraps the axios response
      const leaveRaw   = v(5);
      const leaveData  = leaveRaw?.data ?? leaveRaw ?? [];
      const leavesArr  = Array.isArray(leaveData) ? leaveData : [];

      setRaw({
        totalUsers:   userPayload?.totalCount ?? toArr(userPayload?.users).length,
        users:        toArr(userPayload?.users),
        branches:     toArr(v(1)),
        departments:  toArr(v(2)),
        recruitments: toArr(v(3)),
        overtimes:    toArr(v(4)),
        leaves:       leavesArr,
        projects:     toArr(v(6)),
        onboarding:   toArr(onboardRaw?.data ?? onboardRaw),
        offboarding:  toArr(v(8)),
        todos:        toArr(v(9)),
        knowledge:    toArr(v(10)),
        payroll:      toArr(payrollRaw?.data  ?? payrollRaw),
        jobOpenings:  toArr(v(12)),
      });
      setRefreshed(new Date());
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── derived stats ────────────────────────────────────────────────────────
  const s = useMemo(() => {
    if (!raw) return null;
    const { branches, departments, recruitments, overtimes, leaves,
            projects, onboarding, offboarding, todos, knowledge,
            payroll, totalUsers, jobOpenings } = raw;

    // Recruitment funnel — field is applicationStatus or status
    const recFunnel = recruitments.reduce(
      (a, r) => {
        const st = (r.applicationStatus || r.status || "").toLowerCase();
        if (st.includes("interview") || st.includes("schedule")) a.interview++;
        else if (st.includes("offer"))                           a.offer++;
        else if (st.includes("hired") || st.includes("onboard")) a.hired++;
        else                                                      a.applied++;
        return a;
      },
      { applied: 0, interview: 0, offer: 0, hired: 0 }
    );

    // Leave breakdown — matches Leave.jsx field: leaveStatus
    const leaveStat = leaves.reduce(
      (a, l) => {
        const st = (l.leaveStatus || l.status || l.leaveRequestStatus || "").toLowerCase();
        if (st === "approved")                          a.approved++;
        else if (st === "rejected" || st === "denied") a.rejected++;
        else if (st === "pending")                     a.pending++;
        return a;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );

    // Payroll — status: "Generated" | "Approved" | "Paid"
    const payrollStat = payroll.reduce(
      (a, p) => {
        const st = (p.status || "").toLowerCase();
        if (st === "paid")                           a.paid++;
        else if (st === "approved")                  a.approved++;
        else                                         a.pending++; // Generated / Draft / ""
        return a;
      },
      { pending: 0, approved: 0, paid: 0 }
    );

    // Todos
    const todoDone = todos.filter(t => (t.status || "").toLowerCase() === "completed").length;
    const todoOpen = todos.length - todoDone;

    // OT
    const otPending  = overtimes.filter(o => !o.isApproved).length;
    const otApproved = overtimes.filter(o =>  o.isApproved).length;

    // Branches
    const activeBranches = branches.filter(b => b.isActive !== false).length;

    // Projects
    const activeProjects = projects.filter(
      p => !["completed", "closed", "cancelled"].includes((p.status || "").toLowerCase())
    ).length;

    // Job openings
    const openJobs   = jobOpenings.filter(j => (j.status || "Open").toLowerCase() === "open").length;
    const filledJobs = jobOpenings.filter(j => (j.status || "").toLowerCase() === "filled").length;
    // group by department for donut
    const jobByDept = Object.values(
      jobOpenings.reduce((acc, j) => {
        const k = j.departmentName || "Unknown";
        if (!acc[k]) acc[k] = { name: k, total: 0, open: 0 };
        acc[k].total++;
        if ((j.status || "Open").toLowerCase() === "open") acc[k].open++;
        return acc;
      }, {})
    ).sort((a, b) => b.total - a.total).slice(0, 5);

    return {
      totalUsers,
      activeBranches,
      totalDepts: departments.length,
      activeProjects, totalProjects: projects.length,
      todoOpen, todoDone, totalTodos: todos.length,
      otPending, otApproved,
      leaveStat, recFunnel,
      totalRecruitments: recruitments.length,
      payrollStat,
      totalOnboarding: onboarding.length,
      totalOffboarding: offboarding.length,
      totalKB: knowledge.length,
      totalJobOpenings: jobOpenings.length,
      openJobs, filledJobs,
      jobByDept,
    };
  }, [raw]);

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-48 flex items-center justify-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
      <Loader2 className="animate-spin text-indigo-600" size={26} />
    </div>
  );
  if (!raw || !s) return null;

  // Chart data
  const recruitBarData = [
    { label: "Applied",   count: s.recFunnel.applied,   fill: "#6366f1" },
    { label: "Interview", count: s.recFunnel.interview, fill: "#f59e0b" },
    { label: "Offer",     count: s.recFunnel.offer,     fill: "#3b82f6" },
    { label: "Hired",     count: s.recFunnel.hired,     fill: "#10b981" },
  ];

  const leaveDonut = [
    { name: "Pending",  value: s.leaveStat.pending,  color: "#f59e0b" },
    { name: "Approved", value: s.leaveStat.approved, color: "#10b981" },
    { name: "Rejected", value: s.leaveStat.rejected, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const totalLeaves = s.leaveStat.pending + s.leaveStat.approved + s.leaveStat.rejected;

  const DEPT_COLORS = ["#6366f1","#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6"];

  const jobDonut = s.jobByDept.map((d, i) => ({
    name: d.name, value: d.total, color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const taskPct = s.totalTodos > 0
    ? Math.round((s.todoDone / s.totalTodos) * 100)
    : 0;

  return (
    <div className="w-full text-[var(--text-main)] space-y-3 transition-colors duration-300">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-[var(--text-main)] leading-tight">HR Dashboard</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Refreshed at {refreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:border-indigo-400/60 text-[var(--text-main)] transition-all"
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* ── Row 1 · 7 stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
        <StatCard icon={<Users size={14}/>}             label="Total Staff"   value={s.totalUsers}                                 sub={`${raw.departments.length} dept${raw.departments.length !== 1 ? "s" : ""}`}  accent="indigo"  />
        <StatCard icon={<MapPin size={14}/>}            label="Branches"      value={`${s.activeBranches} active`}                 sub={`${raw.branches.length} total`}                                              accent="emerald" />
        <StatCard icon={<Building2 size={14}/>}         label="Departments"   value={s.totalDepts}                                 sub={`${s.activeBranches} branch${s.activeBranches !== 1 ? "es" : ""}`}          accent="blue"    />
        <StatCard icon={<Briefcase size={14}/>}         label="Projects"      value={`${s.activeProjects} active`}                 sub={`${s.totalProjects} total`}                                                  accent="violet"  />
        <StatCard icon={<BriefcaseBusiness size={14}/>} label="Job Openings"  value={`${s.openJobs} open`}                         sub={`${s.filledJobs} filled · ${s.totalJobOpenings} total`}                      accent="sky"     />
        <StatCard icon={<ListTodo size={14}/>}          label="Open Tasks"    value={s.todoOpen}                                   sub={`${s.todoDone} done · ${s.totalTodos} total`}                                accent="amber"   />
        <StatCard icon={<Timer size={14}/>}             label="Pending OT"    value={s.otPending}                                  sub={`${s.otApproved} approved`}                                                  accent="rose"    />
      </div>

      {/* ── Row 2 · main 3-col ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Recruitment pipeline */}
        <Card title="Recruitment Pipeline" badge={`${s.totalRecruitments} total`}>
          {s.totalRecruitments === 0 ? (
            <Empty text="No recruitment data" />
          ) : (
            <>
              <div className="h-28 mt-2 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recruitBarData} barSize={20} margin={{ top: 2, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 600, fill: "var(--text-main)", opacity: 0.5 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false}
                      tick={{ fontSize: 9, fill: "var(--text-main)", opacity: 0.4 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 10, color: "var(--text-main)" }}
                      cursor={{ fill: "var(--border-color)", opacity: 0.3 }}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {recruitBarData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-1.5">
                <MiniStat icon={<UserCheck size={11}/>} label="Onboarding"  value={s.totalOnboarding}  color="text-emerald-500" />
                <MiniStat icon={<UserX    size={11}/>} label="Offboarding" value={s.totalOffboarding} color="text-rose-500"    />
              </div>
            </>
          )}
        </Card>

        {/* Leave overview + Payroll strip */}
        <Card title="Leave Overview" badge={`${totalLeaves} requests`}>
          {totalLeaves === 0 ? (
            <Empty text="No leave data" />
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <div className="w-[90px] h-[90px] flex-shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leaveDonut} innerRadius={24} outerRadius={40} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                      {leaveDonut.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", fontSize: 10, color: "var(--text-main)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-bold text-[var(--text-main)] leading-none">{totalLeaves}</span>
                  <span className="text-[8px] text-slate-400">total</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <LeaveRow label="Pending"  count={s.leaveStat.pending}  dot="bg-amber-400"   />
                <LeaveRow label="Approved" count={s.leaveStat.approved} dot="bg-emerald-400" />
                <LeaveRow label="Rejected" count={s.leaveStat.rejected} dot="bg-red-400"     />
              </div>
            </div>
          )}
          {/* Payroll strip */}
          <div className="mt-2 pt-2 border-t border-[var(--border-color)] grid grid-cols-3 gap-1.5">
            <MiniStat icon={<FileText     size={11}/>} label="Generated" value={s.payrollStat.pending}  color="text-amber-500"   />
            <MiniStat icon={<CheckCircle2 size={11}/>} label="Approved"  value={s.payrollStat.approved} color="text-blue-500"    />
            <MiniStat icon={<Wallet       size={11}/>} label="Paid"      value={s.payrollStat.paid}     color="text-emerald-500" />
          </div>
        </Card>

        {/* Action center */}
        <Card title="Action Center" badge="Live">
          <div className="mt-2 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Task Progress</span>
              <span className="text-[9px] text-slate-400">{s.todoDone}/{s.totalTodos} done · {taskPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--bg-body)] rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${taskPct}%` }} />
            </div>
          </div>

          <div className="space-y-1 max-h-[104px] overflow-y-auto pr-0.5 custom-scrollbar">
            {raw.todos.length === 0
              ? <p className="text-[10px] text-slate-400 italic">No tasks found</p>
              : raw.todos.slice(0, 6).map(t => (
                  <div key={t.taskId || t.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-body)] border border-[var(--border-color)]">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      (t.status || "").toLowerCase() === "completed"   ? "bg-emerald-500" :
                      (t.status || "").toLowerCase() === "in progress" ? "bg-amber-500"   : "bg-slate-300"}`} />
                    <p className="text-[10px] font-medium text-[var(--text-main)] truncate flex-1">{t.title}</p>
                    <StatusBadge status={t.status || "Pending"} />
                  </div>
                ))
            }
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-1.5">
            <MiniStat icon={<BookOpen    size={11}/>} label="KB Articles" value={s.totalKB}    color="text-violet-500" />
            <MiniStat icon={<AlertCircle size={11}/>} label="OT Approved" value={s.otApproved} color="text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* ── Row 3 · secondary info ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Projects */}
        <Card title="Active Projects" badge={`${s.activeProjects} active`}>
          <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto pr-0.5 custom-scrollbar">
            {raw.projects.length === 0
              ? <Empty text="No projects" />
              : raw.projects.slice(0, 6).map(p => (
                  <div key={p.projectId || p.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[var(--bg-body)] border border-[var(--border-color)]">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-[var(--text-main)] truncate">{p.projectName || p.name || "—"}</p>
                      {p.departmentName && <p className="text-[9px] text-slate-400 truncate">{p.departmentName}</p>}
                    </div>
                    <StatusBadge status={p.status || "Active"} />
                  </div>
                ))
            }
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-1.5">
            <MiniStat icon={<Briefcase size={11}/>} label="Total"  value={s.totalProjects}  color="text-violet-500" />
            <MiniStat icon={<Award     size={11}/>} label="Active" value={s.activeProjects} color="text-indigo-500" />
          </div>
        </Card>

        {/* Departments */}
        <Card title="Departments" badge={`${s.totalDepts} total`}>
          <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto pr-0.5 custom-scrollbar">
            {raw.departments.length === 0
              ? <Empty text="No departments" />
              : raw.departments.slice(0, 6).map(d => (
                  <div key={d.departmentId || d.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[var(--bg-body)] border border-[var(--border-color)]">
                    <p className="text-[10px] font-medium text-[var(--text-main)] truncate flex-1">{d.departmentName || d.name}</p>
                    {d.branchName && <span className="text-[9px] text-slate-400 ml-2 flex-shrink-0">{d.branchName}</span>}
                  </div>
                ))
            }
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-1.5">
            <MiniStat icon={<MapPin    size={11}/>} label="Branches" value={raw.branches.length} color="text-emerald-500" />
            <MiniStat icon={<Building2 size={11}/>} label="Depts"    value={s.totalDepts}         color="text-blue-500"   />
          </div>
        </Card>

        {/* Job Openings */}
        <Card title="Job Openings" badge={`${s.totalJobOpenings} total`}>
          {s.totalJobOpenings === 0 ? (
            <Empty text="No job openings" />
          ) : (
            <>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-[80px] h-[80px] flex-shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={jobDonut} innerRadius={20} outerRadius={36} dataKey="value" paddingAngle={2} startAngle={90} endAngle={-270}>
                        {jobDonut.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", fontSize: 10, color: "var(--text-main)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-bold text-[var(--text-main)] leading-none">{s.openJobs}</span>
                    <span className="text-[7px] text-slate-400">open</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  {s.jobByDept.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                        <p className="text-[9px] text-[var(--text-main)] truncate">{d.name}</p>
                      </div>
                      <span className="text-[9px] font-bold text-[var(--text-main)] flex-shrink-0">{d.total}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-1.5">
                <MiniStat icon={<BriefcaseBusiness size={11}/>} label="Open"   value={s.openJobs}   color="text-indigo-500" />
                <MiniStat icon={<CheckCircle2      size={11}/>} label="Filled" value={s.filledJobs} color="text-emerald-500" />
              </div>
            </>
          )}
        </Card>

        {/* Recent Recruitment */}
        <Card title="Recent Applications" badge="Recruitment">
          <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto pr-0.5 custom-scrollbar">
            {raw.recruitments.length === 0
              ? <Empty text="No applications" />
              : raw.recruitments.slice(0, 6).map(r => (
                  <div key={r.id || r.recruitmentId} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[var(--bg-body)] border border-[var(--border-color)]">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-[var(--text-main)] truncate">
                        {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">{r.appliedPosition || r.position || ""}</p>
                    </div>
                    <StatusBadge status={r.applicationStatus || r.status || "Applied"} />
                  </div>
                ))
            }
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-1.5">
            <MiniStat icon={<UserCheck size={11}/>} label="Onboarded"  value={s.totalOnboarding}  color="text-emerald-500" />
            <MiniStat icon={<UserX    size={11}/>} label="Offboarded" value={s.totalOffboarding} color="text-rose-500"    />
          </div>
        </Card>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const ACCENT = {
  indigo:  "bg-indigo-500/10  text-indigo-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  blue:    "bg-blue-500/10    text-blue-500",
  violet:  "bg-violet-500/10  text-violet-500",
  amber:   "bg-amber-500/10   text-amber-500",
  rose:    "bg-rose-500/10    text-rose-500",
  sky:     "bg-sky-500/10     text-sky-500",
};

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 flex items-center gap-2.5 hover:border-indigo-400/50 transition-all shadow-sm cursor-default">
      <div className={`p-2 rounded-lg flex-shrink-0 ${ACCENT[accent]}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide truncate leading-tight">{label}</p>
        <p className="text-sm font-bold text-[var(--text-main)] leading-snug">{value}</p>
        {sub && <p className="text-[9px] text-slate-400 truncate leading-tight mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Card({ title, badge, children }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
        {badge && (
          <span className="text-[9px] font-semibold bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--bg-body)] border border-[var(--border-color)]">
      <span className={`flex-shrink-0 ${color}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[8px] text-slate-400 truncate leading-tight">{label}</p>
        <p className={`text-xs font-bold leading-tight ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function LeaveRow({ label, count, dot }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <span className="text-[10px] text-[var(--text-main)]">{label}</span>
      </div>
      <span className="text-xs font-bold text-[var(--text-main)]">{count}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const cls =
    s.includes("complet") || s.includes("hired") || s.includes("approved") ||
    s.includes("paid")    || s.includes("active")
      ? "bg-emerald-100 text-emerald-700"
    : s.includes("interview") || s.includes("progress") || s.includes("in progress")
      ? "bg-amber-100 text-amber-700"
    : s.includes("offer")
      ? "bg-blue-100 text-blue-700"
    : s.includes("pending") || s.includes("generated")
      ? "bg-yellow-100 text-yellow-700"
    : s.includes("reject") || s.includes("closed") || s.includes("cancel")
      ? "bg-rose-100 text-rose-700"
      : "bg-slate-100 text-slate-500";
  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1 ${cls}`}>{status}</span>
  );
}

function Empty({ text }) {
  return <p className="text-[10px] text-slate-400 italic mt-2">{text}</p>;
}
