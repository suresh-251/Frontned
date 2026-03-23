import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Upload, UserCheck, Trash2, Loader2, Eye,
  Briefcase, Calendar, Fingerprint, Home, Landmark, AlertTriangle, Search, CheckCircle2, Users, Link2, Copy, Download
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
  const [viewTab, setViewTab] = useState(0);

  // --- INVITE MODAL STATE ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ employeeName: "", employeeEmail: "" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  // --- 📝 STATE: ALL SWAGGER FIELDS INCLUDED ---
  const [formData, setFormData] = useState({
    FullName: "", DateOfJoining: "", DateOfBirth: "", Email: "", MobileNumber: "",
    BloodGroup: "O+", MaritalStatus: "", SpouseName: "", SpouseDOB: "",
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

    const isSingle = (formData.MaritalStatus || "").toLowerCase() === "single";
    Object.keys(formData).forEach(key => {
      let value = formData[key];
      if (isSingle && ["SpouseName", "SpouseDOB", "ChildrenDetails"].includes(key)) {
        submissionData.append(key, "");
        return;
      }
      if (key.includes("Date") || key.includes("DOB")) value = fmt(value);
      submissionData.append(key, value || "NA");
    });

    const fileKeys = ["PreviousCompanyPayslip", "AadharCard", "PANCard", "BankStatement", "BankPassbook", "HighestQualificationDocument", "ExperienceLetter", "AcceptanceLetter", "LaptopImage"];
    fileKeys.forEach(key => { if (files[key]) submissionData.append(key, files[key]); });
    if (files.ParentAadhar?.length > 0) {
      files.ParentAadhar.forEach(f => submissionData.append("ParentAadhar", f));
    }

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

  const handleDownloadDocs = async (id, name) => {
    const tid = toast.loading("Preparing download...");
    try {
      const res  = await onboardingApi.downloadDocuments(id);
      const blob = new Blob([res.data], { type: "application/zip" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${name || "employee"}_Documents.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded", { id: tid });
    } catch { toast.error("Download failed", { id: tid }); }
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
                  <button onClick={() => { setSelectedRecord(emp); setViewTab(0); }} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-md text-slate-400 hover:text-indigo-600 transition-colors"><Eye size={14}/></button>
                  <button onClick={() => triggerConfirm("Delete Record", "Purge this employee?", () => handleDelete(emp.employeeOnboardingId))} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-md text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 flex justify-center bg-[var(--bg-card)]"><Loader2 className="animate-spin text-indigo-500" /></div>}
      </div>

      {/* TABBED VIEW MODAL */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="px-4 py-3 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-[11px] font-black shadow-sm">{selectedRecord.fullName?.charAt(0)}</div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-[var(--text-main)] leading-none">{selectedRecord.fullName}</p>
                    <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{selectedRecord.offeredDesignation || "No Designation"}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRecord(null)}><X size={16} className="text-slate-400 hover:text-rose-500" /></button>
              </div>

              {/* Tabs */}
              <div className="flex bg-[var(--bg-body)] border-b border-[var(--border-color)] px-2">
                {[
                  { label: "Personal",   icon: <UserCheck size={10} /> },
                  { label: "Career",     icon: <Briefcase size={10} /> },
                  { label: "Financial",  icon: <Landmark size={10} /> },
                  { label: "KYC Docs",   icon: <Upload size={10} /> },
                  { label: "IT & Assets",icon: <Home size={10} /> },
                ].map((tab, i) => (
                  <button key={i} onClick={() => setViewTab(i)} className={`flex items-center gap-1.5 px-3 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${viewTab === i ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-400 hover:text-[var(--text-main)]"}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 min-h-[180px]">
                {viewTab === 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    <ViewField label="Full Name"         value={selectedRecord.fullName} />
                    <ViewField label="Date of Joining"   value={selectedRecord.dateOfJoining?.split('T')[0]} />
                    <ViewField label="Date of Birth"     value={selectedRecord.dateOfBirth?.split('T')[0]} />
                    <ViewField label="Email"             value={selectedRecord.email} />
                    <ViewField label="Mobile"            value={selectedRecord.mobileNumber} />
                    <ViewField label="Blood Group"       value={selectedRecord.bloodGroup} />
                    <ViewField label="Marital Status"    value={selectedRecord.maritalStatus} />
                    <ViewField label="Spouse Name"       value={selectedRecord.spouseName} />
                    <ViewField label="Father"            value={selectedRecord.fatherName} />
                    <ViewField label="Mother"            value={selectedRecord.motherName} />
                    <ViewField label="Aadhar"            value={selectedRecord.aadharNumber} />
                    <ViewField label="PAN"               value={selectedRecord.pan} />
                    <ViewField label="Emergency Contact" value={selectedRecord.emergencyContactName} />
                    <div className="col-span-2"><ViewField label="Permanent Address" value={selectedRecord.permanentAddress} /></div>
                  </div>
                )}
                {viewTab === 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    <ViewField label="Designation"      value={selectedRecord.offeredDesignation} />
                    <ViewField label="Monthly CTC"      value={selectedRecord.offeredMonthlyCTC} />
                    <ViewField label="Yearly CTC"       value={selectedRecord.offeredYearlyCTC} />
                    <ViewField label="Total Experience" value={selectedRecord.totalExperience} />
                    <ViewField label="PF Number"        value={selectedRecord.lastCompanyPFNumber} />
                    <ViewField label="UAN"              value={selectedRecord.lastCompanyUAN} />
                    <div className="col-span-3"><ViewField label="Previous Company" value={selectedRecord.previousCompanyDetails} /></div>
                  </div>
                )}
                {viewTab === 2 && (
                  <div className="grid grid-cols-3 gap-2">
                    <ViewField label="Bank Name"       value={selectedRecord.bankName} />
                    <ViewField label="Account Number"  value={selectedRecord.accountNumber} />
                    <ViewField label="IFSC Code"       value={selectedRecord.ifsc} />
                    <ViewField label="Branch"          value={selectedRecord.branchName} />
                  </div>
                )}
                {viewTab === 3 && (
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
                    <div className="p-4 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-center w-full">
                      <Upload size={28} className="text-indigo-400 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase text-[var(--text-main)] mb-1">All Documents</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-3">Aadhar, PAN, Bank Statement, Passbook, Qualification, Experience, Acceptance, Parent Aadhar & more</p>
                      <button onClick={() => handleDownloadDocs(selectedRecord.employeeOnboardingId, selectedRecord.fullName)} className="flex items-center justify-center gap-2 mx-auto px-6 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl shadow-md active:scale-95 transition-all">
                        <Download size={13} /> Download All Documents
                      </button>
                    </div>
                    {selectedRecord.laptopImagePath && (
                      <div className="p-3 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl flex items-center justify-between w-full gap-2">
                        <div>
                          <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Laptop Image</p>
                          <p className="text-[9px] font-black text-indigo-500 uppercase">Uploaded</p>
                        </div>
                        <button onClick={() => window.open(`https://crmhr.metagensoft.com${selectedRecord.laptopImagePath}`, "_blank")} className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg active:scale-95 transition-all">View</button>
                      </div>
                    )}
                  </div>
                )}
                {viewTab === 4 && (
                  <div className="grid grid-cols-3 gap-2">
                    <ViewField label="Office Email"  value={selectedRecord.officeEmail} />
                    <ViewField label="Office Mobile" value={selectedRecord.officeMobileNumber} />
                    <ViewField label="Laptop Serial" value={selectedRecord.laptopSerialNumber} />
                    <div className="col-span-3"><DocField label="Laptop Image" url={selectedRecord.laptopImage} /></div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-[var(--border-color)] bg-[var(--bg-body)] flex justify-between items-center">
                <button onClick={() => handleDownloadDocs(selectedRecord.employeeOnboardingId, selectedRecord.fullName)} className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--bg-card)] border border-indigo-500/40 text-indigo-500 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-500/10 active:scale-95 transition-all">
                  <Download size={12} /> Download Docs
                </button>
                <button onClick={() => setSelectedRecord(null)} className="px-6 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md active:scale-95 transition-all">Close</button>
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
                      <div className="flex flex-col gap-0.5 group">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 group-focus-within:text-indigo-500 transition-colors">Marital Status</label>
                        <select value={formData.MaritalStatus} onChange={e => setFormData({...formData, MaritalStatus: e.target.value, SpouseName: e.target.value === "single" ? "" : formData.SpouseName, SpouseDOB: e.target.value === "single" ? "" : formData.SpouseDOB, ChildrenDetails: e.target.value === "single" ? "" : formData.ChildrenDetails})} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)] focus:ring-1 focus:ring-indigo-500 transition-all">
                          <option value="" disabled>Select Status</option>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                      </div>
                      {formData.MaritalStatus !== "single" && (
                        <>
                          <InputField label="Spouse Name" onChange={e => setFormData({...formData, SpouseName: e.target.value})} />
                          <InputField label="Spouse DOB" type="date" onChange={e => setFormData({...formData, SpouseDOB: e.target.value})} />
                          <InputField label="Children Details" onChange={e => setFormData({...formData, ChildrenDetails: e.target.value})} />
                        </>
                      )}
                      <InputField label="Father's Name" onChange={e => setFormData({...formData, FatherName: e.target.value})} />
                      <InputField label="Father's DOB" type="date" onChange={e => setFormData({...formData, FatherDOB: e.target.value})} />
                      <InputField label="Father Deceased?" placeholder="yes / no" onChange={e => setFormData({...formData, IsFatherDeceased: e.target.value})} />
                      <InputField label="Mother's Name" onChange={e => setFormData({...formData, MotherName: e.target.value})} />
                      <InputField label="Mother's DOB" type="date" onChange={e => setFormData({...formData, MotherDOB: e.target.value})} />
                      <InputField label="Mother Deceased?" placeholder="yes / no" onChange={e => setFormData({...formData, IsMotherDeceased: e.target.value})} />
                      <InputField label="Emergency Contact" onChange={e => setFormData({...formData, EmergencyContactName: e.target.value})} />
                      <InputField label="Emergency Relationship" onChange={e => setFormData({...formData, EmergencyContactRelationship: e.target.value})} />
                      <InputField label="Temporary Address" onChange={e => setFormData({...formData, TemporaryAddress: e.target.value})} />
                      <InputField label="Permanent Address" onChange={e => setFormData({...formData, PermanentAddress: e.target.value})} />
                    </>
                  )}
                  {formPage === 2 && (
                    <>
                      <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">2. Career Details</div>
                      <InputField label="Designation" onChange={e => setFormData({...formData, OfferedDesignation: e.target.value})} />
                      <InputField label="Salary NTH" type="number" onChange={e => setFormData({...formData, OfferedSalaryNTH: e.target.value})} />
                      <InputField label="Monthly CTC" type="number" onChange={e => setFormData({...formData, OfferedMonthlyCTC: e.target.value})} />
                      <InputField label="Yearly CTC" type="number" onChange={e => setFormData({...formData, OfferedYearlyCTC: e.target.value})} />
                      <InputField label="Total Exp" onChange={e => setFormData({...formData, TotalExperience: e.target.value})} />
                      <InputField label="Previous Company" onChange={e => setFormData({...formData, PreviousCompanyDetails: e.target.value})} />
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
                      <FileInput label="Bank Statement" onChange={e => setFiles({...files, BankStatement: e.target.files[0]})} file={files.BankStatement} />
                      <FileInput label="Bank Passbook" onChange={e => setFiles({...files, BankPassbook: e.target.files[0]})} file={files.BankPassbook} />
                      <FileInput label="Highest Qualification" onChange={e => setFiles({...files, HighestQualificationDocument: e.target.files[0]})} file={files.HighestQualificationDocument} />
                      <FileInput label="Acceptance Letter" onChange={e => setFiles({...files, AcceptanceLetter: e.target.files[0]})} file={files.AcceptanceLetter} />
                      <FileInput label="Experience Letter" onChange={e => setFiles({...files, ExperienceLetter: e.target.files[0]})} file={files.ExperienceLetter} />
                      <MultiFileInput label="Parent Aadhar" onChange={e => setFiles({...files, ParentAadhar: Array.from(e.target.files)})} files={files.ParentAadhar} />
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
const ViewField = ({ label, value }) => (
  <div className="p-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg">
    <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
    <p className="text-[10px] font-black text-[var(--text-main)] uppercase truncate">{value || "---"}</p>
  </div>
);

const DocField = ({ label, url }) => (
  <div className="p-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg flex items-center justify-between gap-2">
    <div>
      <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
      <p className={`text-[9px] font-black uppercase ${url ? "text-indigo-500" : "text-slate-400"}`}>{url ? "Uploaded" : "Not Uploaded"}</p>
    </div>
    {url && (
      <button onClick={() => window.open(url, "_blank")} className="shrink-0 px-2.5 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg active:scale-95 transition-all">View</button>
    )}
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

const MultiFileInput = ({ label, onChange, files }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label} <span className="text-indigo-400">(multiple)</span></label>
    <div className="relative">
      <input type="file" multiple onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className={`flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-xl transition-all ${files?.length > 0 ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[var(--bg-body)] border-[var(--border-color)]'}`}>
        {files?.length > 0 ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Upload size={12} className="text-slate-400" />}
        <span className={`text-[9px] font-black truncate ${files?.length > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{files?.length > 0 ? `${files.length} file(s) selected` : "Select Files"}</span>
      </div>
    </div>
  </div>
);