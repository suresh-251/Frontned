import { useEffect, useState } from "react";
import { 
  Users, Briefcase, BookOpen, Clock, 
  ListTodo, TrendingUp, ArrowUpRight, 
  Loader2, AlertCircle, CheckCircle2, ChevronRight
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";

// API IMPORTS
import { getAdminUsers } from "../../api/admin/users.api";
import { getTodos } from "../api/todo.api";
import { getKnowledgeList } from "../api/api.knowledge";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#64748b"];

export default function Dashboard() {
  const [data, setData] = useState({
    users: [],
    todos: [],
    knowledge: [],
    stats: { totalUsers: 0, openTasks: 0, kbArticles: 0, pendingApprovals: 0 }
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
          knowledge: kbRes || [],
          stats: {
            totalUsers: userRes?.totalCount || userRes?.users?.length || 0,
            openTasks: todoRes?.filter(t => t.status !== "Completed").length || 0,
            kbArticles: kbRes?.length || 0,
            pendingApprovals: kbRes?.filter(k => k.approvalStatus === "Pending").length || 0
          }
        });
      } catch (err) {
        console.error("Dashboard Load Error", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Mock data for the Recruitment Pipeline Chart
  const recruitmentData = [
    { stage: "Sourced", count: 45 },
    { stage: "Screening", count: 32 },
    { stage: "Interview", count: 12 },
    { stage: "Offer", count: 5 },
  ];

  if (loading) return (
    <div className="h-[520px] w-full flex items-center justify-center bg-white rounded-2xl border border-slate-200">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col h-[520px] w-full bg-slate-50/30 font-sans overflow-hidden mt-1">
      
      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-4 gap-4 p-4 shrink-0">
        <StatBox title="Staff Count" value={data.stats.totalUsers} icon={<Users size={16}/>} color="indigo" />
        <StatBox title="Active Tasks" value={data.stats.openTasks} icon={<ListTodo size={16}/>} color="orange" />
        <StatBox title="KB Articles" value={data.stats.kbArticles} icon={<BookOpen size={16}/>} color="emerald" />
        <StatBox title="Pending Appr." value={data.stats.pendingApprovals} icon={<AlertCircle size={16}/>} color="slate" />
      </div>

      {/* 2. MAIN ANALYTICS AREA */}
      <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0">
        
        {/* LEFT: Recruitment & Knowledge Trends */}
        <div className="flex-[1.5] flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recruitment Pipeline</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recruitmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', fontSize: '10px'}} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="h-1/3 bg-indigo-600 rounded-2xl p-4 shadow-lg shadow-indigo-100 flex items-center justify-between text-white relative overflow-hidden">
             <div className="z-10">
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Knowledge Base</p>
                <p className="text-xl font-black mt-1 uppercase">Central Repository</p>
                <button className="mt-3 flex items-center gap-1 text-[9px] font-black bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition">
                  EXPLORE ASSETS <ChevronRight size={10}/>
                </button>
             </div>
             <BookOpen size={80} className="absolute -right-4 -bottom-4 opacity-10 rotate-12" />
          </div>
        </div>

        {/* RIGHT: Overtime & Todo Lists */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* TODO QUICK VIEW */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col overflow-hidden">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgent Todos</h3>
                <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">LATEST 5</span>
             </div>
             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {data.todos.slice(0, 5).map(todo => (
                  <div key={todo.taskId} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                     <div className={todo.status === 'Completed' ? 'text-green-500' : 'text-slate-300'}>
                        <CheckCircle2 size={14} />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate uppercase leading-none">{todo.title}</p>
                        <p className="text-[8px] text-slate-400 mt-1 uppercase">ID: {todo.taskId}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* OVERTIME HIGHLIGHT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System Health</h3>
             <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <p className="text-[9px] font-bold text-slate-500 uppercase">API Performance</p>
                   <p className="text-[10px] font-black text-indigo-600">99.2%</p>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full">
                   <div className="bg-indigo-500 h-full w-[99%]" />
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Sub-component for Top Cards
function StatBox({ title, value, icon, color }) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50",
    orange: "text-orange-600 bg-orange-50",
    emerald: "text-emerald-600 bg-emerald-50",
    slate: "text-slate-600 bg-slate-100"
  };

  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-2 rounded-xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
        <p className="text-lg font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}