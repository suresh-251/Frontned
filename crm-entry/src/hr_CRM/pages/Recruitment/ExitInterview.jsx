// import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { 
//   getAllExitInterviews, 
//   getExitInterviewByEmployee,
//   scheduleExitInterview, 
//   deleteExitInterview 
// } from "../../api/hr.exitInterview";
// import { getAdminUsers } from "../../../api/admin/users.api";
// import { useRole } from "../../hooks/useRole";
// import { jwtDecode } from "jwt-decode";
// import { 
//   LogOut, Plus, Loader2, X, Search, 
//   Trash2, Check, UserPlus, ChevronRight 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// export default function ExitInterview() {
//   const { isManager } = useRole();
//   const [interviews, setInterviews] = useState([]);
//   const [employees, setEmployees] = useState([]); 
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
  
//   const [empSearchQuery, setEmpSearchQuery] = useState(""); 
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [tableSearch, setTableSearch] = useState("");
//   const dropdownRef = useRef(null);

//   const [formData, setFormData] = useState({
//     employeeId: "", scheduledDate: "", reasonForLeaving: ""
//   });

//   // Auth
//   const auth = useMemo(() => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return { id: null, name: "User" };
//       const decoded = jwtDecode(token);
//       return { 
//         id: Number(decoded.sub || decoded.id), 
//         name: decoded.username || decoded.unique_name || "User" 
//       };
//     } catch { return { id: null, name: "User" }; }
//   }, []);

//   // ✅ FIXED fetchData - Handles 403 gracefully
//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       // ✅ ALWAYS LOAD EMPLOYEES FIRST (WORKS!)
//       const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
//       let empData = [];
//       if (empRes?.users && Array.isArray(empRes.users)) empData = empRes.users;
//       else if (Array.isArray(empRes)) empData = empRes;
//       setEmployees(empData); // ✅ 16 employees loaded!
      
//       // Interviews (403 OK - won't break search)
//       if (isManager) {
//         try {
//           const intRes = await getAllExitInterviews();
//           setInterviews(intRes?.data || intRes || []);
//         } catch (intErr) {
//           console.log('ℹ️ Interviews 403 - showing empty list');
//           setInterviews([]);
//         }
//       } else {
//         try {
//           const res = await getExitInterviewByEmployee(auth.id);
//           const data = res?.data || res;
//           setInterviews(Array.isArray(data) ? data : data ? [data] : []);
//         } catch {
//           setInterviews([]);
//         }
//       }
//     } catch (err) { 
//       console.error('❌ Error:', err);
//       setInterviews([]);
//     } finally { 
//       setLoading(false); 
//     }
//   }, [isManager, auth.id]);

//   useEffect(() => { 
//     fetchData(); 
//   }, [fetchData]);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ✅ SEARCH WORKS WITH YOUR 16 EMPLOYEES
//   const searchableEmployees = useMemo(() => {
//     const query = empSearchQuery.toLowerCase().trim();
//     if (!query || formData.employeeId) return [];

//     return employees.filter(emp => {
//       const name = (emp.username || emp.name || "").toLowerCase();
//       const id = (emp.userId || emp.id || "").toString();
//       return name.includes(query) || id.includes(query);
//     }).slice(0, 5);
//   }, [employees, empSearchQuery, formData.employeeId]);

//   const filteredInterviews = useMemo(() => {
//     return interviews.filter(item => {
//       const emp = employees.find(e => e.userId === item.employeeId);
//       const empName = emp?.username || emp?.name || "Unknown";
//       return empName.toLowerCase().includes(tableSearch.toLowerCase()) || 
//              item.reasonForLeaving?.toLowerCase().includes(tableSearch.toLowerCase());
//     });
//   }, [interviews, employees, tableSearch]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.employeeId) return toast.error("Select employee first");
    
//     const tid = toast.loading("Scheduling...");
//     try {
//       await scheduleExitInterview({
//         employeeId: Number(formData.employeeId),
//         scheduledDate: new Date(formData.scheduledDate).toISOString(),
//         reasonForLeaving: formData.reasonForLeaving
//       });
//       toast.success("Scheduled!", { id: tid });
//       setShowModal(false);
//       resetForm();
//       fetchData();
//     } catch { 
//       toast.error("Failed!", { id: tid }); 
//     }
//   };

//   const resetForm = () => {
//     setFormData({ employeeId: "", scheduledDate: "", reasonForLeaving: "" });
//     setEmpSearchQuery("");
//   };

//   const getSelectedEmployeeName = () => {
//     const emp = employees.find(e => e.userId == formData.employeeId);
//     return emp?.username || emp?.name || 'Unknown';
//   };

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-slate-900">
//       <Toaster position="top-right" />

