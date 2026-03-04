import { useEffect, useState } from "react";
import { 
  Plus, Search, ShieldCheck, User, Building, 
  Eye, Loader2, X, Phone, Briefcase, Mail,
  ChevronRight, ChevronLeft, Fingerprint, Globe, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// API IMPORTS
import { getAdminUsers } from "../../api/admin/users.api";
import { getDomains } from "../../api/admin/domains.api";
import { getAdminRoles } from "../../api/admin/roles.api";
import { createUser, getUserById } from "../../api/users/users.api";

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [form, setForm] = useState({
    username: "", email: "", domainCode: "", temporaryPassword: "",
    roleCodes: [], profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page: 1, pageSize: 100 });
      const baseUsers = res?.users || [];
      setUsers(baseUsers);
      hydrateContacts(baseUsers, 1);
    } catch { toast.error("Sync Error"); }
    finally { setLoading(false); }
  };

  const hydrateContacts = async (allUsers, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const pageUsers = allUsers.slice(startIndex, startIndex + itemsPerPage);

    const hydrationPromises = pageUsers.map(async (u) => {
      if (!u.profile?.mobileNumber && !u.mobileNumber) {
        try {
          const detail = await getUserById(u.userId);
          return { ...u, ...detail };
        } catch { return u; }
      }
      return u;
    });

    const hydratedResults = await Promise.all(hydrationPromises);
    setUsers(prev => {
      const newUsers = [...prev];
      hydratedResults.forEach(updated => {
        const index = newUsers.findIndex(n => n.userId === updated.userId);
        if (index !== -1) newUsers[index] = updated;
      });
      return newUsers;
    });
  };

  useEffect(() => {
    loadData();
    getDomains().then(setDomains);
    getAdminRoles().then(setRoles);
  }, []);

  useEffect(() => {
    if (users.length > 0) hydrateContacts(users, currentPage);
  }, [currentPage]);

  const toggleRole = (roleCode) => {
    setForm(prev => ({
      ...prev,
      roleCodes: prev.roleCodes.includes(roleCode)
        ? prev.roleCodes.filter(r => r !== roleCode)
        : [...prev.roleCodes, roleCode],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createUser(form);
      toast.success("Employee Created");
      closeModal();
      loadData();
    } catch { toast.error("Creation Failed"); }
    finally { setSubmitting(false); }
  };

  const closeModal = () => {
    setCreateOpen(false);
    setSelectedUser(null);
    setForm({
      username: "", email: "", domainCode: "", temporaryPassword: "",
      roleCodes: [], profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
    });
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.userId?.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col bg-white font-sans overflow-hidden">
      <Toaster position="top-right" />
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
            <ShieldCheck size={22} className="text-indigo-600" /> Personnel
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Employee Directory</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input 
              type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <button onClick={() => setCreateOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
            + Add Employee
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Info</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Contact & Email</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Department</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentData.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold uppercase border border-indigo-100">{u.username?.charAt(0)}</div>
                           <div>
                              <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1">{u.username}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">UID: {u.userId}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <p className="text-[11px] font-bold text-slate-600">{u.email}</p>
                         <p className="text-[9px] font-black text-indigo-500 uppercase">{u.profile?.mobileNumber || u.mobileNumber || "---"}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-md border bg-slate-50 text-slate-500 border-slate-100">
                          {u.department || u.profile?.designation || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${u.isActive !== false ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <span className="text-[9px] font-black text-slate-600 uppercase">{u.isActive !== false ? 'Active' : 'Disabled'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelectedUser(u)} className="p-2 hover:bg-white rounded-lg text-slate-300 hover:text-indigo-600 border border-transparent hover:border-slate-100 transition-all">
                          <Eye size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between px-2 py-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {currentData.length} of {filteredUsers.length}</p>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-8 w-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400'}`}>{i + 1}</button>
                  ))}
                </div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SHARED MODAL SYSTEM (Exactly max-w-4xl) */}
      <AnimatePresence>
        {(createOpen || selectedUser) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
               
               {/* MODAL HEADER */}
               <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                      {createOpen ? "New Employee Registration" : "Personnel Record Details"}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                      {createOpen ? "Fill official details to create account" : `Viewing Profile: ${selectedUser?.username}`}
                    </p>
                  </div>
                  <button onClick={closeModal} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
               </div>

               {/* MODAL BODY (Unified 3-Column Grid) */}
               <div className="p-10">
                  {createOpen ? (
                    <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-x-6 gap-y-5">
                      <InputField label="Username" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} icon={<User size={12}/>}/>
                      <InputField label="Email Address" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} icon={<Mail size={12}/>}/>
                      <InputField label="Mobile Number" required value={form.profile.mobileNumber} onChange={e => setForm({...form, profile: {...form.profile, mobileNumber: e.target.value}})} icon={<Phone size={12}/>}/>
                      <InputField label="First Name" value={form.profile.firstName} onChange={e => setForm({...form, profile: {...form.profile, firstName: e.target.value}})} />
                      <InputField label="Last Name" value={form.profile.lastName} onChange={e => setForm({...form, profile: {...form.profile, lastName: e.target.value}})} />
                      <InputField label="Designation" value={form.profile.designation} onChange={e => setForm({...form, profile: {...form.profile, designation: e.target.value}})} icon={<Briefcase size={12}/>}/>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">System Domain</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50" onChange={e => setForm({...form, domainCode: e.target.value})}>
                          <option value="">Select Domain...</option>
                          {domains.map(d => <option key={d.domainId} value={d.domainCode}>{d.domainName}</option>)}
                        </select>
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Assign Security Roles</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-[46px]">
                          {roles.map(r => (
                            <label key={r.roleCode} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-all">
                              <input type="checkbox" checked={form.roleCodes.includes(r.roleCode)} onChange={() => toggleRole(r.roleCode)} className="accent-indigo-600 w-3 h-3"/>
                              {r.roleName}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-1">
                         <InputField label="Temp Password" type="password" value={form.temporaryPassword} onChange={e => setForm({...form, temporaryPassword: e.target.value})} icon={<Lock size={12}/>}/>
                      </div>

                      <div className="col-span-3 pt-8 flex justify-end gap-3 border-t border-slate-100 mt-4">
                        <button type="button" onClick={closeModal} className="px-8 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-12 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                          {submitting ? "Processing..." : "Register Employee"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* VIEW MODE - CARD STYLE GRID */
                    <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                       <DetailCard label="System ID" value={selectedUser?.userId} icon={<Fingerprint size={14}/>}/>
                       <DetailCard label="Username" value={selectedUser?.username} icon={<User size={14}/>}/>
                       <DetailCard label="Email Access" value={selectedUser?.email} icon={<Mail size={14}/>}/>
                       <DetailCard label="First Name" value={selectedUser?.profile?.firstName || "---"} />
                       <DetailCard label="Last Name" value={selectedUser?.profile?.lastName || "---"} />
                       <DetailCard label="Contact Number" value={selectedUser?.profile?.mobileNumber || selectedUser?.mobileNumber || "---"} icon={<Phone size={14}/>}/>
                       <DetailCard label="Department" value={selectedUser?.domainCode || "Corporate"} icon={<Globe size={14}/>}/>
                       <DetailCard label="Designation" value={selectedUser?.profile?.designation || selectedUser?.designation || "Staff"} icon={<Briefcase size={14}/>}/>
                       <DetailCard label="Account Status" value={selectedUser?.isActive !== false ? "Active" : "Disabled"} icon={<Shield size={14}/>}/>
                       
                       <div className="col-span-3 space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Authorized Security Roles</label>
                          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
                             {selectedUser?.roles?.length > 0 ? selectedUser.roles.map(r => (
                               <span key={r.roleCode} className="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-indigo-100 text-indigo-600 uppercase tracking-tighter">
                                 {r.roleName}
                               </span>
                             )) : <span className="text-[10px] font-bold text-slate-400 italic">No Roles Found</span>}
                          </div>
                       </div>

                       <div className="col-span-3 pt-8 flex justify-end border-t border-slate-100 mt-4">
                          <button onClick={closeModal} className="px-12 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl hover:bg-indigo-600 transition-all tracking-widest">
                             Close Record
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* HELPER COMPONENTS FOR PERFECT FIT */
const InputField = ({ label, icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>}
      <input 
        {...props} 
        className={`w-full ${icon ? 'pl-11' : 'px-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all`} 
      />
    </div>
  </div>
);

const DetailCard = ({ label, value, icon }) => (
  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-indigo-100 transition-all">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className="text-indigo-400 group-hover:text-indigo-600 transition-colors">{icon}</span>}
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate">{value || '---'}</p>
  </div>
);

const Lock = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);