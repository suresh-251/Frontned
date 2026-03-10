import React, { useEffect, useState } from "react";
import { 
  Users, Clock, ListTodo, AlertCircle, CheckCircle2, 
  MapPin, Zap, Loader2, Wallet
} from "lucide-react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";

// API IMPORTS
import { getAdminUsers } from "../../api/admin/users.api";
import { getTodos } from "../api/todo.api";
import { getKnowledgeList } from "../api/api.knowledge";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const [data, setData] = useState({
    users: [], todos: [],
    stats: { totalUsers: 0, openTasks: 0, kbArticles: 0, pendingOvertime: 4, activeBranches: 8 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [userRes, todoRes, kbRes] = await Promise.all([
          getAdminUsers({ page: 1, pageSize: 10 }),
          getTodos(),
          getKnowledgeList()
        ]);
        setData({
          users: userRes?.users || [],
          todos: todoRes || [],
          stats: {
            totalUsers: userRes?.totalCount || 0,
            openTasks: todoRes?.filter(t => t.status !== "Completed").length || 0,
            kbArticles: kbRes?.length || 0,
            pendingOvertime: 4, 
            activeBranches: 8   
          }
        });
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const attendanceData = [
    { day: "M", h: 420 }, { day: "T", h: 450 }, { day: "W", h: 480 }, { day: "T", h: 410 }, { day: "F", h: 390 }
  ];

  const budgetData = [
    { name: "Ops", v: 45 }, { name: "HR", v: 25 }, { name: "Mkt", v: 30 }
  ];

  if (loading) return (
    /* Theme-aware loading state */
    <div className="h-[calc(100vh-120px)] w-full flex items-center justify-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    /* Main Container: bg-[var(--bg-body)] and text-[var(--text-main)] */
    <div className="h-[calc(100vh-100px)] w-full flex flex-col gap-3 overflow-hidden text-[var(--text-main)] p-1 transition-colors duration-300">
      
      {/* 1. TOP STATS */}
      <div className="grid grid-cols-5 gap-2 shrink-0">
        <StatBox title="Staff" value={data.stats.totalUsers} icon={<Users size={14}/>} color="indigo" />
        <StatBox title="Overtime" value={data.stats.pendingOvertime} icon={<Clock size={14}/>} color="orange" />
        <StatBox title="Branches" value={data.stats.activeBranches} icon={<MapPin size={14}/>} color="emerald" />
        <StatBox title="Tasks" value={data.stats.openTasks} icon={<ListTodo size={14}/>} color="slate" />
        <StatBox title="Budget" value="$120k" icon={<Wallet size={14}/>} color="violet" />
      </div>

      {/* 2. MAIN GRID */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* COL 1: ATTENDANCE (LEFT) */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0">
          <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm flex flex-col relative transition-colors">
            <Header label="Attendance Hours" />
            <div className="flex-1 min-h-0 -ml-8 -mr-2 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines now use border variable */}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: 'var(--text-main)', opacity: 0.5}} dy={5} />
                  <YAxis hide domain={[0, 700]} /> 
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '10px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="h" 
                    stroke="#6366f1" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorH)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="h-28 bg-indigo-600 rounded-xl p-4 text-white relative overflow-hidden shrink-0">
            <Zap size={40} className="absolute -right-2 -bottom-2 opacity-10 rotate-12" />
            <p className="text-[9px] font-black opacity-70 uppercase tracking-widest">System Pulse</p>
            <div className="mt-1 flex justify-between items-end">
               <p className="text-xl font-black leading-none uppercase">Active</p>
               <span className="text-[10px] font-bold">99.9% Uptime</span>
            </div>
            <div className="mt-3 w-full bg-white/20 h-1 rounded-full"><div className="bg-white h-full w-[99%]" /></div>
          </div>
        </div>

        {/* COL 2: BUDGET & RECRUITMENT (CENTER) */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0">
          <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm flex flex-col transition-colors">
            <Header label="Budget Allocation" />
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={budgetData} innerRadius={25} outerRadius={40} dataKey="v" paddingAngle={5}>
                    {budgetData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="h-40 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm shrink-0 transition-colors">
            <Header label="Recruitment Funnel" />
            <div className="mt-2 space-y-2">
               <ProgressBar label="Sourced" val={80} color="bg-indigo-500" />
               <ProgressBar label="Interview" val={40} color="bg-emerald-500" />
               <ProgressBar label="Offer" val={15} color="bg-orange-500" />
            </div>
          </div>
        </div>

        {/* COL 3: ACTION CENTER (RIGHT) */}
        <div className="col-span-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm flex flex-col min-h-0 transition-colors">
          <Header label="HR Action Center" badge="Live" />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2 custom-scrollbar">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Urgent Tasks</p>
             {data.todos.length > 0 ? data.todos.slice(0, 4).map(todo => (
                <div key={todo.taskId} className="flex items-center gap-2 p-1.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] group hover:border-indigo-500/50 transition-colors">
                   <CheckCircle2 size={12} className={todo.status === 'Completed' ? 'text-green-500' : 'text-slate-400'} />
                   <p className="text-[10px] font-bold text-[var(--text-main)] truncate flex-1 uppercase tracking-tighter">{todo.title}</p>
                </div>
             )) : <p className="text-[10px] text-slate-400 font-bold italic">No pending tasks</p>}
             
             <p className="text-[9px] font-black text-slate-400 uppercase mt-3 tracking-tighter">Quick Pulse</p>
             <div className="space-y-1">
               <PulseRow label="Pending OT" val={data.stats.pendingOvertime} color="bg-orange-500" />
               <PulseRow label="New KB" val={data.stats.kbArticles} color="bg-indigo-500" />
               <PulseRow label="Check-ins" val="92%" color="bg-emerald-500" />
             </div>
          </div>
          <button className="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shrink-0 active:scale-95">
            Full Reports
          </button>
        </div>

      </div>
    </div>
  );
}

// SHARED MINI COMPONENTS
const Header = ({ label, badge }) => (
  <div className="flex justify-between items-center mb-1 shrink-0">
    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</h3>
    {badge && <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded uppercase">{badge}</span>}
  </div>
);

const ProgressBar = ({ label, val, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
      <span>{label}</span><span>{val}%</span>
    </div>
    <div className="w-full bg-[var(--bg-body)] h-1 rounded-full overflow-hidden">
      <div className={`${color} h-full rounded-full transition-all duration-500`} style={{width: `${val}%`}} />
    </div>
  </div>
);

const PulseRow = ({ label, val, color }) => (
  <div className="flex items-center justify-between p-1.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-card)] transition-colors">
    <span className="text-[9px] font-bold text-[var(--text-main)] uppercase tracking-tighter opacity-80">{label}</span>
    <span className={`${color} text-white px-1.5 py-0.5 rounded text-[8px] font-black`}>{val}</span>
  </div>
);

function StatBox({ title, value, icon, color }) {
  const colors = {
    indigo: "text-indigo-500 bg-indigo-500/10", 
    orange: "text-orange-500 bg-orange-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10", 
    slate: "text-slate-400 bg-slate-400/10", 
    violet: "text-violet-500 bg-violet-500/10"
  };
  return (
    <div className="bg-[var(--bg-card)] p-2 rounded-lg border border-[var(--border-color)] shadow-sm flex items-center gap-2 hover:border-indigo-500/50 transition-all cursor-default group">
      <div className={`p-1.5 rounded-md transition-transform group-hover:scale-110 ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 truncate tracking-tight">{title}</p>
        <p className="text-sm font-black text-[var(--text-main)] leading-none">{value}</p>
      </div>
    </div>
  );
}