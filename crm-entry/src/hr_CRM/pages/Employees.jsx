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




// import { useEffect, useState, useMemo } from "react";
// import { 
//   Eye, UserPlus, ShieldCheck, X, Loader2, Search, 
//   ChevronLeft, ChevronRight, Smartphone, 
//   User, Mail, Building, Lock, Shield, MapPin, Briefcase
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { getAdminUsers } from "../../api/admin/users.api";
// import { getDomains } from "../../api/admin/domains.api";
// import { getAdminRoles } from "../../api/admin/roles.api";
// import { createUser } from "../../api/users/users.api";
// import { Button } from "../components/ui/Buttons";

// export default function Employees() {
//   const [users, setUsers] = useState([]);
//   const [domains, setDomains] = useState([]);
//   const [roles, setRoles] = useState([]);
//   const [createOpen, setCreateOpen] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
  
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;

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

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const [uRes, dRes, rRes] = await Promise.all([
//         getAdminUsers({ page: 1, pageSize: 100 }),
//         getDomains(),
//         getAdminRoles()
//       ]);
//       setUsers(uRes?.users ?? []);
//       setDomains(dRes ?? []);
//       setRoles(rRes ?? []);
//     } catch {
//       toast.error("Failed to sync data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadData(); }, []);

//   const filteredUsers = useMemo(() => {
//     return users.filter(u => 
//       u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
//       u.email?.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [users, searchTerm]);

//   const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
//   const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.username || !form.email || !form.profile.mobileNumber) {
//       toast.error("Required fields missing");
//       return;
//     }
//     setSubmitting(true);
//     try {
//       await createUser(form);
//       toast.success("Employee added!");
//       setCreateOpen(false);
//       resetForm();
//       loadData();
//     } catch {
//       toast.error("Creation failed");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const resetForm = () => setForm({
//     username: "", email: "", domainCode: "", temporaryPassword: "",
//     roleCodes: [], profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
//   });

//   const toggleRole = (roleCode) => {
//     setForm(prev => ({
//       ...prev,
//       roleCodes: prev.roleCodes.includes(roleCode)
//         ? prev.roleCodes.filter(r => r !== roleCode)
//         : [...prev.roleCodes, roleCode],
//     }));
//   };

//   return (
//     <div className="max-w-7xl mx-auto h-screen flex flex-col bg-white">
//       <Toaster position="top-right" />

//       {/* HEADER */}
//       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
//         <div>
//           <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
//             <ShieldCheck size={20} className="text-indigo-600" /> Employees
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Directory Management</p>
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
//             <input 
//               type="text" placeholder="Search..." value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 w-56 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
//             />
//           </div>
//           <Button variant="primary" className="py-2 px-6 text-[10px] font-black uppercase rounded-xl" onClick={() => setCreateOpen(true)}>
//             + Add New
//           </Button>
//         </div>
//       </div>

//       {/* TABLE SECTION - NO EXTRA GAP */}
//       <div className="p-6">
//         <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
//           <table className="w-full text-left">
//             <thead>
//               <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
//                 <th className="px-6 py-4">ID & Username</th>
//                 <th className="px-6 py-4">Email Address</th>
//                 <th className="px-6 py-4">Branch/Dept</th>
//                 <th className="px-6 py-4 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {loading ? (
//                 <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin inline text-indigo-500" /></td></tr>
//               ) : currentItems.map((u) => (
//                 <tr key={u.userId} className="hover:bg-indigo-50/20 transition-all">
//                   <td className="px-6 py-4">
//                     <div className="flex items-center gap-3">
//                       <div className="h-8 w-8 bg-indigo-50 rounded text-indigo-600 flex items-center justify-center text-[10px] font-black">#{u.userId}</div>
//                       <span className="text-xs font-black text-slate-700">{u.username}</span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{u.email}</td>
//                   <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{u.domainName || u.department || "General"}</td>
//                   <td className="px-6 py-4 text-center">
//                     <button onClick={() => setSelectedUser(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100">
//                       <Eye size={16}/>
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {/* PAGINATION - PLACED DIRECTLY BELOW ROWS */}
//           <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
//             <p className="text-[10px] font-black text-slate-400 uppercase">Total: {filteredUsers.length} Employees</p>
//             <div className="flex items-center gap-2">
//               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="p-1 disabled:opacity-30"><ChevronLeft size={16}/></button>
//               <div className="flex gap-1">
//                 {[...Array(totalPages)].map((_, i) => (
//                   <button key={i} onClick={() => setCurrentPage(i+1)} className={`h-6 w-6 rounded text-[10px] font-black ${currentPage === i+1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>{i+1}</button>
//                 ))}
//               </div>
//               <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p+1)} className="p-1 disabled:opacity-30"><ChevronRight size={16}/></button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ADD EMPLOYEE MODAL - COMPACT HORIZONTAL */}
//       <AnimatePresence>
//         {createOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-white">
//               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><UserPlus size={16} className="text-indigo-600"/> Add New Personnel</h3>
//                 <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
//               </div>
              
//               <form onSubmit={handleSubmit} className="p-6 space-y-4">
//                 <div className="grid grid-cols-3 gap-4">
//                   <InputField label="First Name" value={form.profile.firstName} onChange={e => setForm({...form, profile: {...form.profile, firstName: e.target.value}})} />
//                   <InputField label="Last Name" value={form.profile.lastName} onChange={e => setForm({...form, profile: {...form.profile, lastName: e.target.value}})} />
//                   <InputField label="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
//                 </div>
//                 <div className="grid grid-cols-3 gap-4">
//                   <InputField label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
//                   <InputField label="Mobile Number" value={form.profile.mobileNumber} onChange={e => setForm({...form, profile: {...form.profile, mobileNumber: e.target.value}})} />
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Domain/Branch</label>
//                     <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold" value={form.domainCode} onChange={e => setForm({...form, domainCode: e.target.value})}>
//                       <option value="">Select Domain</option>
//                       {domains.map(d => <option key={d.domainCode} value={d.domainCode}>{d.domainName}</option>)}
//                     </select>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-3 gap-4 items-start">
//                   <InputField label="Temp Password" type="password" value={form.temporaryPassword} onChange={e => setForm({...form, temporaryPassword: e.target.value})} />
//                   <div className="col-span-2">
//                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Assign Roles</label>
//                     <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-24 overflow-y-auto">
//                       {roles.map(r => (
//                         <label key={r.roleCode} className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-slate-100 cursor-pointer">
//                           <input type="checkbox" checked={form.roleCodes.includes(r.roleCode)} onChange={() => toggleRole(r.roleCode)} className="h-3 w-3 rounded text-indigo-600" />
//                           <span className="text-[9px] font-black text-slate-600 uppercase">{r.roleName}</span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="pt-4 flex justify-end gap-3 border-t border-slate-50">
//                   <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
//                   <Button variant="primary" className="px-8 py-2 text-[10px] font-black uppercase rounded-xl" type="submit" disabled={submitting}>
//                     {submitting ? "Processing..." : "Register Employee"}
//                   </Button>
//                 </div>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* VIEW PROFILE MODAL - SLEEK HORIZONTAL */}
//       <AnimatePresence>
//         {selectedUser && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
//             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex border border-white">
//               <div className="w-1/3 bg-slate-900 p-8 flex flex-col items-center justify-center text-center">
//                 <div className="h-20 w-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl mb-4 border-4 border-slate-800">
//                   {selectedUser.username?.[0].toUpperCase()}
//                 </div>
//                 <h3 className="text-lg font-black text-white tracking-tight">@{selectedUser.username}</h3>
//                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">{selectedUser.designation || "Employee"}</p>
//                 <div className="mt-6 w-full space-y-2">
//                    <div className={`py-1 px-4 rounded-full text-[9px] font-black uppercase ${selectedUser.accountStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
//                       Status: {selectedUser.accountStatus || 'ACTIVE'}
//                    </div>
//                 </div>
//               </div>

//               <div className="w-2/3 p-10 bg-white relative">
//                 <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-800"><X size={20}/></button>
//                 <div className="grid grid-cols-2 gap-x-8 gap-y-6">
//                   <InfoItem icon={<User size={14}/>} label="Full Name" value={selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`} />
//                   <InfoItem icon={<Briefcase size={14}/>} label="Designation" value={selectedUser.designation} />
//                   <InfoItem icon={<Mail size={14}/>} label="Email Address" value={selectedUser.email} />
//                   <InfoItem icon={<Smartphone size={14}/>} label="Mobile Phone" value={selectedUser.mobileNumber} />
//                   <InfoItem icon={<Building size={14}/>} label="Department/Branch" value={selectedUser.department || selectedUser.domainName} />
//                   <InfoItem icon={<Shield size={14}/>} label="Employee ID" value={`#${selectedUser.userId}`} />
//                   <div className="col-span-2">
//                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Roles</p>
//                     <div className="flex flex-wrap gap-1.5">
//                       {selectedUser.roles?.length > 0 ? selectedUser.roles.map((r, i) => (
//                         <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-lg border border-slate-200">{r}</span>
//                       )) : <span className="text-[9px] text-slate-300 italic">No roles assigned</span>}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="mt-8 flex justify-end">
//                   <button onClick={() => setSelectedUser(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Close Profile</button>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// const InputField = ({ label, className = "", ...props }) => (
//   <div className={`space-y-1.5 ${className}`}>
//     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
//     <input {...props} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
//   </div>
// );

// const InfoItem = ({ icon, label, value }) => (
//   <div className="flex items-start gap-3">
//     <div className="mt-1 text-indigo-500/50">{icon}</div>
//     <div className="overflow-hidden">
//       <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-0.5">{label}</p>
//       <p className="text-xs font-bold text-slate-800 truncate">{value || "—"}</p>
//     </div>
//   </div>
// );










import { useEffect, useState, useMemo } from "react";
import { 
  Eye, UserPlus, ShieldCheck, X, Loader2, Search, 
  ChevronLeft, ChevronRight, Smartphone, 
  User, Mail, Building, Lock, Shield, MapPin, Briefcase, Calendar, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getAdminUsers } from "../../api/admin/users.api";
import { getDomains } from "../../api/admin/domains.api";
import { getAdminRoles } from "../../api/admin/roles.api";
import { createUser } from "../../api/users/users.api";
import { Button } from "../components/ui/Buttons";

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

  const [form, setForm] = useState({
    username: "", email: "", domainCode: "", temporaryPassword: "",
    roleCodes: [],
    profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, rRes] = await Promise.all([
        getAdminUsers({ page: 1, pageSize: 100 }),
        getDomains(),
        getAdminRoles()
      ]);
      setUsers(uRes?.users ?? []);
      setDomains(dRes ?? []);
      setRoles(rRes ?? []);
    } catch { toast.error("Data sync failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.profile.mobileNumber) {
      toast.error("Fields marked * are required");
      return;
    }
    setSubmitting(true);
    try {
      await createUser(form);
      toast.success("Employee created");
      setCreateOpen(false);
      resetForm();
      loadData();
    } catch { toast.error("Error creating employee"); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => setForm({
    username: "", email: "", domainCode: "", temporaryPassword: "",
    roleCodes: [], profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
  });

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col bg-slate-50/50">
      <Toaster position="top-right" />

      {/* HEADER - MATCHES DEPARTMENTS PAGE */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <ShieldCheck size={22} className="text-indigo-600" /> EMPLOYEES
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Personnel Management</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text" placeholder="Search name/email..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 w-60 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <button onClick={() => setCreateOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
            + Add Employee
          </button>
        </div>
      </div>

      {/* TABLE SECTION - TIGHT COMPACT VIEW */}
      <div className="p-6 flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">ID & User</th>
                <th className="px-8 py-4">Contact & Email</th>
                <th className="px-8 py-4">Branch/Dept</th>
                <th className="px-8 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="animate-spin inline text-indigo-500" /></td></tr>
              ) : currentItems.map((u) => (
                <tr key={u.userId} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-8 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center font-black text-indigo-600 text-[10px]">#{u.userId}</div>
                      <span className="text-xs font-black text-slate-700">@{u.username}</span>
                    </div>
                  </td>
                  <td className="px-8 py-3">
                    <p className="text-[11px] font-bold text-slate-800 tracking-tight">{u.email}</p>
                    <p className="text-[9px] text-slate-400 font-bold italic">{u.mobileNumber || 'No Contact'}</p>
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

          {/* PAGINATION - ANCHORED TO TABLE BOTTOM */}
          <div className="px-8 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 uppercase">Viewing 1-5 of {filteredUsers.length}</span>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="p-1 disabled:opacity-20"><ChevronLeft size={16}/></button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i+1)} className={`h-6 w-6 rounded text-[9px] font-black transition-all ${currentPage === i+1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}>{i+1}</button>
              ))}
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p+1)} className="p-1 disabled:opacity-20"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD MODAL - SHORT & CLEAN HORIZONTAL */}
      {/* ADD EMPLOYEE - FITTED DESIGN */}
<AnimatePresence>
  {createOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-white"
      >
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <UserPlus size={14} className="text-indigo-600"/> New Entry
          </h3>
          <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-3 gap-x-4 gap-y-3">
          <InputField label="First Name" value={form.profile.firstName} onChange={e => setForm({...form, profile: {...form.profile, firstName: e.target.value}})} />
          <InputField label="Last Name" value={form.profile.lastName} onChange={e => setForm({...form, profile: {...form.profile, lastName: e.target.value}})} />
          <InputField label="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          
          <InputField label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <InputField label="Contact" value={form.profile.mobileNumber} onChange={e => setForm({...form, profile: {...form.profile, mobileNumber: e.target.value}})} />
          
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Domain</label>
            <select className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300" value={form.domainCode} onChange={e => setForm({...form, domainCode: e.target.value})}>
              <option value="">Select Domain</option>
              {domains.map(d => <option key={d.domainCode} value={d.domainCode}>{d.domainName}</option>)}
            </select>
          </div>

          <InputField label="Password" type="password" value={form.temporaryPassword} onChange={e => setForm({...form, temporaryPassword: e.target.value})} />
          
          <div className="col-span-2">
            <label className="text-[8px] font-black text-slate-400 uppercase ml-1 block mb-1">Access Roles</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 max-h-16 overflow-y-auto">
              {roles.map(r => (
                <label key={r.roleCode} className="flex items-center gap-2 px-2 py-0.5 bg-white rounded-md border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" checked={form.roleCodes.includes(r.roleCode)} onChange={() => setForm(prev => ({...prev, roleCodes: prev.roleCodes.includes(r.roleCode) ? prev.roleCodes.filter(rc => rc !== r.roleCode) : [...prev.roleCodes, r.roleCode]}))} className="h-2.5 w-2.5 rounded text-indigo-600" />
                  <span className="text-[8px] font-black text-slate-600 uppercase">{r.roleName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-3 pt-3 flex justify-end gap-2 border-t border-slate-50 mt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-1.5 text-[9px] font-black uppercase text-slate-400">Cancel</button>
            <button type="submit" disabled={submitting} className="px-8 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-lg shadow-indigo-100">
               {submitting ? "Saving..." : "Add Entry"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* VIEW MODAL - THE "SHORT & CLEAN" CARD */}
      {/* VIEW PROFILE - HIGH DENSITY COMPACT CARD */}
<AnimatePresence>
  {selectedUser && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="p-5">
          {/* Tight Header Row */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield size={12}/> Employee Data
            </h3>
            <button onClick={() => setSelectedUser(null)} className="text-slate-300 hover:text-red-500 transition-colors">
              <X size={16}/>
            </button>
          </div>

          {/* Grid with 0 Extra Space */}
          <div className="grid grid-cols-4 gap-x-3 gap-y-4">
            <MiniInfo label="Full Name" value={selectedUser.name || selectedUser.username} icon={<User size={10}/>}/>
            <MiniInfo label="Primary Email" value={selectedUser.email} icon={<Mail size={10}/>}/>
            <MiniInfo label="Mobile" value={selectedUser.mobileNumber} icon={<Smartphone size={10}/>}/>
            <MiniInfo label="Internal ID" value={`#${selectedUser.userId}`} icon={<Shield size={10}/>}/>
            
            <MiniInfo label="Department" value={selectedUser.department} icon={<Building size={10}/>}/>
            <MiniInfo label="Designation" value={selectedUser.designation} icon={<Briefcase size={10}/>}/>
            <MiniInfo label="Joined Date" value={selectedUser.createdAt?.split('T')[0]} icon={<Calendar size={10}/>}/>
            <MiniInfo label="Last Activity" value={selectedUser.lastActivityAt || '—'} icon={<Activity size={10}/>}/>
          </div>

          {/* Roles & Footer Fitted Tight */}
          <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
            <div className="flex gap-1 overflow-hidden">
              {selectedUser.roles?.map((r, i) => (
                <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-md border border-indigo-100">
                  {r}
                </span>
              ))}
            </div>
            <button 
              onClick={() => setSelectedUser(null)} 
              className="px-5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
    </div>
  );
}

// SHARED COMPONENTS
const InputField = ({ label, className = "", ...props }) => (
  <div className={`space-y-1 ${className}`}>
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



















// import { useEffect, useState, useMemo } from "react";
// import { 
//   Eye, UserPlus, ShieldCheck, X, Search, 
//   ChevronLeft, ChevronRight, Smartphone, 
//   User, Mail, Building, Shield, Briefcase, Calendar, Activity
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { getAdminUsers } from "../../api/admin/users.api";
// import { getDomains } from "../../api/admin/domains.api";
// import { getAdminRoles } from "../../api/admin/roles.api";
// import { createUser } from "../../api/users/users.api";

// export default function Employees() {
//   const [users, setUsers] = useState([]);
//   const [domains, setDomains] = useState([]);
//   const [roles, setRoles] = useState([]);
//   const [createOpen, setCreateOpen] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
  
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;

//   const initialForm = {
//     username: "", email: "", domainCode: "", temporaryPassword: "",
//     roleCodes: [],
//     profile: { firstName: "", lastName: "", mobileNumber: "", designation: "" },
//   };

//   const [form, setForm] = useState(initialForm);

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const [uRes, dRes, rRes] = await Promise.all([
//         getAdminUsers({ page: 1, pageSize: 100 }),
//         getDomains(),
//         getAdminRoles()
//       ]);
//       setUsers(uRes?.users ?? []);
//       setDomains(dRes ?? []);
//       setRoles(rRes ?? []);
//     } catch { toast.error("Sync Error"); }
//     finally { setLoading(false); }
//   };

//   useEffect(() => { loadData(); }, []);

//   const resetForm = () => setForm(initialForm);

//   const currentItems = useMemo(() => {
//     const filtered = users.filter(u => 
//       u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
//       u.email?.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//     return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
//   }, [users, searchTerm, currentPage]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       await createUser(form);
//       toast.success("Employee Added");
//       setCreateOpen(false);
//       resetForm();
//       loadData();
//     } catch { toast.error("Failed to Create"); }
//     finally { setSubmitting(false); }
//   }

//   const toggleRole = (roleCode) => {
//     setForm((prev) => ({
//       ...prev,
//       roleCodes: prev.roleCodes.includes(roleCode)
//         ? prev.roleCodes.filter((r) => r !== roleCode)
//         : [...prev.roleCodes, roleCode],
//     }));
//   };

//   return (
//     <div className="max-w-7xl mx-auto h-screen flex flex-col bg-white">
//       <Toaster position="top-right" />

//       {/* HEADER */}
//       <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 shrink-0">
//         <div>
//           <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
//             <ShieldCheck size={20} className="text-indigo-600" /> EMPLOYEES
//           </h2>
//         </div>

//         <div className="flex items-center gap-3">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
//             <input 
//               type="text" placeholder="Search..." value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 w-48 outline-none"
//             />
//           </div>
//           <button onClick={() => { resetForm(); setCreateOpen(true); }} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase">
//             + Add New
//           </button>
//         </div>
//       </div>

//       {/* TABLE */}
//       <div className="p-6 flex-1 overflow-hidden">
//         <div className="bg-white border border-slate-200 rounded-2xl flex flex-col">
//           <table className="w-full text-left">
//             <thead>
//               <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
//                 <th className="px-6 py-4">Employee</th>
//                 <th className="px-6 py-4">Contact</th>
//                 <th className="px-6 py-4">Branch</th>
//                 <th className="px-6 py-4 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((u) => (
//                 <tr key={u.userId} className="hover:bg-indigo-50/20 transition-all">
//                   <td className="px-6 py-3">
//                     <div className="flex items-center gap-3">
//                       <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center font-black text-indigo-600 text-[10px]">#{u.userId}</div>
//                       <span className="text-xs font-black text-slate-700">@{u.username}</span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-3 font-bold text-slate-700 text-[11px]">{u.email}</td>
//                   <td className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">{u.domainName || 'Main'}</td>
//                   <td className="px-6 py-3 text-center">
//                     <button onClick={() => setSelectedUser(u)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Eye size={16}/></button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {/* PAGINATION ANCHORED BELOW TABLE */}
//           <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
//             <span className="text-[10px] font-black text-slate-400">Viewing {currentItems.length} Entries</span>
//             <div className="flex gap-2">
//               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="p-1 disabled:opacity-20"><ChevronLeft size={16}/></button>
//               <button disabled={currentItems.length < itemsPerPage} onClick={() => setCurrentPage(p => p+1)} className="p-1 disabled:opacity-20"><ChevronRight size={16}/></button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* VIEW PROFILE - PIPE DESIGN (RECTANGULAR & CLEAN) */}
//       <AnimatePresence>
//         {selectedUser && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
//             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
//               <div className="p-6">
//                 <div className="flex justify-between items-center mb-6">
//                   <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
//                     <Shield size={14}/> Employee Identity Card
//                   </h3>
//                   <button onClick={() => setSelectedUser(null)} className="text-slate-300 hover:text-slate-800"><X size={18}/></button>
//                 </div>

//                 <div className="grid grid-cols-4 gap-y-6 gap-x-4">
//                   <MiniInfo label="Full Name" value={selectedUser.name || selectedUser.username} icon={<User size={10}/>}/>
//                   <MiniInfo label="Primary Email" value={selectedUser.email} icon={<Mail size={10}/>}/>
//                   <MiniInfo label="Mobile" value={selectedUser.mobileNumber} icon={<Smartphone size={10}/>}/>
//                   <MiniInfo label="Internal ID" value={`#${selectedUser.userId}`} icon={<Shield size={10}/>}/>
                  
//                   <MiniInfo label="Department" value={selectedUser.department} icon={<Building size={10}/>}/>
//                   <MiniInfo label="Designation" value={selectedUser.designation} icon={<Briefcase size={10}/>}/>
//                   <MiniInfo label="Joined Date" value={selectedUser.createdAt?.split('T')[0]} icon={<Calendar size={10}/>}/>
//                   <MiniInfo label="Last Activity" value={selectedUser.lastActivityAt || 'No record'} icon={<Activity size={10}/>}/>
//                 </div>

//                 <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center">
//                   <div className="flex gap-1.5 overflow-x-auto max-w-[70%] pb-1">
//                     {selectedUser.roles?.map((r, i) => (
//                       <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-full border border-indigo-100 whitespace-nowrap">{r}</span>
//                     ))}
//                   </div>
//                   <button onClick={() => setSelectedUser(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">Close Entry</button>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* ADD EMPLOYEE - PREVIOUS DESIGN (GRID BASED) */}
//       <AnimatePresence>
//         {createOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">
//                <div className="px-8 py-5 bg-indigo-600 flex justify-between items-center">
//                   <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Add New Personnel</h3>
//                   <button onClick={() => setCreateOpen(false)} className="text-white/70 hover:text-white"><X size={20}/></button>
//                </div>
//                <form onSubmit={handleSubmit} autoComplete="off" className="p-8">
//                   {/* Grid layout from previous design */}
//                   <div className="grid grid-cols-2 gap-5">
//                     <InputField label="Username" placeholder="e.g. jdoe" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
//                     <InputField label="Email Address" type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    
//                     <InputField label="First Name" placeholder="John" value={form.profile.firstName} onChange={e => setForm({...form, profile: {...form.profile, firstName: e.target.value}})} />
//                     <InputField label="Last Name" placeholder="Doe" value={form.profile.lastName} onChange={e => setForm({...form, profile: {...form.profile, lastName: e.target.value}})} />
                    
//                     <InputField label="Mobile Number" placeholder="+1..." value={form.profile.mobileNumber} onChange={e => setForm({...form, profile: {...form.profile, mobileNumber: e.target.value}})} />
                    
//                     <div className="space-y-1.5">
//                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Domain</label>
//                       <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-indigo-400" value={form.domainCode} onChange={e => setForm({...form, domainCode: e.target.value})}>
//                         <option value="">Select Domain</option>
//                         {domains.map(d => <option key={d.domainCode} value={d.domainCode}>{d.domainName}</option>)}
//                       </select>
//                     </div>

//                     <div className="col-span-2">
//                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Assign System Roles</p>
//                       <div className="border border-slate-100 rounded-xl p-4 max-h-32 overflow-y-auto bg-slate-50 flex flex-wrap gap-2">
//                         {roles?.map((r) => (
//                           <label key={r.roleCode} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-400 transition-all">
//                             <input type="checkbox" checked={form.roleCodes.includes(r.roleCode)} onChange={() => toggleRole(r.roleCode)} className="h-3 w-3 rounded text-indigo-600" />
//                             <span className="text-[10px] font-bold text-slate-600">{r.roleName}</span>
//                           </label>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="col-span-2">
//                       <InputField label="Temporary Password" type="password" placeholder="••••••••" value={form.temporaryPassword} onChange={e => setForm({...form, temporaryPassword: e.target.value})} />
//                     </div>
//                   </div>

//                   <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-50">
//                     <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400">Discard</button>
//                     <button type="submit" disabled={submitting} className="px-10 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:shadow-xl shadow-indigo-200 transition-all">
//                        {submitting ? "Processing..." : "Register Employee"}
//                     </button>
//                   </div>
//                </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // SHARED COMPONENTS
// const InputField = ({ label, ...props }) => (
//   <div className="space-y-1.5">
//     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
//     <input {...props} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-400 transition-all placeholder:text-slate-300" />
//   </div>
// );

// const MiniInfo = ({ label, value, icon }) => (
//   <div className="flex flex-col gap-1 overflow-hidden">
//     <div className="flex items-center gap-1.5 text-indigo-500">
//       {icon}
//       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
//     </div>
//     <p className="text-[11px] font-bold text-slate-700 truncate pl-4">{value || '—'}</p>
//   </div>
// );