import React, { useEffect, useState } from "react";
import { 
  Users, Clock, ListTodo, BookOpen, AlertCircle, CheckCircle2, 
  ChevronRight, Wallet, Building2, MapPin, Zap, TrendingUp, Loader2
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
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
    stats: { totalUsers: 0, openTasks: 0, kbArticles: 0, pendingOvertime: 0, activeBranches: 0 }
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
    <div className="h-[calc(100vh-120px)] w-full flex items-center justify-center bg-white rounded-2xl border border-slate-100">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col gap-3 overflow-hidden text-slate-900">
      
      {/* 1. TOP STATS - Ultra Compact */}
      <div className="grid grid-cols-5 gap-2 shrink-0">
        <StatBox title="Staff" value={data.stats.totalUsers} icon={<Users size={14}/>} color="indigo" />
        <StatBox title="Overtime" value={data.stats.pendingOvertime} icon={<Clock size={14}/>} color="orange" />
        <StatBox title="Branches" value={data.stats.activeBranches} icon={<MapPin size={14}/>} color="emerald" />
        <StatBox title="Tasks" value={data.stats.openTasks} icon={<ListTodo size={14}/>} color="slate" />
        <StatBox title="Budget" value="$120k" icon={<Wallet size={14}/>} color="violet" />
      </div>

      {/* 2. MAIN GRID - No Scroll */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* COL 1: ATTENDANCE & BRANCH (LEFT) */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col">
            <Header label="Attendance Hours" />
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <Area type="monotone" dataKey="h" stroke="#6366f1" fill="#6366f110" strokeWidth={2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                  <Tooltip />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="h-32 bg-indigo-600 rounded-xl p-4 text-white relative overflow-hidden shrink-0">
            <Zap size={40} className="absolute -right-2 -bottom-2 opacity-10 rotate-12" />
            <p className="text-[9px] font-black opacity-70 uppercase tracking-widest">System Pulse</p>
            <div className="mt-2 flex justify-between items-end">
               <p className="text-xl font-black leading-none">ACTIVE</p>
               <span className="text-[10px] font-bold">99.9% Uptime</span>
            </div>
            <div className="mt-3 w-full bg-white/20 h-1 rounded-full"><div className="bg-white h-full w-[99%]" /></div>
          </div>
        </div>

        {/* COL 2: BUDGET & RECRUITMENT (CENTER) */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col">
            <Header label="Budget Allocation" />
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={budgetData} innerRadius={30} outerRadius={45} dataKey="v" paddingAngle={4}>
                    {budgetData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="h-44 bg-white border border-slate-200 rounded-xl p-3 shadow-sm shrink-0">
            <Header label="Recruitment Funnel" />
            <div className="mt-2 space-y-2">
               <ProgressBar label="Sourced" val={80} color="bg-indigo-500" />
               <ProgressBar label="Interview" val={40} color="bg-emerald-500" />
               <ProgressBar label="Offer" val={15} color="bg-orange-500" />
            </div>
          </div>
        </div>

        {/* COL 3: ACTIONS & TODO (RIGHT) */}
        <div className="col-span-4 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col min-h-0">
          <Header label="HR Action Center" badge="Live" />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2 custom-scrollbar">
             <p className="text-[9px] font-black text-slate-400 uppercase">Urgent Tasks</p>
             {data.todos.slice(0, 4).map(todo => (
                <div key={todo.taskId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                   <CheckCircle2 size={12} className={todo.status === 'Completed' ? 'text-green-500' : 'text-slate-300'} />
                   <p className="text-[10px] font-bold text-slate-700 truncate flex-1 uppercase tracking-tighter">{todo.title}</p>
                </div>
             ))}
             
             <p className="text-[9px] font-black text-slate-400 uppercase mt-3">Quick Pulse</p>
             <div className="space-y-1.5">
               <PulseRow label="Pending OT" val="04" color="bg-orange-500" />
               <PulseRow label="New KB" val={data.stats.kbArticles} color="bg-indigo-500" />
               <PulseRow label="Check-ins" val="92%" color="bg-emerald-500" />
             </div>
          </div>
          <button className="w-full mt-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shrink-0">
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
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</h3>
    {badge && <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase">{badge}</span>}
  </div>
);

const ProgressBar = ({ label, val, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase"><span>{label}</span><span>{val}%</span></div>
    <div className="w-full bg-slate-100 h-1 rounded-full"><div className={`${color} h-full rounded-full`} style={{width: `${val}%`}} /></div>
  </div>
);

const PulseRow = ({ label, val, color }) => (
  <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg border border-slate-100">
    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{label}</span>
    <span className={`${color} text-white px-1.5 py-0.5 rounded text-[9px] font-black`}>{val}</span>
  </div>
);

function StatBox({ title, value, icon, color }) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50", orange: "text-orange-600 bg-orange-50",
    emerald: "text-emerald-600 bg-emerald-50", slate: "text-slate-600 bg-slate-100", violet: "text-violet-600 bg-violet-50"
  };
  return (
    <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
      <div className={`p-1.5 rounded-md ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 truncate">{title}</p>
        <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}
