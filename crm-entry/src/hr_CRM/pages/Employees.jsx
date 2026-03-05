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

  // Pagination State - 6 items per page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [form, setForm] = useState({
    username: "", email: "", domainCode: "", temporaryPassword: "",
    roleCodes: [], profile: { firstName: "", lastName: "", mobileNumber: "", department: "", designation: "" },
  });

  /* =======================
     FETCH USERS
     ======================= */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page: 1, pageSize: 100 });
      const baseUsers = res?.users || [];
      setUsers(baseUsers);
      hydrateContacts(baseUsers, 1);
    } catch { 
      toast.error("Sync Error"); 
    } finally { 
      setLoading(false); 
    }
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
  }, []);

  useEffect(() => {
    if (users.length > 0) hydrateContacts(users, currentPage);
  }, [currentPage]);


  /* =======================
     LOAD DOMAINS & ROLES
     ======================= */
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [domainsData, rolesData] = await Promise.all([
          getDomains(),
          getAdminRoles(),
        ]);
        setDomains(Array.isArray(domainsData) ? domainsData : (domainsData?.data || []));
        setRoles(Array.isArray(rolesData) ? rolesData : (rolesData?.data || []));
      } catch (err) {
        console.error("Reference data error:", err);
        setDomains([]);
        setRoles([]);
      }
    };
    loadReferenceData();
  }, []);

  /* =======================
     DOMAIN CHANGE
     ======================= */
  const handleDomainChange = (value) => {
    setForm((prev) => ({
      ...prev,
      domainCode: value,
      profile: { ...prev.profile, department: value },
    }));
  };

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
      roleCodes: [], profile: { firstName: "", lastName: "", mobileNumber: "", department: "", designation: "" },
    });
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.userId?.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />
      
      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-600" /> Personnel
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Employee Directory</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <button 
            onClick={() => {
              setForm({
                username: "", email: "", domainCode: "", temporaryPassword: "",
                roleCodes: [], profile: { firstName: "", lastName: "", mobileNumber: "", department: "", designation: "" },
              });
              setCreateOpen(true);
            }} 
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all"
          >
            + Add New
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee Info</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Contact & Email</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Department</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-1.5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 text-[11px] font-bold uppercase border border-indigo-100">
                          {u.username?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-0.5">{u.username}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">UID: {u.userId}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-5 py-1.5 text-center">
                      <p className="text-[11px] font-bold text-slate-600">{u.email}</p>
                      <p className="text-[9px] font-black text-indigo-500 uppercase mt-0.5">{u.profile?.mobileNumber || u.mobileNumber || "---"}</p>
                  </td>
                  <td className="px-5 py-1.5 text-center">
                    <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-md border bg-slate-50 text-slate-500 border-slate-200">
                      {u.department || u.profile?.designation || "Unassigned"}
                    </span>
                  </td>
                  <td className="px-5 py-1.5 text-center">
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${
                        u.isActive !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {u.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                  </td>
                  <td className="px-5 py-1.5 text-right">
                    <button onClick={() => setSelectedUser(u)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                      <Eye size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* COMPACT PAGINATION */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Showing {currentData.length} of {filteredUsers.length}</p>
            <div className="flex items-center gap-1.5">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-7 w-7 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{i + 1}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT MODAL SYSTEM */}
      <AnimatePresence>
        {(createOpen || selectedUser) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            >
               {/* MODAL HEADER */}
               <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                      {createOpen ? "New Employee" : "Personnel Record"}
                    </h3>
                  </div>
                  <button type="button" onClick={closeModal} className="p-1.5 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
               </div>

               {/* MODAL BODY */}
               <div className="p-4 overflow-y-auto">
                  {createOpen ? (
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-3 gap-y-2" autoComplete="off">
                      <InputField label="Username" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} icon={<User size={12}/>} autoComplete="off" />
                      <InputField label="Email Address" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} icon={<Mail size={12}/>} autoComplete="off" />
                      <InputField label="Mobile Number" required value={form.profile.mobileNumber} onChange={e => {
                        const val = e.target.value.replace(/\D/g, "");
                        if(val.length <= 10) setForm({...form, profile: {...form.profile, mobileNumber: val}});
                      }} icon={<Phone size={12}/>} autoComplete="off" />
                      <InputField label="Designation" value={form.profile.designation} onChange={e => setForm({...form, profile: {...form.profile, designation: e.target.value}})} icon={<Briefcase size={12}/>} autoComplete="off" />
                      <InputField label="First Name" value={form.profile.firstName} onChange={e => setForm({...form, profile: {...form.profile, firstName: e.target.value}})} autoComplete="off" />
                      <InputField label="Last Name" value={form.profile.lastName} onChange={e => setForm({...form, profile: {...form.profile, lastName: e.target.value}})} autoComplete="off" />
                      
                      {/* DOMAIN DROP DOWN */}
                      <div className="col-span-2 space-y-0.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">System Domain</label>
                        <select 
                          required
                          value={form.domainCode}
                          onChange={e => handleDomainChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300" 
                        >
                          <option value="">Select Domain...</option>
                          {domains.map(d => <option key={d.domainId || d.domainCode} value={d.domainCode}>{d.domainName}</option>)}
                        </select>
                      </div>

                      <div className="col-span-2 space-y-0.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Assign Security Roles</label>
                        <div className="flex flex-wrap gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl max-h-16 overflow-y-auto">
                          {roles.map(r => (
                            <label key={r.roleCode} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100 cursor-pointer hover:border-indigo-200 transition-all">
                              <input type="checkbox" checked={form.roleCodes.includes(r.roleCode)} onChange={() => toggleRole(r.roleCode)} className="accent-indigo-600 w-2.5 h-2.5"/>
                              {r.roleName}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-2 mt-0.5">
                         <InputField label="Temp Password" type="password" required value={form.temporaryPassword} onChange={e => setForm({...form, temporaryPassword: e.target.value})} icon={<Lock size={12}/>} autoComplete="new-password" />
                      </div>

                      <div className="col-span-2 pt-2 flex justify-end gap-2 mt-1 border-t border-slate-50">
                        <button type="button" onClick={closeModal} className="px-5 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all">
                          {submitting ? "Processing..." : "Register"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* VIEW MODE - COMPACT GRID */
                    <div className="grid grid-cols-2 gap-2.5">
                       <DetailCard label="System ID" value={selectedUser?.userId} icon={<Fingerprint size={12}/>}/>
                       <DetailCard label="Username" value={selectedUser?.username} icon={<User size={12}/>}/>
                       <DetailCard label="Email Access" value={selectedUser?.email} icon={<Mail size={12}/>}/>
                       <DetailCard label="Contact" value={selectedUser?.profile?.mobileNumber || selectedUser?.mobileNumber || "---"} icon={<Phone size={12}/>}/>
                       <DetailCard label="First Name" value={selectedUser?.profile?.firstName || "---"} />
                       <DetailCard label="Last Name" value={selectedUser?.profile?.lastName || "---"} />
                       <DetailCard label="Department" value={selectedUser?.domainCode || "Corporate"} icon={<Globe size={12}/>}/>
                       <DetailCard label="Designation" value={selectedUser?.profile?.designation || selectedUser?.designation || "Staff"} icon={<Briefcase size={12}/>}/>

                       <div className="col-span-2 pt-2 flex justify-end mt-1">
                          <button type="button" onClick={closeModal} className="px-6 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:bg-indigo-600 transition-all tracking-widest">
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

/* HELPER COMPONENTS */
const InputField = ({ label, icon, ...props }) => (
  <div className="space-y-0.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input 
        {...props} 
        className={`w-full ${icon ? 'pl-8' : 'px-2.5'} py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all`} 
      />
    </div>
  </div>
);

const DetailCard = ({ label, value, icon }) => (
  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-indigo-100 transition-all">
    <div className="flex items-center gap-1.5 mb-0.5">
      {icon && <span className="text-indigo-400 group-hover:text-indigo-600 transition-colors">{icon}</span>}
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate pl-0.5">{value || '---'}</p>
  </div>
);

const Lock = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);