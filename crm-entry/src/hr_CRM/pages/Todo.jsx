import { useEffect, useState, useMemo, useRef } from "react";
import {
  Plus, Search, ListTodo, User, Calendar,
  Trash2, Edit3, Eye, Loader2,
  CheckCircle2, Clock, Check, ChevronRight, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ✅ CONFIG & AUTH IMPORTS
import { hasPermission } from "../configs/auth.utils";
import PermissionGate from "../configs/Gaurd/PermissionsGate";

// API IMPORTS
import { getTodos, createTodo, updateTodo, deleteTodo } from "../api/todo.api";
import { getAdminUsers } from "../../api/admin/users.api";

export default function Todo() {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [userQuery, setUserQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  const [form, setForm] = useState({
    title: "", description: "", assignedTo: "", dueDate: "", status: "Pending",
  });

  // ✅ PERMISSION LOGIC
  const canView   = hasPermission("TODO_VIEW");
  const canCreate = hasPermission("TODO_CREATE");
  const canUpdate = hasPermission("TODO_UPDATE");
  const canDelete = hasPermission("TODO_DELETE");

  const load = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [todoRes, userRes] = await Promise.all([
        getTodos(),
        (canCreate || canUpdate)
          ? getAdminUsers({ page: 1, pageSize: 200 })
          : Promise.resolve({ users: [] })
      ]);
      setData(todoRes || []);
      setUsers(userRes?.users || []);
    } catch (err) {
      if (err.response?.status !== 403) toast.error("Failed to load data");
    }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    load(); 
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) setShowUserDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [canView]);

  const filteredUsers = useMemo(() => {
    const query = userQuery.toLowerCase();
    if (!query) return users.slice(0, 5);
    return users.filter(u => 
      (u.username || u.name || "").toLowerCase().includes(query) || 
      u.userId?.toString().includes(query)
    ).slice(0, 5);
  }, [userQuery, users]);

  const handleUserSelect = (u) => {
    setForm(prev => ({ ...prev, assignedTo: u.userId }));
    setUserQuery(u.username || u.name);
    setShowUserDropdown(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editTask && !canUpdate) return toast.error("Unauthorized Action");
    if (!editTask && !canCreate) return toast.error("Unauthorized Action");
    
    if (!form.assignedTo) {
      toast.error("Please search and select a user from the list");
      return;
    }

    const tid = toast.loading(editTask ? "Updating..." : "Creating...");
    try {
      const payload = { 
        title: form.title,
        description: form.description,
        assignedTo: Number(form.assignedTo), 
        dueDate: new Date(form.dueDate).toISOString(),
        status: form.status
      };

      if (editTask) {
        await updateTodo(editTask.taskId, payload);
        toast.success("Task Updated", { id: tid });
      } else {
        await createTodo(payload);
        toast.success("Task Created", { id: tid });
      }
      
      setOpen(false);
      setEditTask(null);
      resetForm();
      load();
    } catch (err) { 
      toast.error("Operation failed", { id: tid }); 
    }
  };

  const handleEdit = (task) => {
    setEditTask(task);
    const assignedUser = users.find(u => Number(u.userId) === Number(task.assignedTo));
    setUserQuery(assignedUser ? (assignedUser.username || assignedUser.name) : "");
    setForm({ 
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "" 
    });
    setOpen(true);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", assignedTo: "", dueDate: "", status: "Pending" });
    setUserQuery("");
    setEditTask(null);
  };

  const getUserName = (userId) => {
    const found = users.find(u => Number(u.userId) === Number(userId));
    return found ? found.username || found.name : `ID: ${userId}`;
  };

  const filteredTasks = data.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-none">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">TODO clearance required</p>
      </div>
    );
  }

  // --- 🎨 DYNAMIC STATUS COLOR LOGIC ---
  const StatusBar = ({ currentStatus }) => {
    const steps = [
      { id: "Pending", activeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      { id: "InProgress", activeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
      { id: "Completed", activeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" }
    ];
    const currentIndex = steps.findIndex(s => s.id === currentStatus);
    
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-1">
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border transition-all ${
              idx <= currentIndex 
                ? step.activeColor
                : 'text-slate-300 border-transparent opacity-40'
            }`}>
              {step.id}
            </span>
            {idx < steps.length - 1 && <ChevronRight size={8} className="text-slate-300" />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-[520px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans mt-1 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* SIDEBAR */}
      <div className="w-64 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                Tasks
              </h2>
              <PermissionGate permission="TODO_CREATE">
                <button onClick={() => { resetForm(); setOpen(true); }} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition active:scale-95 shadow-md shadow-indigo-500/20">
                  <Plus size={14} />
                </button>
              </PermissionGate>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input type="text" placeholder="Filter tasks..." className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg pl-8 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)]" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          <div className="p-3 bg-[var(--bg-body)] rounded-xl border border-[var(--border-color)]">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-70">Total Tasks</p>
            <p className="text-xl font-black text-[var(--text-main)]">{data.length}</p>
          </div>
          {filteredTasks.slice(0, 7).map(t => (
            <div key={t.taskId} className="flex items-center gap-3 p-2 border-b border-[var(--border-color)]/30">
               <div className={`h-2 w-2 rounded-full shrink-0 ${
                 t.status === 'Completed' ? 'bg-emerald-500' : t.status === 'InProgress' ? 'bg-indigo-500' : 'bg-amber-500'
               }`} />
               <div className="overflow-hidden">
                 <p className="text-[10px] font-bold text-[var(--text-main)] opacity-80 truncate uppercase">{t.title}</p>
                 <p className="text-[7px] font-black text-slate-400 uppercase">{t.status}</p>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><ListTodo size={18} /></div>
            <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">Todo Management</h2>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[var(--bg-body)]/20 p-4 custom-scrollbar">
          {loading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div> : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm transition-colors">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Task Info</th>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center">Workflow Progress</th>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/30">
                  {filteredTasks.map((t) => (
                    <tr key={t.taskId} className="hover:bg-indigo-500/[0.02] transition-colors group">
                      <td className="px-4 py-3">
                        <p className="text-[10px] font-black text-[var(--text-main)] uppercase leading-none mb-1">{t.title}</p>
                        <div className="flex items-center gap-2">
                           <p className="text-[8px] font-bold text-indigo-500 uppercase">{getUserName(t.assignedTo)}</p>
                           <span className="text-[8px] text-slate-400">|</span>
                           <p className="text-[8px] text-slate-400 font-medium uppercase">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex justify-center"><StatusBar currentStatus={t.status} /></div>
                      </td>
                      <td className="px-4 py-3 text-right">
                         <div className="flex justify-end gap-2">
                           <button onClick={() => setViewTask(t)} className="p-1 text-slate-400 hover:text-indigo-500 transition-all"><Eye size={14}/></button>
                           <PermissionGate permission="TODO_UPDATE">
                             <button onClick={() => handleEdit(t)} className="p-1 text-slate-400 hover:text-emerald-500 transition-all"><Edit3 size={14}/></button>
                           </PermissionGate>
                           <PermissionGate permission="TODO_DELETE">
                             <button onClick={() => { if(window.confirm("Remove Task?")) { deleteTodo(t.taskId).then(() => load()); } }} className="p-1 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                           </PermissionGate>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL (FORM) */}
      <AnimatePresence>
        {open && (editTask ? canUpdate : canCreate) && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] backdrop-blur-sm bg-slate-900/60 p-4" onClick={() => setOpen(false)}>
            <motion.form initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} onSubmit={handleSubmit} onClick={e => e.stopPropagation()} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-[var(--border-color)]">
              <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-5">{editTask ? "Revise Progress" : "New Task"}</h3>
              <div className="space-y-3">
                
                {/* Dynamic Status Display in Form */}
                <div className="flex justify-center bg-[var(--bg-body)] p-3 rounded-xl border border-[var(--border-color)] mb-2">
                   <StatusBar currentStatus={form.status} />
                </div>

                <input name="title" value={form.title} onChange={handleChange} placeholder="TASK TITLE" className="w-full text-[10px] font-bold uppercase bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-lg outline-none text-[var(--text-main)]" required />
                
                <div className="relative" ref={userDropdownRef}>
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Assign To (Search Name/ID)</label>
                  <div className="relative">
                    <input type="text" value={userQuery} placeholder="TYPE TO SEARCH..." className="w-full text-[10px] font-bold uppercase bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-lg outline-none text-[var(--text-main)]" onFocus={() => setShowUserDropdown(true)} onChange={(e) => { setUserQuery(e.target.value); setShowUserDropdown(true); if(form.assignedTo) setForm({...form, assignedTo: ""}); }} />
                    <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-[120] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-32 overflow-y-auto">
                      {filteredUsers.map(u => (
                        <button key={u.userId} type="button" onClick={() => handleUserSelect(u)} className="w-full px-3 py-2 text-left hover:bg-indigo-500/10 flex items-center justify-between transition-colors border-b border-[var(--border-color)]/30 last:border-0">
                           <p className="text-[10px] font-black uppercase text-[var(--text-main)]">{u.username || u.name} <span className="text-[8px] opacity-50 block">ID: {u.userId}</span></p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="w-full text-[10px] bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-lg text-[var(--text-main)]" required />
                  <select name="status" value={form.status} onChange={handleChange} className="w-full text-[10px] font-black uppercase bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-lg text-[var(--text-main)]">
                    {(form.status === "Pending" || !editTask) && <option value="Pending">Pending</option>}
                    {form.status !== "Completed" && <option value="InProgress">InProgress</option>}
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="SCOPE DESCRIPTION..." className="w-full text-[10px] bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-lg h-20 text-[var(--text-main)]" />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg hover:bg-indigo-700">Save</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL */}
      {viewTask && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] backdrop-blur-sm bg-slate-900/60 p-4" onClick={() => setViewTask(null)}>
          <div className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">Task Details</h3>
            <div className="space-y-4">
                <div className="flex justify-center bg-[var(--bg-body)] p-3 rounded-xl border border-[var(--border-color)]">
                  <StatusBar currentStatus={viewTask.status} />
                </div>
                <div className="pt-2">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Title</p>
                  <p className="text-[10px] font-bold uppercase text-[var(--text-main)]">{viewTask.title}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase">Description</p>
                  <p className="text-[10px] text-[var(--text-main)] opacity-80">{viewTask.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">Assigned</p>
                    <p className="text-[10px] font-bold uppercase text-indigo-600">{getUserName(viewTask.assignedTo)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">Due Date</p>
                    <p className="text-[10px] font-bold text-[var(--text-main)]">{new Date(viewTask.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
            </div>
            <button onClick={() => setViewTask(null)} className="w-full mt-6 py-2.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}