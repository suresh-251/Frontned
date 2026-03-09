// import { useEffect, useState } from "react";
// import { 
//   History, User, Search, Calendar, 
//   TrendingUp, Loader2, ChevronRight, LayoutDashboard
// } from "lucide-react";
// import { Toaster, toast } from "react-hot-toast";

// // API IMPORTS
// import { getUserOvertimeRecords, getWeeklyOvertimeSummary } from "../../api/overtimeRecord.api";
// import { getAdminUsers } from "../../../api/admin/users.api";

// export default function OvertimeRecord() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [records, setRecords] = useState([]);
//   const [weeklySummary, setWeeklySummary] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [detailsLoading, setDetailsLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     const loadUsers = async () => {
//       setLoading(true);
//       try {
//         const res = await getAdminUsers({ page: 1, pageSize: 100 });
//         setUsers(res?.users || []);
//       } catch { toast.error("Sync Error"); }
//       finally { setLoading(false); }
//     };
//     loadUsers();
//   }, []);

//   const handleUserSelect = async (user) => {
//     setSelectedUser(user);
//     setDetailsLoading(true);
//     try {
//       const [recData, weeklyData] = await Promise.all([
//         getUserOvertimeRecords(user.userId),
//         getWeeklyOvertimeSummary(user.userId)
//       ]);
//       setRecords(recData || []);
//       setWeeklySummary(weeklyData);
//     } catch {
//       toast.error("Fetch Failed");
//       setRecords([]);
//     } finally { setDetailsLoading(false); }
//   };

//   const filteredUsers = users.filter(u => 
//     (u.name || u.username).toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     /* THE FIX: h-[500px] ensures the box ends exactly near the Logout button.
//        overflow-hidden prevents the outer page from scrolling.
//     */
//     <div className="flex h-[500px] w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans mt-1">
//       <Toaster position="top-right" />

//       {/* SIDEBAR: PERSONNEL (Internal Scroll) */}
//       <div className="w-64 border-r border-slate-100 flex flex-col shrink-0 bg-white">
//         <div className="p-3 border-b border-slate-50">
//           <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 px-1">Personnel</h2>
//           <div className="relative px-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
//             <input 
//               type="text" placeholder="Search..."
//               className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-8 py-1.5 outline-none focus:ring-1 focus:ring-indigo-100"
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//         </div>

//         {/* Scrollable list: Limits items to about 6-7 visible at once */}
//         <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
//           {loading ? (
//             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-200" size={16}/></div>
//           ) : (
//             filteredUsers.map(u => (
//               <button
//                 key={u.userId}
//                 onClick={() => handleUserSelect(u)}
//                 className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
//                   selectedUser?.userId === u.userId ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'
//                 }`}
//               >
//                 <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
//                    selectedUser?.userId === u.userId ? 'bg-indigo-500' : 'bg-slate-100 text-slate-400'
//                 }`}>
//                   <User size={13} />
//                 </div>
//                 <div className="text-left overflow-hidden">
//                   <p className="text-[10px] font-black truncate uppercase leading-tight">{u.name || u.username}</p>
//                   <p className={`text-[8px] font-bold ${selectedUser?.userId === u.userId ? 'text-indigo-200' : 'text-slate-400'}`}>ID: {u.userId}</p>
//                 </div>
//               </button>
//             ))
//           )}
//         </div>
//       </div>

//       {/* MAIN CONTENT: RECORDS (Internal Scroll) */}
//       <div className="flex-1 flex flex-col min-w-0 bg-white">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
//                 <History size={18} />
//             </div>
//             <div>
//                 <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none">Overtime Records</h2>
//                 {selectedUser && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1.5">Ref: {selectedUser.name}</p>}
//             </div>
//           </div>

//           {selectedUser && (
//             <div className="text-right">
//                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Weekly</span>
//                <span className="text-xs font-black text-indigo-600 uppercase leading-none">{weeklySummary?.totalHours || 0}h</span>
//             </div>
//           )}
//         </div>

