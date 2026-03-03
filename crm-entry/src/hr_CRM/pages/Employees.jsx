
import { useEffect, useState, useMemo } from "react";
import { 
  Eye, UserPlus, ShieldCheck, X, Loader2, Search, 
  ChevronLeft, ChevronRight, Smartphone, 
  User, Mail, Building, Shield, Briefcase, Calendar, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// API Imports
import { getAdminUsers } from "../../api/admin/users.api";
import { getDomains } from "../../api/admin/domains.api";
import { getAdminRoles } from "../../api/admin/roles.api";
import { createUser } from "../../api/users/users.api";

// Helper to parse JWT (In case you need to hide/show buttons based on roles)
const getPermissionsFromToken = () => {
  const token = localStorage.getItem("token"); // or your cookie key
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    return JSON.parse(window.atob(base64Url));
  } catch (e) {
    return null;
  }
};

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [roles, setRoles] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Track user role from JWT
  const userPermissions = useMemo(() => getPermissionsFromToken(), []);

  const [form, setForm] = useState({
    username: "", email: "", domainCode: "", temporaryPassword: "",
    roleCodes: [],
    profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // We use a Promise.allSettled so that if one fails (like roles for a non-admin), 
      // the others (like the user list) still load.
      const results = await Promise.allSettled([
        getAdminUsers({ page: 1, pageSize: 100 }),
        getDomains(),
        getAdminRoles()
      ]);

      const [uRes, dRes, rRes] = results;

      if (uRes.status === "fulfilled") {
        setUsers(uRes.value?.users ?? uRes.value ?? []);
      } else {
        toast.error("Permission denied to fetch users");
      }

      if (dRes.status === "fulfilled") setDomains(dRes.value ?? []);
      if (rRes.status === "fulfilled") setRoles(rRes.value ?? []);

    } catch (err) {
      toast.error("Critical Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createUser(form);
      toast.success("Employee created successfully");
      setCreateOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating employee");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => setForm({
    username: "", email: "", domainCode: "", temporaryPassword: "",
    roleCodes: [], profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
  });

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col bg-slate-50/50">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <ShieldCheck size={22} className="text-indigo-600" /> EMPLOYEES
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Logged in as: <span className="text-indigo-500">{userPermissions?.sub || 'User'}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text" placeholder="Search name/email..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 w-60 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          {/* Hide Add button if user is not an Admin (Example logic) */}
          <button 
            onClick={() => setCreateOpen(true)} 
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="p-6 flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                    <th className="px-8 py-4">ID & User</th>
                    <th className="px-8 py-4">Contact & Email</th>
                    <th className="px-8 py-4">Branch/Dept</th>
                    <th className="px-8 py-4 text-center">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                {loading ? (
                    <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="animate-spin inline text-indigo-500" /></td></tr>
                ) : currentItems.length === 0 ? (
                    <tr><td colSpan="4" className="py-20 text-center text-slate-400 font-bold text-xs uppercase">No employees found</td></tr>
                ) : currentItems.map((u) => (
                    <tr key={u.userId} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="px-8 py-3">
                        <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center font-black text-indigo-600 text-[10px]">#{u.userId}</div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700">{u.profile?.firstName} {u.profile?.lastName}</span>
                            <span className="text-[10px] font-bold text-slate-400">@{u.username}</span>
                        </div>
                        </div>
                    </td>
                    <td className="px-8 py-3">
                        <p className="text-[11px] font-bold text-slate-800 tracking-tight">{u.email}</p>
                        <p className="text-[9px] text-slate-400 font-bold italic">{u.profile?.mobileNumber || u.mobileNumber || 'No Contact'}</p>
                    </td>
                    <td className="px-8 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-tighter">
                        {u.domainName || u.department || 'Main Branch'}
                    </td>
                    <td className="px-8 py-3 text-center">
                        <button onClick={() => setSelectedUser(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Eye size={16}/>
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="px-8 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 uppercase">Page {currentPage} of {totalPages || 1}</span>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="p-1 disabled:opacity-20"><ChevronLeft size={16}/></button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i+1)} className={`h-6 w-6 rounded text-[9px] font-black transition-all ${currentPage === i+1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}>{i+1}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p+1)} className="p-1 disabled:opacity-20"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* ... MODALS (Create/View) stay exactly as you had them, just Ensure form values map correctly ... */}
      
    </div>
  );
}

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
  </div>
);

const MiniInfo = ({ label, value, icon }) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5 text-indigo-400 bg-indigo-50 p-1 rounded-md">{icon}</div>
    <div className="overflow-hidden">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-0.5">{label}</p>
      <p className="text-[11px] font-bold text-slate-700 truncate">{value || "—"}</p>
    </div>
  </div>
);