//       {/* HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
//             <LogOut size={22} className="text-rose-600" /> Offboarding Registry
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
//             Admin View | {employees.length} employees loaded ✅
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
//             <input 
//               type="text" 
//               placeholder="Filter table..." 
//               onChange={(e) => setTableSearch(e.target.value)} 
//               className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-44 outline-none focus:ring-2 focus:ring-rose-50" 
//             />
//           </div>
//           <button 
//             onClick={() => { resetForm(); setShowModal(true); }} 
//             className="bg-slate-900 text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
//           >
//             <Plus size={14} strokeWidth={3} /> Schedule Exit
//           </button>
//         </div>
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//         <table className="w-full text-left border-collapse table-fixed">
//           <thead className="bg-slate-50 border-b border-slate-200">
//             <tr>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-auto">Personnel</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-64 text-center">Reason</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Date</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-28">Status</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-24">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {filteredInterviews.map((item) => {
//               const emp = employees.find(e => e.userId === item.employeeId);
//               return (
//                 <tr key={item.id} className="hover:bg-slate-50">
//                   <td className="px-5 py-4 flex items-center gap-3">
//                     <div className="h-8 w-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 border border-rose-100 font-black text-[10px]">
//                       {emp?.username?.charAt(0) || '?'}
//                     </div>
//                     <div>
//                       <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-0.5">
//                         {emp?.username || "Unknown"}
//                       </p>
//                       <p className="text-[9px] font-bold text-slate-400 uppercase">ID: #{item.employeeId}</p>
//                     </div>
//                   </td>
//                   <td className="px-5 py-4 text-center text-[11px] font-medium text-slate-600 italic">
//                     "{item.reasonForLeaving}"
//                   </td>
//                   <td className="px-5 py-4 text-center">
//                     <span className="text-[10px] font-black text-slate-700">
//                       {new Date(item.scheduledDate).toLocaleDateString()}
//                     </span>
//                   </td>
//                   <td className="px-5 py-4 text-center">
//                     <span className={`px-2.5 py-1 rounded-md border font-black uppercase text-[8px] ${
//                       item.status === 'Completed' 
//                         ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
//                         : 'bg-amber-50 text-amber-600 border-amber-100'
//                     }`}>
//                       {item.status || 'Scheduled'}
//                     </span>
//                   </td>
//                   <td className="px-5 py-4 text-right">
//                     <button 
//                       onClick={async () => { 
//                         if(confirm("Delete?")) { 
//                           await deleteExitInterview(item.id); 
//                           fetchData(); 
//                         } 
//                       }} 
//                       className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
//                     >
//                       <Trash2 size={15}/>
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//         {loading && (
//           <div className="p-12 flex justify-center">
//             <Loader2 className="animate-spin text-rose-500" size={24} />
//           </div>
//         )}
//         {!loading && filteredInterviews.length === 0 && (
//           <div className="p-12 text-center text-[10px] font-bold text-slate-400 uppercase">
//             No exit interviews found
//           </div>
//         )}
//       </div>

//       {/* ✅ SEARCH MODAL - WILL WORK WITH YOUR 16 EMPLOYEES */}
//       <AnimatePresence>
//         {showModal && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div 
//               initial={{ scale: 0.95, opacity: 0 }} 
//               animate={{ scale: 1, opacity: 1 }} 
//               exit={{ scale: 0.95, opacity: 0 }}
//               className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200"
//             >
//               <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center rounded-t-3xl">
//                 <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
//                   <UserPlus size={16} className="text-rose-600" /> Schedule Interview
//                 </h3>
//                 <button onClick={() => { setShowModal(false); resetForm(); }}>
//                   <X size={18} className="text-slate-400 hover:text-rose-500"/>
//                 </button>
//               </div>
              
//               <form onSubmit={handleSubmit} className="p-6 space-y-4">
//                 <div className="space-y-1 relative" ref={dropdownRef}>
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">
//                     Select Personnel ({employees.length} available)
//                   </label>
//                   <div className="relative">
//                     <input 
//                       type="text" 
//                       placeholder="Type name or ID..." 
//                       className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-rose-50" 
//                       value={empSearchQuery} 
//                       onFocus={() => setShowDropdown(true)}
//                       onChange={(e) => { 
//                         setEmpSearchQuery(e.target.value); 
//                         setFormData(prev => ({...prev, employeeId: ""})); 
//                         setShowDropdown(true); 
//                       }}
//                     />
//                     <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
//                   </div>

