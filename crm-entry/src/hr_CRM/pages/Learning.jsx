import React, { useState, useEffect, useMemo } from "react";
import { 
  getAllLearning, 
  assignCourse, 
  completeLearning, 
  deleteLearning,
  updateLearningProgress
} from "../api/api.Learning";
import { getAdminUsers } from "../../api/admin/users.api";
import { 
  BookOpen, Plus, Loader2, X, CheckCircle2, 
  User, Search, Calendar, GraduationCap, Trash2, 
  Layers, Award, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function Learning() {
  const [courses, setCourses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    employeeId: "", courseName: "", description: "", 
    role: "", assignedDate: "", dueDate: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [learnRes, empRes] = await Promise.all([
        getAllLearning(),
        getAdminUsers({ page: 1, pageSize: 500 })
      ]);
      setCourses(Array.isArray(learnRes) ? learnRes : learnRes?.data || []);
      setEmployees(empRes?.users || []);
    } catch (err) {
      toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(item => {
      const emp = employees.find(e => e.userId === item.employeeId);
      const name = emp?.username || "Unknown";
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (filter === "Completed") return item.status === "Completed";
      if (filter === "Ongoing") return item.status !== "Completed";
      return true;
    });
  }, [courses, employees, searchTerm, filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Assigning Course...");
    try {
      await assignCourse({
        ...formData,
        employeeId: parseInt(formData.employeeId),
        assignedDate: new Date(formData.assignedDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString()
      });
      toast.success("Course Assigned", { id: tid });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error("Assignment Failed", { id: tid });
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeLearning(id);
      toast.success("Certified Complete");
      fetchData();
    } catch (err) { toast.error("Update Failed"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await deleteLearning(id);
      toast.success("Record Deleted");
      fetchData();
    } catch (err) { toast.error("Delete Failed"); }
  };

  const resetForm = () => {
    setFormData({ employeeId: "", courseName: "", description: "", role: "", assignedDate: "", dueDate: "" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap size={22} className="text-indigo-600" /> Learning Portal
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Skill Development Registry</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search courses..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {["all", "Ongoing", "Completed"].map((t) => (
              <button
                key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${
                  filter === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Plus size={14} strokeWidth={3} /> Assign Course
          </button>
        </div>
      </div>

      {/* TABLE */}
      {loading && courses.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-auto">Course & Employee</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-48 text-center">Timeline</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Progress</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-28">Status</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.map((item) => {
                const emp = employees.find(e => e.userId === item.employeeId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                          <BookOpen size={16}/>
                        </div>
                        <div className="flex flex-col truncate">
                          <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1 truncate">{item.courseName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <User size={10}/> {emp?.username || "Unknown Staff"} • {item.role || 'General'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-slate-300 uppercase">Start</span>
                            <span className="text-[10px] font-bold text-slate-600">{new Date(item.assignedDate).toLocaleDateString()}</span>
                         </div>
                         <ArrowRight size={10} className="text-slate-300" />
                         <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-rose-300 uppercase">Due</span>
                            <span className="text-[10px] font-bold text-rose-500">{new Date(item.dueDate).toLocaleDateString()}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                       <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full transition-all duration-500" style={{width: `${item.progress || 0}%`}} />
                       </div>
                       <p className="text-[9px] font-black text-slate-400 text-center mt-1">{item.progress || 0}% Complete</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md border font-black uppercase text-[9px] ${
                        item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.status || 'Ongoing'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                       <div className="flex justify-end gap-1.5">
                        {item.status !== "Completed" && (
                          <button onClick={() => handleComplete(item.id)} title="Mark Done" className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white rounded-md transition-all">
                            <CheckCircle2 size={14}/>
                          </button>
                        )}
                        <button onClick={() => handleDelete(item.id)} title="Delete" className="p-1.5 bg-slate-50 text-slate-400 border border-slate-100 hover:bg-rose-500 hover:text-white rounded-md transition-all">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGN MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
               <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-indigo-600" />
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Assign Courseware</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-5 grid grid-cols-2 gap-4">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Employee Target</label>
                    <select required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                      <option value="">Select Employee...</option>
                      {employees.map(emp => <option key={emp.userId} value={emp.userId}>{emp.username}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Employee Role</label>
                    <input required type="text" placeholder="e.g. Developer" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Course Title</label>
                    <input required type="text" placeholder="Enter course name..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50" value={formData.courseName} onChange={e => setFormData({...formData, courseName: e.target.value})} />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Description</label>
                    <textarea required rows="2" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Assigned Date</label>
                    <input required type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50" value={formData.assignedDate} onChange={e => setFormData({...formData, assignedDate: e.target.value})} />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Deadline (Due Date)</label>
                    <input required type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>

                  <button type="submit" className="col-span-2 mt-2 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-slate-800 transition-all">
                    Assign Courseware
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility icon
const ArrowRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);