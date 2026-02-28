import { useEffect, useState } from "react";
import { 
  Plus, Search, ListTodo, User, Calendar, 
  MoreHorizontal, Trash2, Edit3, Eye, Loader2,
  CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// API IMPORTS
import { getTodos, createTodo, updateTodo, deleteTodo } from "../api/todo.api";

export default function Todo() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    status: "Pending",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTodos();
      setData(res || []);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ title: "", description: "", assignedTo: "", dueDate: "", status: "Pending" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        assignedTo: Number(form.assignedTo),
        dueDate: new Date(form.dueDate).toISOString(),
      };

      if (editTask) {
        await updateTodo(editTask.taskId, payload);
        toast.success("Task updated");
      } else {
        await createTodo(payload);
        toast.success("Task created");
      }
      setOpen(false);
      setEditTask(null);
      resetForm();
      load();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setForm({
      ...task,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this task?")) {
      await deleteTodo(id);
      toast.success("Task removed");
      load();
    }
  };

  const filteredTasks = data.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[520px] w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans mt-1">
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR: TASK STATS / SEARCH */}
      <div className="w-64 border-r border-slate-100 flex flex-col shrink-0 bg-white">
        <div className="p-4 border-b border-slate-50">
          <div className="flex items-center justify-between mb-3">
             <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Tasks</h2>
             <button 
                onClick={() => { resetForm(); setEditTask(null); setOpen(true); }}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
               <Plus size={14} />
             </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
            <input 
              type="text" placeholder="Filter tasks..."
              className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-8 py-1.5 outline-none focus:ring-1 focus:ring-indigo-100"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Tasks</p>
            <p className="text-xl font-black text-slate-800">{data.length}</p>
          </div>
          {/* List of quick-view items */}
          {filteredTasks.slice(0, 5).map(t => (
            <div key={t.taskId} className="flex items-center gap-3 p-2 border-b border-slate-50">
               <div className={`h-2 w-2 rounded-full ${t.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
               <p className="text-[10px] font-bold text-slate-600 truncate uppercase">{t.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT: TABLE */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><ListTodo size={18} /></div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Todo Management</h2>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/20 p-4">
          {loading ? (
             <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Task Info</th>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((t) => (
                      <tr key={t.taskId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{t.title}</p>
                          <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">ID: {t.taskId}</p>
                        </td>
                        <td className="px-4 py-3">
                           <span className="text-[10px] font-bold text-slate-500">
                             {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}
                           </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            t.status === "Completed" ? "bg-green-50 text-green-600 border border-green-100" :
                            t.status === "InProgress" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {t.status === "Completed" ? <CheckCircle2 size={10}/> : <Clock size={10}/>}
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                           <div className="flex justify-end gap-2">
                             <button onClick={() => setViewTask(t)} className="p-1 text-slate-400 hover:text-indigo-600 transition"><Eye size={14}/></button>
                             <button onClick={() => handleEdit(t)} className="p-1 text-slate-400 hover:text-green-600 transition"><Edit3 size={14}/></button>
                             <button onClick={() => handleDelete(t.taskId)} className="p-1 text-slate-400 hover:text-red-600 transition"><Trash2 size={14}/></button>
                           </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="py-20 text-center text-[9px] font-black text-slate-300 uppercase italic">No tasks found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODAL (Compact) */}
      {viewTask && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] backdrop-blur-sm bg-slate-900/20">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-4">Task Details</h3>
            <div className="space-y-3">
               <div><p className="text-[8px] font-black text-slate-400 uppercase">Title</p><p className="text-[10px] font-bold uppercase">{viewTask.title}</p></div>
               <div><p className="text-[8px] font-black text-slate-400 uppercase">Description</p><p className="text-[10px] text-slate-600">{viewTask.description}</p></div>
               <div className="grid grid-cols-2 gap-4 pt-2">
                 <div><p className="text-[8px] font-black text-slate-400 uppercase">Status</p><p className="text-[10px] font-bold text-indigo-600 uppercase">{viewTask.status}</p></div>
                 <div><p className="text-[8px] font-black text-slate-400 uppercase">Assigned ID</p><p className="text-[10px] font-bold uppercase">{viewTask.assignedTo}</p></div>
               </div>
            </div>
            <button onClick={() => setViewTask(null)} className="w-full mt-6 py-2 bg-slate-100 text-[10px] font-black uppercase text-slate-600 rounded-xl hover:bg-slate-200 transition">Close</button>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL (Compact) */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] backdrop-blur-sm bg-slate-900/20">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-5">
              {editTask ? "Modify Task" : "New Task"}
            </h3>
            <div className="space-y-3">
              <input name="title" value={form.title} onChange={handleChange} placeholder="TASK TITLE" className="w-full text-[10px] font-bold uppercase bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-100" required />
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="DESCRIPTION..." className="w-full text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none h-20" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" name="assignedTo" value={form.assignedTo} onChange={handleChange} placeholder="USER ID" className="w-full text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg" required />
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="w-full text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg" required />
              </div>
              <select name="status" value={form.status} onChange={handleChange} className="w-full text-[10px] font-black uppercase bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <option value="Pending">Pending</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-indigo-100">{editTask ? "Update" : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}