//                   <AnimatePresence>
//                     {showDropdown && searchableEmployees.length > 0 && (
//                       <motion.div 
//                         initial={{ opacity: 0, y: -10 }} 
//                         animate={{ opacity: 1, y: 0 }} 
//                         exit={{ opacity: 0 }}
//                         className="absolute z-[120] w-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl max-h-48 overflow-y-auto"
//                       >
//                         {searchableEmployees.map(emp => (
//                           <button 
//                             key={emp.userId}
//                             type="button"
//                             onClick={() => { 
//                               setFormData({...formData, employeeId: emp.userId}); 
//                               setEmpSearchQuery(emp.username || emp.name); 
//                               setShowDropdown(false); 
//                             }}
//                             className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center justify-between border-b last:border-0 border-slate-50 transition-colors"
//                           >
//                             <div className="flex flex-col">
//                               <span className="text-[11px] font-black text-slate-700 uppercase">
//                                 {emp.username || emp.name}
//                               </span>
//                               <span className="text-[9px] font-bold text-slate-400 uppercase">
//                                 ID: #{emp.userId}
//                               </span>
//                             </div>
//                             <ChevronRight size={12} className="text-slate-300" />
//                           </button>
//                         ))}
//                       </motion.div>
//                     )}
//                   </AnimatePresence>

//                   {formData.employeeId && (
//                     <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
//                       <Check size={14} className="text-emerald-500"/>
//                       <div>
//                         <p className="text-[10px] font-black text-emerald-700 uppercase">
//                           #{formData.employeeId}
//                         </p>
//                         <p className="text-[8px] font-bold text-emerald-600 uppercase">
//                           {getSelectedEmployeeName()}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">
//                     Date & Time
//                   </label>
//                   <input 
//                     required 
//                     type="datetime-local" 
//                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" 
//                     value={formData.scheduledDate} 
//                     onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
//                   />
//                 </div>

//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">
//                     Reason
//                   </label>
//                   <textarea 
//                     required 
//                     rows="3" 
//                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none resize-none" 
//                     value={formData.reasonForLeaving} 
//                     onChange={e => setFormData({...formData, reasonForLeaving: e.target.value})}
//                   />
//                 </div>

//                 <button 
//                   type="submit" 
//                   disabled={!formData.employeeId || !formData.scheduledDate || !formData.reasonForLeaving}
//                   className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
//                 >
//                   Schedule Interview
//                 </button>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }






import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  getAllExitInterviews, 
  getExitInterviewByEmployee,
  scheduleExitInterview, 
  deleteExitInterview 
} from "../../api/hr.exitInterview";
import { getAdminUsers } from "../../../api/admin/users.api";
import { useRole } from "../../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import { 
  LogOut, Plus, Loader2, X, Search, 
  Trash2, Check, UserPlus, ChevronRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function ExitInterview() {
  const { isManager } = useRole();
  const [interviews, setInterviews] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Selection Search Logic
  const [empSearchQuery, setEmpSearchQuery] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    employeeId: "", scheduledDate: "", reasonForLeaving: ""
  });

  // Auth Context
  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { id: null, name: "User" };
      const decoded = jwtDecode(token);
      return { 
        id: Number(decoded.sub || decoded.id), 
        name: decoded.username || decoded.unique_name || "User" 
      };
    } catch { return { id: null, name: "User" }; }
  }, []);

  // 1. Fetching Logic with Employee Hydration
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ MIRRORED FROM EMPLOYEES: Load all users for the search dropdown
      const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
      let empData = [];
      if (empRes?.users && Array.isArray(empRes.users)) empData = empRes.users;
      else if (Array.isArray(empRes)) empData = empRes;
      setEmployees(empData); 

      // 2. Load Interview Records based on Role
      if (isManager) {
        try {
          const intRes = await getAllExitInterviews();
          setInterviews(intRes?.data || intRes || []);
        } catch { setInterviews([]); }
      } else {
        const res = await getExitInterviewByEmployee(auth.id);
        const data = res?.data || res;
        setInterviews(Array.isArray(data) ? data : data ? [data] : []);
      }
    } catch (err) { 
      toast.error("Sync Failure");
      setInterviews([]);
    } finally { 
      setLoading(false); 
    }
  }, [isManager, auth.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Click Outside logic for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Selection Search Logic (Matches your reference)
  const searchableEmployees = useMemo(() => {
    const query = empSearchQuery.toLowerCase().trim();
    if (!query || formData.employeeId) return [];

    return employees.filter(emp => {
      const name = (emp.username || emp.name || "").toLowerCase();
      const id = (emp.userId || emp.id || "").toString();
      return name.includes(query) || id.includes(query);
    }).slice(0, 5);
  }, [employees, empSearchQuery, formData.employeeId]);

  // Table filtering logic
  const filteredInterviews = useMemo(() => {
    return interviews.filter(item => {
      const emp = employees.find(e => e.userId === item.employeeId);
      const empName = emp?.username || emp?.name || "Unknown";
      return empName.toLowerCase().includes(tableSearch.toLowerCase()) || 
             item.reasonForLeaving?.toLowerCase().includes(tableSearch.toLowerCase());
    });
  }, [interviews, employees, tableSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast.error("Select employee first");
    
    const tid = toast.loading("Processing...");
    try {
      await scheduleExitInterview({
        employeeId: Number(formData.employeeId),
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        reasonForLeaving: formData.reasonForLeaving
      });
      toast.success("Scheduled Successfully", { id: tid });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch { toast.error("Action Failed", { id: tid }); }
  };

  const resetForm = () => {
    setFormData({ employeeId: "", scheduledDate: "", reasonForLeaving: "" });
    setEmpSearchQuery("");
  };

  const getSelectedEmployeeName = () => {
    const emp = employees.find(e => e.userId == formData.employeeId);
    return emp?.username || emp?.name || 'Selected User';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-slate-900 transition-all duration-300">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <LogOut size={22} className="text-rose-600" /> Offboarding Registry
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
            {isManager ? "Administrative Oversight" : "Personal Exit Status"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManager && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input type="text" placeholder="Filter Registry..." onChange={(e) => setTableSearch(e.target.value)} className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-44 outline-none focus:ring-2 focus:ring-rose-50 transition-all" />
              </div>
              <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                <Plus size={14} strokeWidth={3} /> Schedule Exit
              </button>
            </>
          )}
        </div>
      </div>

      {/* REGISTRY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-auto">Personnel Info</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-64 text-center">Reason</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Date</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-28">Status</th>
              {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-24">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInterviews.map((item) => {
              const emp = employees.find(e => e.userId === item.employeeId);
              const name = emp?.username || (item.employeeId === auth.id ? auth.name : "Unknown");
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4 flex items-center gap-3">
                    <div className="h-8 w-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 border border-rose-100 font-black text-[10px]">{name?.charAt(0)}</div>
                    <div>
                      <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-0.5">{name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: #{item.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-[11px] font-medium text-slate-600 italic truncate max-w-[200px]">"{item.reasonForLeaving}"</td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-[10px] font-black text-slate-700">{new Date(item.scheduledDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md border font-black uppercase text-[8px] ${item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{item.status || 'Scheduled'}</span>
                  </td>
                  {isManager && (
                    <td className="px-5 py-4 text-right">
                      <button onClick={async () => { if(window.confirm("Purge Record?")) { await deleteExitInterview(item.id); fetchData(); } }} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={15}/></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-rose-500" /></div>}
        {!loading && filteredInterviews.length === 0 && <div className="p-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Inventory Empty</div>}
      </div>

      {/* SEARCH-TO-SELECT MODAL */}
      <AnimatePresence>
        {showModal && isManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
               <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center rounded-t-3xl">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><UserPlus size={16} className="text-rose-600" /> Schedule Interview</h3>
                  <button onClick={() => { setShowModal(false); resetForm(); }}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* SELECTION SEARCH - MIRRORED FROM YOUR REFERENCE */}
                  <div className="space-y-1 relative" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Target Personnel</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search Name or ID..." 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-rose-50 transition-all" 
                        value={empSearchQuery} 
                        onFocus={() => setShowDropdown(true)}
                        onChange={(e) => { 
                          setEmpSearchQuery(e.target.value); 
                          setFormData(prev => ({...prev, employeeId: ""}));
                          setShowDropdown(true); 
                        }} 
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    </div>

                    <AnimatePresence>
                      {showDropdown && searchableEmployees.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[120] w-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                          {searchableEmployees.map(emp => (
                            <button key={emp.userId} type="button" onClick={() => { 
                              setFormData({...formData, employeeId: emp.userId}); 
                              setEmpSearchQuery(emp.username || emp.name); 
                              setShowDropdown(false); 
                            }} className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center justify-between border-b last:border-0 border-slate-50 transition-colors">
                              <div className="flex flex-col text-left">
                                <span className="text-[11px] font-black text-slate-700 uppercase">{emp.username || emp.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">ID: #{emp.userId}</span>
                              </div>
                              <ChevronRight size={12} className="text-slate-300" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {formData.employeeId && (
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 font-bold"/>
                        <div>
                           <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Personnel Locked: #{formData.employeeId}</p>
                           <p className="text-[8px] font-bold text-emerald-600 uppercase">{getSelectedEmployeeName()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Timeframe</label>
                    <input required type="datetime-local" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-rose-50" value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Reason</label>
                    <textarea required rows="3" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none resize-none focus:ring-2 focus:ring-rose-50" value={formData.reasonForLeaving} onChange={e => setFormData({...formData, reasonForLeaving: e.target.value})} />
                  </div>

                  <button type="submit" disabled={!formData.employeeId} className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 disabled:opacity-30 transition-all">
                    Initiate Schedule
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}