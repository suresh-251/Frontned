import { useEffect, useState, useMemo } from "react";
import {
  Plus, Search, ShieldCheck, User, Building,
  Eye, Loader2, X, Phone, Briefcase, Mail,
  ChevronRight, ChevronLeft, Fingerprint, Globe, Shield, Lock, AlertTriangle, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

import { getAdminUsers } from "../../api/admin/users.api";
import { getDomains } from "../../api/admin/domains.api";
import { getAdminRoles } from "../../api/admin/roles.api";
import { createUser, getUserById, updateUserProfile } from "../../api/users/users.api";
import { getBranches } from "../api/api.branch";
import { getDepartments } from "../api/hr.dept";

export default function Employees() {
  const [users, setUsers]           = useState([]);
  const [domains, setDomains]       = useState([]);
  const [roles, setRoles]           = useState([]);
  const [branches, setBranches]     = useState([]);
  const [allDepts, setAllDepts]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // full detail from GET /api/users/{id}
  const [viewLoading, setViewLoading]   = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm]       = useState({ open: false, onConfirm: null });
  const [editProfile, setEditProfile] = useState(false);
  const [editForm, setEditForm]       = useState({});
  const [editSaving, setEditSaving]   = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const emptyForm = {
    username: "", email: "", domainCode: "", temporaryPassword: "",
    roleCodes: [],
    profile: { firstName: "", lastName: "", mobileNumber: "" },
    employeeId: "", gender: "", assignedBranch: "",
    department: "", designation: "", employmentType: "", payrollAmount: "",
    // internal (not sent to API — used for branch→dept cascade)
    _branchId: "",
  };
  const [form, setForm] = useState(emptyForm);

  // filtered departments based on selected branch
  const depts = useMemo(() => {
    if (!form._branchId) return allDepts;
    return allDepts.filter(d => String(d.branchId) === String(form._branchId));
  }, [allDepts, form._branchId]);

  // --- AUTH ---
  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [], isAdmin: false };
    try {
      const decoded = jwtDecode(token);
      const perms = decoded.perm || [];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const isAdmin = role === "ADMIN" || perms.includes("CRM_FULL_ACCESS");
      return { perms, isAdmin };
    } catch { return { perms: [], isAdmin: false }; }
  }, [token]);

  const canView   = auth.isAdmin || auth.perms.includes("USER_VIEW_ALL");
  const canCreate = auth.isAdmin || auth.perms.includes("USER_CREATE");

  // --- LOAD USERS ---
  const loadData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const res = await getAdminUsers({ page: 1, pageSize: 100 });
      setUsers(res?.users || []);
    } catch { toast.error("Sync Error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [canView]);

  // --- LOAD REFERENCE DATA ---
  useEffect(() => {
    if (!canCreate) return;
    const load = async () => {
      try {
        const [domainsData, rolesData, branchData, deptData] = await Promise.all([
          getDomains(), getAdminRoles(), getBranches(), getDepartments(),
        ]);
        setDomains(Array.isArray(domainsData) ? domainsData : (domainsData?.data || []));
        setRoles(Array.isArray(rolesData) ? rolesData : (rolesData?.data || []));
        setBranches(Array.isArray(branchData) ? branchData : []);
        setAllDepts(Array.isArray(deptData) ? deptData : []);
      } catch { /* silent — not critical */ }
    };
    load();
  }, [canCreate]);

  const toggleRole = (roleCode) => {
    setForm(prev => ({
      ...prev,
      roleCodes: prev.roleCodes.includes(roleCode)
        ? prev.roleCodes.filter(r => r !== roleCode)
        : [...prev.roleCodes, roleCode],
    }));
  };

  // --- VIEW: fetch full user from GET /api/users/{userId} ---
  const openView = async (u) => {
    setViewLoading(true);
    setSelectedUser(null);
    try {
      const full = await getUserById(u.userId);
      setSelectedUser(full);
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setViewLoading(false);
    }
  };

  // --- SUBMIT ---
  const triggerSubmit = (e) => {
    e.preventDefault();
    if (!canCreate) return toast.error("Unauthorized Action");
    setConfirm({
      open: true,
      onConfirm: async () => {
        try {
          setSubmitting(true);
          // Strip internal _branchId before sending
          const { _branchId, ...payload } = form;
          await createUser(payload);
          toast.success("Employee Created");
          closeModal();
          loadData();
        } catch { toast.error("Creation Failed"); }
        finally { setSubmitting(false); }
      }
    });
  };

  const closeModal = () => {
    setCreateOpen(false);
    setSelectedUser(null);
    setEditProfile(false);
    setEditForm({});
    setForm(emptyForm);
  };

  const openEditProfile = () => {
    const p = selectedUser?.profile || {};
    setEditForm({
      firstName:          p.firstName          ?? "",
      lastName:           p.lastName           ?? "",
      gender:             p.gender             ?? selectedUser?.organization?.gender ?? "",
      mobileNumber:       p.mobileNumber       ?? "",
      addressLine1:       p.addressLine1       ?? "",
      city:               p.city               ?? "",
      state:              p.state              ?? "",
      country:            p.country            ?? "",
      postalCode:         p.postalCode         ?? "",
      languagePreference: p.languagePreference ?? "",
      timezone:           p.timezone           ?? "",
    });
    setEditProfile(true);
  };

  const submitEditProfile = async () => {
    try {
      setEditSaving(true);
      await updateUserProfile(selectedUser.userId, editForm);
      toast.success("Profile Updated");
      const updated = await getUserById(selectedUser.userId);
      setSelectedUser(updated);
      setEditProfile(false);
    } catch {
      toast.error("Update Failed");
    } finally {
      setEditSaving(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Permission 'USER_VIEW_ALL' required.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.userId?.toString().includes(searchTerm)
  );
  const totalPages  = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-500" /> Personnel
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {auth.isAdmin ? "Master Employee Directory (Full Access)" : "Employee Directory"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg pl-9 pr-4 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)]"
            />
          </div>
          {canCreate && (
            <button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all active:scale-95">
              + Add New
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Info</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Contact & Email</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Department</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/30">
              {currentData.map((u) => (
                <tr key={u.userId} className="hover:bg-indigo-500/[0.02] transition-colors">
                  <td className="px-5 py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 text-[11px] font-bold uppercase border border-indigo-500/20">
                        {u.username?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-[var(--text-main)] uppercase leading-none mb-0.5">{u.username}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">UID: {u.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-1.5 text-center">
                    <p className="text-[11px] font-bold text-[var(--text-main)] opacity-80">{u.email}</p>
                  </td>
                  <td className="px-5 py-1.5 text-center">
                    <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-md border bg-[var(--bg-body)] text-slate-400 border-[var(--border-color)]">
                      {u.department || "Unassigned"}
                    </span>
                  </td>
                  <td className="px-5 py-1.5 text-center">
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${
                      u.accountStatus === "Active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>{u.accountStatus || "Active"}</span>
                  </td>
                  <td className="px-5 py-1.5 text-right">
                    <button onClick={() => openView(u)} className="p-2 hover:bg-indigo-500/10 rounded-lg text-slate-400 hover:text-indigo-500 transition-all">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-body)]/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {currentData.length} of {filteredUsers.length}</p>
            <div className="flex items-center gap-1.5">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-body)] disabled:opacity-30 transition-all"><ChevronLeft size={14} /></button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-7 w-7 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-indigo-600 text-white shadow-md" : "bg-[var(--bg-card)] border border-[var(--border-color)] text-slate-400 hover:bg-[var(--bg-body)]"}`}>{i + 1}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-body)] disabled:opacity-30 transition-all"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / VIEW MODAL */}
      <AnimatePresence>
        {(createOpen || selectedUser || viewLoading) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] flex flex-col max-h-[90vh]">

              <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
                <h3 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">
                  {createOpen ? "New Employee" : "Personnel Record"}
                </h3>
                <button type="button" onClick={closeModal} className="p-1.5 hover:bg-[var(--bg-card)] rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={16} /></button>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar">

                {/* VIEW LOADING */}
                {viewLoading && !selectedUser && (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
                )}

                {/* CREATE FORM */}
                {createOpen && (
                  <form onSubmit={triggerSubmit} className="grid grid-cols-2 gap-x-3 gap-y-2" autoComplete="off">
                    <InputField label="Username" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} icon={<User size={12} />} />
                    <InputField label="Email Address" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} icon={<Mail size={12} />} />
                    <InputField label="First Name" value={form.profile.firstName} onChange={e => setForm({ ...form, profile: { ...form.profile, firstName: e.target.value } })} />
                    <InputField label="Last Name" value={form.profile.lastName} onChange={e => setForm({ ...form, profile: { ...form.profile, lastName: e.target.value } })} />
                    <InputField label="Mobile Number" required value={form.profile.mobileNumber} onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setForm({ ...form, profile: { ...form.profile, mobileNumber: val } });
                    }} icon={<Phone size={12} />} />
                    <InputField label="Employee ID" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} />
                    <InputField label="Designation" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} icon={<Briefcase size={12} />} />
                    <InputField label="Payroll Amount" type="number" min="0" value={form.payrollAmount} onChange={e => setForm({ ...form, payrollAmount: e.target.value })} />

                    {/* Gender */}
                    <div className="col-span-2 space-y-0.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Gender</label>
                      <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)]">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Employment Type */}
                    <div className="col-span-2 space-y-0.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Employment Type</label>
                      <select value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)]">
                        <option value="">Select Type</option>
                        <option value="FullTime">Full Time</option>
                        <option value="PartTime">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>

                    {/* Branch → Department cascade */}
                    <div className="col-span-2 space-y-0.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-1"><MapPin size={9} /> Assigned Branch</label>
                      <select value={form._branchId} onChange={e => {
                        const branch = branches.find(b => String(b.id || b.branchId) === e.target.value);
                        setForm({ ...form, _branchId: e.target.value, assignedBranch: branch?.branchName || "", department: "" });
                      }} className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)]">
                        <option value="">Select Branch...</option>
                        {branches.map(b => (
                          <option key={b.id || b.branchId} value={b.id || b.branchId}>{b.branchName} {b.location ? `— ${b.location}` : ""}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-0.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-1"><Building size={9} /> Department</label>
                      <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                        disabled={!form._branchId}
                        className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)] disabled:opacity-40">
                        <option value="">{form._branchId ? "Select Department..." : "Select branch first"}</option>
                        {depts.map(d => (
                          <option key={d.id || d.departmentId} value={d.departmentName}>{d.departmentName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Domain */}
                    <div className="col-span-2 space-y-0.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">System Domain</label>
                      <select required value={form.domainCode} onChange={e => setForm({ ...form, domainCode: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)]">
                        <option value="">Select Domain...</option>
                        {domains.map(d => <option key={d.domainId || d.domainCode} value={d.domainCode}>{d.domainName}</option>)}
                      </select>
                    </div>

                    {/* Roles */}
                    <div className="col-span-2 space-y-0.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Assign Security Roles</label>
                      <div className="flex flex-wrap gap-1 p-1 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl max-h-16 overflow-y-auto">
                        {roles.map(r => (
                          <label key={r.roleCode} className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--text-main)] bg-[var(--bg-card)] px-2 py-1 rounded-lg border border-[var(--border-color)]/30 cursor-pointer hover:border-indigo-500/50 transition-all">
                            <input type="checkbox" checked={form.roleCodes.includes(r.roleCode)} onChange={() => toggleRole(r.roleCode)} className="accent-indigo-600 w-2.5 h-2.5" />
                            {r.roleName}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 mt-0.5">
                      <InputField label="Temp Password" type="password" required value={form.temporaryPassword} onChange={e => setForm({ ...form, temporaryPassword: e.target.value })} icon={<Lock size={12} />} />
                    </div>

                    <div className="col-span-2 pt-2 flex justify-end gap-2 mt-1 border-t border-[var(--border-color)]/30">
                      <button type="button" onClick={closeModal} className="px-5 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 rounded-xl transition-all">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-6 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-95">
                        {submitting ? "Processing..." : "Register"}
                      </button>
                    </div>
                  </form>
                )}

                {/* DETAIL VIEW — from GET /api/users/{userId} */}
                {!createOpen && selectedUser && !editProfile && (
                  <div className="space-y-3">
                    {/* Identity */}
                    <SectionTitle>Identity</SectionTitle>
                    <div className="grid grid-cols-2 gap-2.5">
                      <DetailCard label="System ID"    value={selectedUser.userId}                   icon={<Fingerprint size={12} />} />
                      <DetailCard label="Username"     value={selectedUser.username}                 icon={<User size={12} />} />
                      <DetailCard label="Email"        value={selectedUser.email}                    icon={<Mail size={12} />} />
                      <DetailCard label="Status"       value={selectedUser.accountStatus}            />
                      <DetailCard label="First Name"   value={selectedUser.profile?.firstName}       />
                      <DetailCard label="Last Name"    value={selectedUser.profile?.lastName}        />
                      <DetailCard label="Mobile"       value={selectedUser.profile?.mobileNumber}    icon={<Phone size={12} />} />
                      <DetailCard label="Gender"       value={selectedUser.profile?.gender || selectedUser.organization?.gender} />
                      <DetailCard label="Address"      value={selectedUser.profile?.addressLine1}    />
                      <DetailCard label="City"         value={selectedUser.profile?.city}            />
                      <DetailCard label="State"        value={selectedUser.profile?.state}           />
                      <DetailCard label="Country"      value={selectedUser.profile?.country}         />
                      <DetailCard label="Postal Code"  value={selectedUser.profile?.postalCode}      />
                      <DetailCard label="Language"     value={selectedUser.profile?.languagePreference} />
                      <DetailCard label="Timezone"     value={selectedUser.profile?.timezone}        />
                      <DetailCard label="Member Since" value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : null} />
                    </div>

                    {/* Organisation */}
                    <SectionTitle>Organisation</SectionTitle>
                    <div className="grid grid-cols-2 gap-2.5">
                      <DetailCard label="Employee ID"     value={selectedUser.organization?.employeeId}     />
                      <DetailCard label="Domain"          value={selectedUser.organization?.domainName}     icon={<Globe size={12} />} />
                      <DetailCard label="Department"      value={selectedUser.organization?.department}     icon={<Building size={12} />} />
                      <DetailCard label="Designation"     value={selectedUser.organization?.designation}    icon={<Briefcase size={12} />} />
                      <DetailCard label="Assigned Branch" value={selectedUser.organization?.assignedBranch} icon={<MapPin size={12} />} />
                      <DetailCard label="Assigned Region" value={selectedUser.organization?.assignedRegion} />
                      <DetailCard label="Employment Type" value={selectedUser.organization?.employmentType} />
                      <DetailCard label="Work Shift"      value={selectedUser.organization?.workShift}      />
                      <DetailCard label="Manager"         value={selectedUser.organization?.managerName}    />
                      <DetailCard label="Payroll Amount"  value={selectedUser.organization?.payrollAmount != null ? `₹${selectedUser.organization.payrollAmount}` : null} />
                      <DetailCard label="Remarks"         value={selectedUser.organization?.remarks}        />
                    </div>

                    {/* Roles */}
                    {selectedUser.roles?.length > 0 && (
                      <>
                        <SectionTitle>Roles</SectionTitle>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedUser.roles.map((r, i) => (
                            <span key={i} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-[9px] font-black uppercase">{r}</span>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="pt-2 flex justify-between mt-1 border-t border-[var(--border-color)]/30">
                      <button type="button" onClick={openEditProfile}
                        className="px-5 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:bg-indigo-700 transition-all tracking-widest active:scale-95">
                        Update Profile
                      </button>
                      <button type="button" onClick={closeModal}
                        className="px-5 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {/* EDIT PROFILE FORM */}
                {!createOpen && selectedUser && editProfile && (
                  <div className="space-y-3">
                    <SectionTitle>Update Profile</SectionTitle>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Only personal profile fields can be updated here.
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <InputField label="First Name"    value={editForm.firstName}          onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} />
                      <InputField label="Last Name"     value={editForm.lastName}           onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} />
                      <InputField label="Mobile Number" value={editForm.mobileNumber}       onChange={e => setEditForm(p => ({ ...p, mobileNumber: e.target.value }))} icon={<Phone size={12} />} />
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Gender</label>
                        <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)]">
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <InputField label="Address Line 1"       value={editForm.addressLine1}       onChange={e => setEditForm(p => ({ ...p, addressLine1: e.target.value }))} />
                      <InputField label="City"                 value={editForm.city}               onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} />
                      <InputField label="State"                value={editForm.state}              onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))} />
                      <InputField label="Country"              value={editForm.country}            onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} />
                      <InputField label="Postal Code"          value={editForm.postalCode}         onChange={e => setEditForm(p => ({ ...p, postalCode: e.target.value }))} />
                      <InputField label="Language Preference"  value={editForm.languagePreference} onChange={e => setEditForm(p => ({ ...p, languagePreference: e.target.value }))} />
                      <InputField label="Timezone"             value={editForm.timezone}           onChange={e => setEditForm(p => ({ ...p, timezone: e.target.value }))} />
                    </div>
                    <div className="pt-2 flex justify-between mt-1 border-t border-[var(--border-color)]/30">
                      <button type="button" onClick={submitEditProfile} disabled={editSaving}
                        className="px-5 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:bg-indigo-700 transition-all tracking-widest active:scale-95 disabled:opacity-50">
                        {editSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => setEditProfile(false)}
                        className="px-5 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM POPUP */}
      <AnimatePresence>
        {confirm.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] p-6 text-center">
              <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
              <h3 className="text-[11px] font-black uppercase text-slate-800 mb-2">Confirm Registration</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-6">Create this employee entry in the system directory?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ ...confirm, open: false })} className="flex-1 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 rounded-lg">Cancel</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }} className="flex-1 py-1.5 text-[9px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-md">Yes, Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SectionTitle = ({ children }) => (
  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest border-b border-[var(--border-color)]/50 pb-1 mt-1">{children}</p>
);

const InputField = ({ label, icon, ...props }) => (
  <div className="space-y-0.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input {...props} className={`w-full ${icon ? "pl-8" : "px-2.5"} py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500/30 text-[var(--text-main)] transition-all`} />
    </div>
  </div>
);

const DetailCard = ({ label, value, icon }) => (
  <div className="p-2.5 bg-[var(--bg-body)] border border-[var(--border-color)]/50 rounded-xl group hover:border-indigo-500/30 transition-all">
    <div className="flex items-center gap-1.5 mb-0.5">
      {icon && <span className="text-indigo-400">{icon}</span>}
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight truncate pl-0.5 opacity-90">{value || "---"}</p>
  </div>
);