//         <div className="flex-1 overflow-auto bg-slate-50/20 p-4">
//           {selectedUser ? (
//             detailsLoading ? (
//               <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
//             ) : (
//               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
//                 <table className="w-full text-left">
//                   <thead className="bg-slate-50 border-b border-slate-100">
//                     <tr>
//                       <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider">Date</th>
//                       <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center">Interval</th>
//                       <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Dur.</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-50">
//                     {records.length > 0 ? (
//                       records.map((rec, idx) => (
//                         <tr key={idx} className="hover:bg-slate-50 transition-colors">
//                           <td className="px-4 py-2 text-[10px] font-bold text-slate-600 italic">
//                             {new Date(rec.startTime).toLocaleDateString()}
//                           </td>
//                           <td className="px-4 py-2 text-center">
//                              <div className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400">
//                                 <span>{new Date(rec.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
//                                 <ChevronRight size={8} />
//                                 <span>{new Date(rec.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
//                              </div>
//                           </td>
//                           <td className="px-4 py-2 text-right text-[10px] font-black text-indigo-700">
//                              {rec.hoursWorked || 0}h
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan="3" className="py-20 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest italic">No Records Found</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             )
//           ) : (
//             <div className="h-full flex flex-col items-center justify-center p-10 opacity-30">
//                <LayoutDashboard size={32} className="text-slate-300 mb-2" />
//                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Record</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }





//THEME CHNAGE 







import { useEffect, useState } from "react";
import { 
  History, User, Search, Calendar, 
  TrendingUp, Loader2, ChevronRight, LayoutDashboard
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

// API IMPORTS
import { getUserOvertimeRecords, getWeeklyOvertimeSummary } from "../../api/overtimeRecord.api";
import { getAdminUsers } from "../../../api/admin/users.api";

export default function OvertimeRecord() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await getAdminUsers({ page: 1, pageSize: 100 });
        setUsers(res?.users || []);
      } catch { toast.error("Sync Error"); }
      finally { setLoading(false); }
    };
    loadUsers();
  }, []);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    try {
      const [recData, weeklyData] = await Promise.all([
        getUserOvertimeRecords(user.userId),
        getWeeklyOvertimeSummary(user.userId)
      ]);
      setRecords(recData || []);
      setWeeklySummary(weeklyData);
    } catch {
      toast.error("Fetch Failed");
      setRecords([]);
    } finally { setDetailsLoading(false); }
  };

  const filteredUsers = users.filter(u => 
    (u.name || u.username).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[500px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans mt-1 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* SIDEBAR: PERSONNEL */}
      <div className="w-64 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
        <div className="p-3 border-b border-[var(--border-color)]">
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 px-1">Personnel</h2>
          <div className="relative px-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input 
              type="text" placeholder="Search..."
              className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg pl-8 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)] transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={16}/></div>
          ) : (
            filteredUsers.map(u => (
              <button
                key={u.userId}
                onClick={() => handleUserSelect(u)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  selectedUser?.userId === u.userId 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-indigo-500/5 text-[var(--text-main)]'
                }`}
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                   selectedUser?.userId === u.userId ? 'bg-indigo-500' : 'bg-[var(--bg-body)] text-slate-400'
                }`}>
                  <User size={13} />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-black truncate uppercase leading-tight">{u.name || u.username}</p>
                  <p className={`text-[8px] font-bold ${selectedUser?.userId === u.userId ? 'text-indigo-200' : 'text-slate-500'}`}>ID: {u.userId}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT: RECORDS */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                <History size={18} />
            </div>
            <div>
                <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight leading-none">Overtime Records</h2>
                {selectedUser && <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1.5 opacity-70">Ref: {selectedUser.name}</p>}
            </div>
          </div>

          {selectedUser && (
            <div className="text-right">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-1 opacity-70">Weekly</span>
               <span className="text-xs font-black text-indigo-500 uppercase leading-none">{weeklySummary?.totalHours || 0}h</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-[var(--bg-body)]/20 p-4 custom-scrollbar">
          {selectedUser ? (
            detailsLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm transition-colors">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center">Interval</th>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Dur.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/30">
                    {records.length > 0 ? (
                      records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-indigo-500/[0.02] transition-colors">
                          <td className="px-4 py-2 text-[10px] font-bold text-[var(--text-main)] opacity-80 italic">
                            {new Date(rec.startTime).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-center">
                             <div className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500">
                                <span>{new Date(rec.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <ChevronRight size={8} className="opacity-50" />
                                <span>{new Date(rec.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                          </td>
                          <td className="px-4 py-2 text-right text-[10px] font-black text-indigo-500">
                             {rec.hoursWorked || 0}h
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-20 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">No Records Found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 opacity-30">
               <LayoutDashboard size={32} className="text-slate-400 mb-2" />
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Record</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}