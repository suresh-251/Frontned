// import { useEffect, useState } from "react";
// import { getAdminUsers } from "../../api/admin/users.api";
// import { getDomains } from "../../api/admin/domains.api";
// import { getAdminRoles } from "../../api/admin/roles.api";
// import { createUser } from "../../api/users/users.api";

// /* ========================= EMPLOYEES TABLE ========================= */
// const EmployeesTable = ({ users = [], onView }) => {
//   return (
//     <div className="relative h-full rounded-2xl border border-indigo-100 shadow-xl bg-white overflow-auto">
//       <table className="min-w-full text-sm">
//         <thead className="sticky top-0 z-10">
//           <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider">
//             <th className="px-6 py-4 text-left">ID</th>
//             <th className="px-6 py-4 text-left">Username</th>
//             <th className="px-6 py-4 text-left">Email</th>
//             <th className="px-6 py-4 text-left">Department</th>
//             <th className="px-6 py-4 text-center">Actions</th>
//           </tr>
//         </thead>

//         <tbody className="divide-y divide-gray-100">
//           {users.map((u, index) => (
//             <tr
//               key={u.userId}
//               className={`hover:bg-indigo-50 transition ${
//                 index % 2 === 0 ? "bg-slate-50" : "bg-white"
//               }`}
//             >
//               <td className="px-6 py-4">{u.userId}</td>
//               <td className="px-6 py-4 font-semibold">{u.username}</td>
//               <td className="px-6 py-4">{u.email}</td>
//               <td className="px-6 py-4">{u.department || "-"}</td>
//               <td className="px-6 py-4 text-center">
//                 <button
//                   onClick={() => onView(u)}
//                   className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-indigo-700 transition"
//                 >
//                   View Profile
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {users.length === 0 && (
//         <div className="text-center py-10 text-gray-500">
//           No employees found
//         </div>
//       )}
//     </div>
//   );
// };

// /* ========================= MAIN COMPONENT ========================= */
// export default function Employees() {
//   const [users, setUsers] = useState([]);
//   const [domains, setDomains] = useState([]);
//   const [roles, setRoles] = useState([]);
//   const [createOpen, setCreateOpen] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [submitting, setSubmitting] = useState(false);

//   const [form, setForm] = useState({
//     username: "",
//     email: "",
//     domainCode: "",
//     temporaryPassword: "",
//     roleCodes: [],
//     profile: {
//       firstName: "",
//       lastName: "",
//       mobileNumber: "",
//       designation: "",
//     },
//   });

//   /* ================= LOAD USERS ================= */
//   const loadUsers = async () => {
//     try {
//       const res = await getAdminUsers({ page: 1, pageSize: 25 });
//       setUsers(res?.users ?? []);
//     } catch {
//       setUsers([]);
//     }
//   };

//   useEffect(() => {
//     loadUsers();
//     getDomains().then(setDomains);
//     getAdminRoles().then(setRoles);
//   }, []);

//   /* ================= ROLE TOGGLE ================= */
//   const toggleRole = (roleCode) => {
//     setForm((prev) => ({
//       ...prev,
//       roleCodes: prev.roleCodes.includes(roleCode)
//         ? prev.roleCodes.filter((r) => r !== roleCode)
//         : [...prev.roleCodes, roleCode],
//     }));
//   };

//   /* ================= SUBMIT ================= */
//   const handleSubmit = async () => {
//     if (!form.username || !form.email || !form.profile.mobileNumber) {
//       alert("Username, Email & Mobile required");
//       return;
//     }

//     try {
//       setSubmitting(true);
//       await createUser(form);
//       closeModal();
//       loadUsers();
//     } catch {
//       alert("Failed to create employee");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const closeModal = () => {
//     setCreateOpen(false);
//     setForm({
//       username: "",
//       email: "",
//       domainCode: "",
//       temporaryPassword: "",
//       roleCodes: [],
//       profile: {
//         firstName: "",
//         lastName: "",
//         mobileNumber: "",
//         designation: "",
//       },
//     });
//   };

//   return (
//     <div className="flex flex-col h-full overflow-hidden">
//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
//           Employees Management
//         </h2>

//         <button
//           onClick={() => setCreateOpen(true)}
//           className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:opacity-90 transition"
//         >
//           + Add Employee
//         </button>
//       </div>

//       {/* TABLE */}
//       <div className="flex-1 min-h-0">
//         <EmployeesTable users={users} onView={setSelectedUser} />
//       </div>

//       {/* ================= VIEW PROFILE MODAL ================= */}
//       {selectedUser && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center">
//     {/* Background */}
//     <div
//       className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//       onClick={() => setSelectedUser(null)}
//     />

//     {/* Modal Box */}
//     <div className="relative bg-white w-full max-w-4xl mx-4 rounded-2xl shadow-2xl border border-indigo-200 p-8 max-h-[90vh] overflow-y-auto">
      
//       <h3 className="text-2xl font-bold text-indigo-700 mb-6">
//         Employee Profile
//       </h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">

//         <ProfileItem label="User ID" value={selectedUser.userId} />
//         <ProfileItem label="Full Name" value={selectedUser.name} />
//         <ProfileItem label="Username" value={selectedUser.username} />
//         <ProfileItem label="Email" value={selectedUser.email} />
//         <ProfileItem label="Department" value={selectedUser.department} />
//         <ProfileItem label="Designation" value={selectedUser.designation} />
//         <ProfileItem label="Account Status" value={selectedUser.accountStatus} />
//         <ProfileItem label="Manager Name" value={selectedUser.managerName} />
//         <ProfileItem label="Created At" value={selectedUser.createdAt} />
//         <ProfileItem label="Last Activity" value={selectedUser.lastActivityAt} />

//         {/* Roles Section */}
//         <div className="md:col-span-2">
//           <p className="text-gray-500 mb-2">Assigned Roles</p>
//           <div className="flex flex-wrap gap-2">
//             {selectedUser.roles && selectedUser.roles.length > 0 ? (
//               selectedUser.roles.map((role, index) => (
//                 <span
//                   key={index}
//                   className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
//                 >
//                   {role}
//                 </span>
//               ))
//             ) : (
//               <span className="text-gray-400 text-sm">
//                 No roles assigned
//               </span>
//             )}
//           </div>
//         </div>

//       </div>

//       <div className="mt-8 flex justify-end">
//         <button
//           onClick={() => setSelectedUser(null)}
//           className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition"
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   </div>
// )}

//       {/* ================= ADD EMPLOYEE MODAL ================= */}
//       {createOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div
//             className="absolute inset-0 bg-black/30 backdrop-blur-sm"
//             onClick={closeModal}
//           />

//           <div className="relative bg-white w-full max-w-4xl mx-4 rounded-2xl shadow-2xl border border-indigo-200 p-8 max-h-[90vh] overflow-y-auto">
//             <h3 className="text-2xl font-bold text-indigo-700 mb-6">
//               Add New Employee
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//               <Input
//                 placeholder="Username"
//                 value={form.username}
//                 onChange={(e) =>
//                   setForm({ ...form, username: e.target.value })
//                 }
//               />

//               <Input
//                 placeholder="Email"
//                 value={form.email}
//                 onChange={(e) =>
//                   setForm({ ...form, email: e.target.value })
//                 }
//               />

//               <Input
//                 placeholder="First Name"
//                 value={form.profile.firstName}
//                 onChange={(e) =>
//                   setForm({
//                     ...form,
//                     profile: {
//                       ...form.profile,
//                       firstName: e.target.value,
//                     },
//                   })
//                 }
//               />

//               <Input
//                 placeholder="Last Name"
//                 value={form.profile.lastName}
//                 onChange={(e) =>
//                   setForm({
//                     ...form,
//                     profile: {
//                       ...form.profile,
//                       lastName: e.target.value,
//                     },
//                   })
//                 }
//               />

//               <Input
//                 placeholder="Mobile Number"
//                 value={form.profile.mobileNumber}
//                 onChange={(e) =>
//                   setForm({
//                     ...form,
//                     profile: {
//                       ...form.profile,
//                       mobileNumber: e.target.value,
//                     },
//                   })
//                 }
//               />

//               <select
//                 value={form.domainCode}
//                 onChange={(e) =>
//                   setForm({ ...form, domainCode: e.target.value })
//                 }
//                 className="col-span-2 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
//               >
//                 <option value="">Select Domain</option>
//                 {domains?.map((d) => (
//                   <option key={d.domainId} value={d.domainCode}>
//                     {d.domainName}
//                   </option>
//                 ))}
//               </select>

//               <div className="col-span-2">
//                 <p className="text-sm font-semibold mb-2">Assign Roles</p>
//                 <div className="border rounded-xl p-4 max-h-40 overflow-y-auto bg-slate-50">
//                   {roles?.map((r) => (
//                     <label key={r.roleCode} className="flex gap-2 text-sm mb-1">
//                       <input
//                         type="checkbox"
//                         checked={form.roleCodes.includes(r.roleCode)}
//                         onChange={() => toggleRole(r.roleCode)}
//                       />
//                       {r.roleName}
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               <Input
//                 placeholder="Temporary Password"
//                 value={form.temporaryPassword}
//                 onChange={(e) =>
//                   setForm({
//                     ...form,
//                     temporaryPassword: e.target.value,
//                   })
//                 }
//                 className="col-span-2"
//               />
//             </div>

//             <div className="mt-8 flex justify-end gap-3">
//               <button
//                 onClick={handleSubmit}
//                 disabled={submitting}
//                 className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition"
//               >
//                 {submitting ? "Submitting..." : "Add Employee"}
//               </button>

//               <button
//                 onClick={closeModal}
//                 className="bg-gray-200 px-6 py-2.5 rounded-xl hover:bg-gray-300 transition"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ================= REUSABLE INPUT ================= */
// const Input = ({ className = "", ...props }) => (
//   <input
//     {...props}
//     className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none ${className}`}
//   />
// );

// /* ================= PROFILE FIELD ================= */
// const ProfileItem = ({ label, value }) => (
//   <div>
//     <p className="text-gray-500">{label}</p>
//     <p className="font-semibold text-gray-800">{value || "-"}</p>
//   </div>
// );






import { useEffect, useState, useMemo } from "react";
import { 
  Edit2, Eye, Trash2, UserPlus, ShieldCheck, 
  X, Loader2, Search, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Building2, Layers, 
  Lock, Smartphone, User, Mail, Briefcase, Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getAdminUsers } from "../../api/admin/users.api";
import { getAdminRoles } from "../../api/admin/roles.api";
import { getDomains } from "../../api/admin/domains.api";
import { createUser } from "../../api/users/users.api";
import { Button } from "../components/ui/Buttons";
import { Card } from "../components/ui/Cards";

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [domains, setDomains] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [form, setForm] = useState({
    username: "", email: "", domainCode: "", temporaryPassword: "",
    roleCodes: [],
    profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, dRes] = await Promise.all([
        getAdminUsers({ page: 1, pageSize: 100 }),
        getAdminRoles(),
        getDomains()
      ]);
      setUsers(uRes?.users ?? []);
      setRoles(rRes ?? []);
      setDomains(dRes ?? []);
    } catch (error) {
      toast.error("Failed to sync directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.userId.toString().includes(searchTerm)
    );
  }, [users, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleMobileInput = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Allow only numbers
    setForm({ ...form, profile: { ...form.profile, mobileNumber: value } });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mandatory Validations
    if (!form.username || !form.email || !form.domainCode || !form.temporaryPassword || 
        !form.profile.firstName || !form.profile.mobileNumber || form.roleCodes.length === 0) {
      return toast.error("Please fill all mandatory fields and assign a role");
    }

    if (!validateEmail(form.email)) return toast.error("Invalid email format");

    setSubmitting(true);
    const tid = toast.loading("Registering staff...");
    try {
      await createUser(form);
      toast.success("Employee created successfully", { id: tid });
      setCreateOpen(false);
      setForm({
        username: "", email: "", domainCode: "", temporaryPassword: "",
        roleCodes: [],
        profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Creation failed", { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 h-screen flex flex-col overflow-hidden">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-600" /> Employees
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Directory & Access</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search ID or Name..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-indigo-50 w-64 transition-all"
            />
          </div>
          <Button variant="primary" className="py-2 px-4 text-xs font-bold" onClick={() => setCreateOpen(true)}>
            + Add New
          </Button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-20 shadow-sm">
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="animate-spin inline text-indigo-500" /></td></tr>
              ) : currentItems.map((u) => (
                <tr key={u.userId} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 font-black text-indigo-600 text-[10px]">#{u.userId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] border border-slate-200 uppercase text-slate-500">
                        {u.username.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none">{u.username}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700">{u.mobileNumber || "No Mobile"}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{u.designation || "Staff"}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">Active</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedUser(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {currentItems.length} Records</p>
          <div className="flex items-center gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2 disabled:opacity-20"><ChevronsLeft size={16}/></button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                (i + 1 === currentPage || i + 1 === currentPage - 1 || i + 1 === currentPage + 1) && (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-7 w-7 rounded-lg text-[10px] font-black ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{i + 1}</button>
                )
              ))}
            </div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="p-2 disabled:opacity-20"><ChevronsRight size={16}/></button>
          </div>
        </div>
      </div>

      {/* VIEW MODAL - ALL FIELDS */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center text-xl font-black">{selectedUser.username[0].toUpperCase()}</div>
                    <div>
                      <h3 className="text-lg font-black">{selectedUser.username}</h3>
                      <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">User Profile</p>
                    </div>
                 </div>
                 <X size={20} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => setSelectedUser(null)} />
              </div>
              <div className="p-6 grid grid-cols-2 gap-y-5 gap-x-4">
                 <ProfileItem icon={<User size={12}/>} label="Full Name" value={`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`} />
                 <ProfileItem icon={<Smartphone size={12}/>} label="Mobile" value={selectedUser.mobileNumber} />
                 <ProfileItem icon={<Mail size={12}/>} label="Email" value={selectedUser.email} />
                 <ProfileItem icon={<Briefcase size={12}/>} label="Designation" value={selectedUser.designation} />
                 <ProfileItem icon={<Building2 size={12}/>} label="Domain" value={selectedUser.domainName} />
                 <ProfileItem icon={<Layers size={12}/>} label="Roles" value={selectedUser.roles?.join(", ")} />
              </div>
              <div className="p-4 bg-slate-50 flex justify-end">
                <Button variant="secondary" onClick={() => setSelectedUser(null)} className="text-xs font-bold px-6">Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL - ALL FIELDS */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2"><UserPlus size={18} className="text-indigo-600"/> Registration</h3>
                  <X size={18} className="text-slate-400 cursor-pointer" onClick={() => setCreateOpen(false)} />
               </div>
               <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
                  <InputField label="First Name" mandatory value={form.profile.firstName} onChange={(e) => setForm({...form, profile: {...form.profile, firstName: e.target.value}})} />
                  <InputField label="Last Name" value={form.profile.lastName} onChange={(e) => setForm({...form, profile: {...form.profile, lastName: e.target.value}})} />
                  <InputField label="Username" mandatory value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} />
                  <InputField label="Email Address" mandatory type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                  <InputField label="Mobile Number" mandatory value={form.profile.mobileNumber} onChange={handleMobileInput} />
                  <InputField label="Designation" value={form.profile.designation} onChange={(e) => setForm({...form, profile: {...form.profile, designation: e.target.value}})} />
                  
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase mb-1.5 block tracking-widest">Domain *</label>
                      <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={form.domainCode} onChange={(e) => setForm({...form, domainCode: e.target.value})}>
                        <option value="">Select Domain</option>
                        {domains.map(d => <option key={d.domainCode} value={d.domainCode}>{d.domainName}</option>)}
                      </select>
                    </div>
                    <InputField label="Temp Password" mandatory type="password" value={form.temporaryPassword} onChange={(e) => setForm({...form, temporaryPassword: e.target.value})} />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase mb-1.5 block tracking-widest">Assign Roles *</label>
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 max-h-32 overflow-y-auto">
                      {roles.map(r => (
                        <label key={r.roleCode} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer">
                          <input type="checkbox" checked={form.roleCodes.includes(r.roleCode)} onChange={() => {
                            const codes = form.roleCodes.includes(r.roleCode) ? form.roleCodes.filter(c => c !== r.roleCode) : [...form.roleCodes, r.roleCode];
                            setForm({...form, roleCodes: codes});
                          }} className="h-3 w-3 rounded text-indigo-600" />
                          <span className="text-[9px] font-black text-slate-600 uppercase">{r.roleName}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 flex gap-3 pt-4 border-t border-slate-50">
                    <Button variant="secondary" className="flex-1 font-bold text-xs" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button variant="primary" className="flex-1 font-bold text-xs shadow-lg shadow-indigo-100" type="submit" disabled={submitting}>Register Employee</Button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const InputField = ({ label, mandatory, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">{label} {mandatory && '*'}</label>
    <input {...props} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-50 outline-none" />
  </div>
);

const ProfileItem = ({ icon, label, value }) => (
  <div className="flex gap-3 items-start">
    <div className="mt-1 text-indigo-500">{icon}</div>
    <div className="overflow-hidden">
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter leading-none mb-1">{label}</p>
      <p className="font-bold text-slate-800 text-xs truncate">{value || "—"}</p>
    </div>
  </div>
);