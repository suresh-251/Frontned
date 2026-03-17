import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Upload, UserCheck, Trash2, Loader2, Eye,
  Briefcase, Calendar, Fingerprint, Home, Landmark, AlertTriangle, Search, CheckCircle2, Users, Link2, Copy
} from "lucide-react";
import { onboardingApi } from "../api/onboarding.api";
import { onboardingInviteApi } from "../api/onboardingInvite.api";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function Onboarding() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formPage, setFormPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

  // --- INVITE MODAL STATE ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ employeeName: "", employeeEmail: "" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  // --- 📝 STATE: ALL SWAGGER FIELDS INCLUDED ---
  const [formData, setFormData] = useState({
    FullName: "", DateOfJoining: "", DateOfBirth: "", Email: "", MobileNumber: "",
    BloodGroup: "O+", MaritalStatus: "single", SpouseName: "NA", SpouseDOB: "", 
    ChildrenDetails: "NA", FatherName: "NA", FatherDOB: "", IsFatherDeceased: "no",
    MotherName: "NA", MotherDOB: "", IsMotherDeceased: "no", 
    PAN: "", AadharNumber: "", EmergencyContactName: "NA", 
    EmergencyContactRelationship: "NA", TemporaryAddress: "NA", PermanentAddress: "NA",
    PreviousCompanyDetails: "NA", OfferedDesignation: "", OfferedSalaryNTH: "0",
    OfferedMonthlyCTC: "0", OfferedYearlyCTC: "0", TotalExperience: "0",
    LastCompanyPFNumber: "NA", LastCompanyUAN: "NA", BankName: "NA", AccountNumber: "NA", 
    IFSC: "NA", BranchName: "NA", OfficeEmail: "NA", OfficeMobileNumber: "0000000000", LaptopSerialNumber: "NA"
  });

  const [files, setFiles] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await onboardingApi.getOnboardingList();
      setData(res.data || []);
    } catch { toast.error("Registry Sync Error"); }
    finally { setLoading(false); }
  };

  const triggerConfirm = (title, message, action) => {
    setConfirm({ show: true, title, message, onConfirm: action });
  };

  const handleDelete = async (id) => {
    try {
      await onboardingApi.deleteOnboarding(id);
      toast.success("Record Purged");
      fetchData();
    } catch { toast.error("Delete Restricted"); }
  };

  const handleSubmit = async () => {
    const submissionData = new FormData();
    const fmt = (val) => (val ? val.replace(/-/g, "/") : "2000/01/01");

    Object.keys(formData).forEach(key => {
      let value = formData[key];
      if (key.includes("Date") || key.includes("DOB")) value = fmt(value);
      submissionData.append(key, value || "NA");
    });

    const fileKeys = ["PreviousCompanyPayslip", "AadharCard", "PANCard", "BankStatement", "BankPassbook", "HighestQualificationDocument", "ExperienceLetter", "AcceptanceLetter", "LaptopImage"];
    fileKeys.forEach(key => { if (files[key]) submissionData.append(key, files[key]); });

    try {
      setSubmitting(true);
      const tid = toast.loading("Routing Data...");
      await onboardingApi.createOnboarding(submissionData);
      toast.success("Onboarding Logged", { id: tid });
      setShowModal(false);
      fetchData();
    } catch { toast.error("Submission Failed"); }
    finally { setSubmitting(false); }
  };

  const handleGenerateInvite = async () => {
    if (!inviteForm.employeeName.trim() || !inviteForm.employeeEmail.trim()) {
      toast.error("Please fill both fields");
      return;
    }
    try {
      setInviteLoading(true);
      const res = await onboardingInviteApi.generate({
        employeeName: inviteForm.employeeName,
        employeeEmail: inviteForm.employeeEmail,
      });
      setInviteResult(res);
    } catch {
      toast.error("Failed to generate invite link");
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredData = data.filter(emp =>
    emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeOnboardingId?.toString().includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* CENTERED CONFIRMATION POPUP (Design from Leave Ref) */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-xs rounded-2xl p-6 border border-[var(--border-color)] text-center shadow-2xl">
              <AlertTriangle size={24} className="text-indigo-500 mx-auto mb-4" />
              <h3 className="text-[14px] font-black uppercase tracking-widest mb-1 text-[var(--text-main)]">{confirm.title}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-6">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-2 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[10px] font-black uppercase border border-[var(--border-color)]">Cancel</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tight text-[var(--text-main)]">
            <UserCheck size={22} className="text-indigo-600" /> Onboarding
          </h2>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
            <input type="text" placeholder="SEARCH EMPLOYEE..." onChange={(e) => setSearchTerm(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-6 pr-2 py-1 text-[9px] font-black outline-none w-48 uppercase text-[var(--text-main)] focus:border-indigo-500 transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setInviteForm({ employeeName: "", employeeEmail: "" }); setInviteResult(null); setShowInviteModal(true); }} className="bg-[var(--bg-card)] border border-indigo-500/40 text-indigo-500 px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-sm active:scale-95 flex items-center gap-2 hover:bg-indigo-500/10 transition-all">
            <Link2 size={14} strokeWidth={3} /> Invite
          </button>
          <button onClick={() => { setFormPage(1); setShowModal(true); }} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-md active:scale-95 flex items-center gap-2">
            <Plus size={14} strokeWidth={3} /> Add New Hire
          </button>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Designation</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30">
            {filteredData.map((emp) => (
              <tr key={emp.employeeOnboardingId} className="hover:bg-indigo-50/10 transition-colors group">
                <td className="px-5 py-2.5 text-[11px] font-bold text-slate-400">#{emp.employeeOnboardingId}</td>
                <td className="px-5 py-2.5 text-[12px] font-black text-[var(--text-main)] uppercase">{emp.fullName}</td>
                <td className="px-5 py-2.5 text-[11px] font-medium text-slate-500 lowercase">{emp.email || "---"}</td>
                <td className="px-5 py-2.5 text-center">
                  <span className="px-2.5 py-0.5 text-[9px] font-black uppercase rounded-md border bg-[var(--bg-body)] text-indigo-500 border-indigo-500/20">
                    {emp.offeredDesignation || "Unassigned"}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right space-x-1">
                  <button onClick={() => setSelectedRecord(emp)} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-md text-slate-400 hover:text-indigo-600 transition-colors"><Eye size={14}/></button>
                  <button onClick={() => triggerConfirm("Delete Record", "Purge this employee?", () => handleDelete(emp.employeeOnboardingId))} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-md text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 flex justify-center bg-[var(--bg-card)]"><Loader2 className="animate-spin text-indigo-500" /></div>}
      </div>

      {/* COMPACT BEST-FIT DOSSIER VIEW */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-4xl rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-4 py-2.5 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase shadow-sm">{selectedRecord.fullName?.charAt(0)}</div>
                  <h3 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest leading-none">Employee Profile : {selectedRecord.fullName}</h3>
                </div>
                <button onClick={() => setSelectedRecord(null)}><X size={16} className="text-slate-400 hover:text-rose-500"/></button>
              </div>

              <div className="p-3 grid grid-cols-4 gap-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <SectionLabel icon={<Briefcase size={10}/>} label="Career Path" />
                <MiniInfo label="Designation" value={selectedRecord.offeredDesignation} />
                <MiniInfo label="Experience" value={selectedRecord.totalExperience} />
                <MiniInfo label="Monthly CTC" value={selectedRecord.offeredMonthlyCTC} />
                <MiniInfo label="Joining Date" value={selectedRecord.dateOfJoining?.split('T')[0]} />

                <SectionLabel icon={<Fingerprint size={10}/>} label="Identification" />
                <MiniInfo label="Aadhar" value={selectedRecord.aadharNumber} />
                <MiniInfo label="PAN Card" value={selectedRecord.pan} />
                <MiniInfo label="Mobile" value={selectedRecord.mobileNumber} />
                <MiniInfo label="Birth Date" value={selectedRecord.dateOfBirth?.split('T')[0]} />

                <SectionLabel icon={<Landmark size={10}/>} label="Financial" />
                <MiniInfo label="Bank Name" value={selectedRecord.bankName} />
                <MiniInfo label="Account #" value={selectedRecord.accountNumber} />
                <MiniInfo label="IFSC Code" value={selectedRecord.ifsc} />
                <MiniInfo label="Branch" value={selectedRecord.branchName} />

                <SectionLabel icon={<Users size={10}/>} label="Family & Address" />
                <MiniInfo label="Father" value={selectedRecord.fatherName} />
                <MiniInfo label="Mother" value={selectedRecord.motherName} />
                <div className="col-span-2"><MiniInfo label="Permanent Address" value={selectedRecord.permanentAddress} /></div>
              </div>

              <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-body)] flex justify-end">
                <button onClick={() => setSelectedRecord(null)} className="px-6 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md active:scale-95 transition-all">Close Dossier</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INVITE MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
              <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-indigo-500" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]">Generate Invite Link</h2>
                </div>
                <button onClick={() => setShowInviteModal(false)}><X size={16} className="text-slate-400 hover:text-rose-500" /></button>
              </div>

              <div className="p-5 space-y-4">
                {!inviteResult ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Employee Name</label>
                        <input
                          type="text"
                          value={inviteForm.employeeName}
                          onChange={e => setInviteForm(p => ({ ...p, employeeName: e.target.value }))}
                          placeholder="Enter name..."
                          className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)] focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Employee Email</label>
                        <input
                          type="text"
                          value={inviteForm.employeeEmail}
                          onChange={e => setInviteForm(p => ({ ...p, employeeEmail: e.target.value }))}
                          placeholder="Enter email..."
                          className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)] focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateInvite}
                      disabled={inviteLoading}
                      className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {inviteLoading ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                      {inviteLoading ? "Generating..." : "Generate Link"}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Link Generated!</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{inviteResult.message}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Shareable Link</label>
                      <div className="flex items-center gap-2 p-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl">
                        <p className="flex-1 text-[9px] font-bold text-indigo-500 truncate">{inviteResult.shareableLink}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(inviteResult.shareableLink); toast.success("Link copied!"); }}
                          className="p-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-500 hover:bg-indigo-500/20 transition-all"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg">
                        <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Employee</p>
                        <p className="text-[9px] font-black text-[var(--text-main)] truncate">{inviteResult.employeeName}</p>
                      </div>
                      <div className="p-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg">
                        <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Expires</p>
                        <p className="text-[9px] font-black text-[var(--text-main)] truncate">{inviteResult.expiresAt?.split('T')[0]}</p>
                      </div>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest">{inviteResult.note}</p>
                    <button
                      onClick={() => { setInviteResult(null); setInviteForm({ employeeName: "", employeeEmail: "" }); }}
                      className="w-full py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] text-slate-400 text-[9px] font-black uppercase rounded-xl hover:border-indigo-500/30 transition-all"
                    >
                      Generate Another
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MULTI-STEP CREATION MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-5xl rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col max-h-[90vh]">
              <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md">{formPage}</span>
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]">Step {formPage} of 5</h2>
                </div>
                <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {formPage === 1 && (
                    <>
                      <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">1. Primary Information</div>
                      <InputField label="Full Name" onChange={e => setFormData({...formData, FullName: e.target.value})} />
                      <InputField label="DOJ" type="date" onChange={e => setFormData({...formData, DateOfJoining: e.target.value})} />
                      <InputField label="DOB" type="date" onChange={e => setFormData({...formData, DateOfBirth: e.target.value})} />
                      <InputField label="Email" onChange={e => setFormData({...formData, Email: e.target.value})} />
                      <InputField label="Mobile" onChange={e => setFormData({...formData, MobileNumber: e.target.value})} />
                      <InputField label="Aadhar" onChange={e => setFormData({...formData, AadharNumber: e.target.value})} />
                      <InputField label="PAN Card" onChange={e => setFormData({...formData, PAN: e.target.value})} />
                      <InputField label="Blood Group" onChange={e => setFormData({...formData, BloodGroup: e.target.value})} />
                      <InputField label="Marital Status" onChange={e => setFormData({...formData, MaritalStatus: e.target.value})} />
                      <InputField label="Spouse Name" onChange={e => setFormData({...formData, SpouseName: e.target.value})} />
                      <InputField label="Father's Name" onChange={e => setFormData({...formData, FatherName: e.target.value})} />
                      <InputField label="Mother's Name" onChange={e => setFormData({...formData, MotherName: e.target.value})} />
                      <InputField label="Emergency Contact" onChange={e => setFormData({...formData, EmergencyContactName: e.target.value})} />
                      <InputField label="Temporary Address" onChange={e => setFormData({...formData, TemporaryAddress: e.target.value})} />
                      <InputField label="Permanent Address" onChange={e => setFormData({...formData, PermanentAddress: e.target.value})} />
                    </>
                  )}
                  {formPage === 2 && (
                    <>
                      <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">2. Career Details</div>
                      <InputField label="Designation" onChange={e => setFormData({...formData, OfferedDesignation: e.target.value})} />
                      <InputField label="Monthly CTC" type="number" onChange={e => setFormData({...formData, OfferedMonthlyCTC: e.target.value})} />
                      <InputField label="Yearly CTC" type="number" onChange={e => setFormData({...formData, OfferedYearlyCTC: e.target.value})} />
                      <InputField label="Total Exp" onChange={e => setFormData({...formData, TotalExperience: e.target.value})} />
                      <InputField label="PF Number" onChange={e => setFormData({...formData, LastCompanyPFNumber: e.target.value})} />
                      <InputField label="UAN Number" onChange={e => setFormData({...formData, LastCompanyUAN: e.target.value})} />
                      <FileInput label="Payslip" onChange={e => setFiles({...files, PreviousCompanyPayslip: e.target.files[0]})} file={files.PreviousCompanyPayslip} />
                    </>
                  )}
                  {formPage === 3 && (
                    <>
                      <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">3. Financial Information</div>
                      <InputField label="Bank Name" onChange={e => setFormData({...formData, BankName: e.target.value})} />
                      <InputField label="Account No" onChange={e => setFormData({...formData, AccountNumber: e.target.value})} />
                      <InputField label="IFSC Code" onChange={e => setFormData({...formData, IFSC: e.target.value})} />
                      <InputField label="Branch" onChange={e => setFormData({...formData, BranchName: e.target.value})} />
                    </>
                  )}
                  {formPage === 4 && (
                    <>
                      <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">4. KYC Uploads</div>
                      <FileInput label="Aadhar Card" onChange={e => setFiles({...files, AadharCard: e.target.files[0]})} file={files.AadharCard} />
                      <FileInput label="PAN Card" onChange={e => setFiles({...files, PANCard: e.target.files[0]})} file={files.PANCard} />
                      <FileInput label="Acceptance" onChange={e => setFiles({...files, AcceptanceLetter: e.target.files[0]})} file={files.AcceptanceLetter} />
                      <FileInput label="Experience" onChange={e => setFiles({...files, ExperienceLetter: e.target.files[0]})} file={files.ExperienceLetter} />
                    </>
                  )}
                  {formPage === 5 && (
                    <>
                      <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">5. IT & Assets</div>
                      <InputField label="Office Email" onChange={e => setFormData({...formData, OfficeEmail: e.target.value})} />
                      <InputField label="Laptop Serial" onChange={e => setFormData({...formData, LaptopSerialNumber: e.target.value})} />
                      <FileInput label="Laptop Photo" onChange={e => setFiles({...files, LaptopImage: e.target.files[0]})} file={files.LaptopImage} />
                    </>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-body)] flex justify-end gap-2 shrink-0">
                <button disabled={formPage === 1} onClick={() => setFormPage(p => p - 1)} className="px-5 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 disabled:opacity-30">Back</button>
                {formPage < 5 ? (
                  <button onClick={() => setFormPage(formPage + 1)} className="px-6 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase shadow hover:bg-slate-700 active:scale-95 transition-all">Continue</button>
                ) : (
                  <button onClick={() => triggerConfirm("Onboard", "Log new employee entry?", handleSubmit)} className="px-6 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase shadow active:scale-95 transition-all">Finish</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// THEME-AWARE HELPERS
const SectionLabel = ({ icon, label }) => (
  <div className="col-span-4 flex items-center gap-1.5 border-b border-[var(--border-color)] pb-1 mt-1">
    <div className="text-indigo-500">{icon}</div>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const MiniInfo = ({ label, value }) => (
  <div className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg hover:border-indigo-500/30 transition-colors">
    <p className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">{label}</p>
    <p className="text-[9px] font-black text-[var(--text-main)] uppercase truncate leading-none">{value || "---"}</p>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div className="flex flex-col gap-0.5 group">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 group-focus-within:text-indigo-500 transition-colors">{label}</label>
    <input {...props} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)] focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
  </div>
);

const FileInput = ({ label, onChange, file }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label}</label>
    <div className="relative">
      <input type="file" onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className={`flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-xl transition-all ${file ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[var(--bg-body)] border-[var(--border-color)]'}`}>
        {file ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Upload size={12} className="text-slate-400" />}
        <span className={`text-[9px] font-black truncate ${file ? 'text-emerald-600' : 'text-slate-500'}`}>{file ? file.name : "Select File"}</span>
      </div>
    </div>
  </div>
);