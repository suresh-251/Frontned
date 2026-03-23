// import React, { useState, useEffect, useMemo } from "react";
// import { 
//   Plus, X, Upload, CheckCircle2, UserCheck, 
//   MapPin, Loader2, Eye, Phone, Mail, Briefcase, Calendar, CreditCard, Lock
// } from "lucide-react";
// import { onboardingApi } from "../api/onboarding.api";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { jwtDecode } from "jwt-decode";

// export default function Onboarding() {
//   const [showModal, setShowModal] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [data, setData] = useState([]);
//   const [formPage, setFormPage] = useState(1);
//   const [selectedRecord, setSelectedRecord] = useState(null);

//   const [formData, setFormData] = useState({
//     FullName: "", DateOfJoining: "", DateOfBirth: "", Email: "", MobileNumber: "",
//     BloodGroup: "", MaritalStatus: "Single", SpouseName: "", SpouseDOB: "", 
//     ChildrenDetails: "", FatherName: "", FatherDOB: "", IsFatherDeceased: "No",
//     FatherDOD: "", FatherAge: "", MotherName: "", MotherDOB: "", 
//     IsMotherDeceased: "No", MotherDOD: "", MotherAge: "", 
//     PAN: "", AadharNumber: "", EmergencyContactName: "", 
//     EmergencyContactRelationship: "", TemporaryAddress: "", PermanentAddress: "",
//     PreviousCompanyDetails: "", OfferedDesignation: "", OfferedSalaryNTH: "",
//     OfferedMonthlyCTC: "", OfferedYearlyCTC: "", TotalExperience: "",
//     LastCompanyPFNumber: "", LastCompanyUAN: "", BankName: "", AccountNumber: "", 
//     IFSC: "", BranchName: "", OfficeEmail: "", OfficeMobileNumber: "", LaptopSerialNumber: ""
//   });

//   const [files, setFiles] = useState({});
//   const [parentAadharFiles, setParentAadharFiles] = useState([null]);

//   // --- 🔐 SUPERLOGIC AUTH PARSING ---
//   const token = localStorage.getItem("accessToken");
//   const auth = useMemo(() => {
//     if (!token) return { perms: [], isAdmin: false };
//     try {
//       const decoded = jwtDecode(token);
//       const perms = decoded.perm || [];
//       const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
//       const isAdmin = role === "ADMIN" || perms.includes("CRM_FULL_ACCESS");
//       return { perms, isAdmin };
//     } catch (e) { return { perms: [], isAdmin: false }; }
//   }, [token]);

//   // --- 🛠️ PERMISSION FLAGS (SUPERLOGIC) ---
//   const canView   = auth.isAdmin || auth.perms.includes("ONBOARDING_VIEW");
//   const canCreate = auth.isAdmin || auth.perms.includes("ONBOARDING_CREATE");

//   useEffect(() => { if (canView) fetchData(); }, [canView]);

//   const fetchData = async () => {
//     try {
//       const res = await onboardingApi.getOnboardingList();
//       setData(res.data || []);
//     } catch (err) { toast.error("Failed to fetch records"); }
//     finally { setLoading(false); }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e) => {
//     const { name, files: selectedFiles } = e.target;
//     if (selectedFiles[0]) {
//       setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!canCreate) return toast.error("Action Restricted");

//     const submissionData = new FormData();
//     Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
//     Object.keys(files).forEach(key => { if (files[key]) submissionData.append(key, files[key]); });
//     parentAadharFiles.forEach(file => { if (file) submissionData.append("ParentAadhar", file); });

//     try {
//       setSubmitting(true);
//       await onboardingApi.createOnboarding(submissionData);
//       toast.success("Onboarding data submitted!");
//       setShowModal(false);
//       setFormPage(1);
//       fetchData();
//     } catch (err) {
//       toast.error("Submission failed.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // 🛑 PAGE GUARD
//   if (!canView) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
//         <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
//           <Lock size={40} className="text-slate-400" />
//         </div>
//         <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Access Restricted</h2>
//         <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
//           Permission 'ONBOARDING_VIEW' or Master Access required.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
//       <Toaster position="top-right" />

//       {/* COMPACT HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
//             <UserCheck size={22} className="text-indigo-600" /> Onboarding
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
//             {auth.isAdmin ? "Master Employee Lifecycle (Full Access)" : "Employee Lifecycle & Docs"}
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           {canCreate && (
//             <button 
//               onClick={() => { setFormPage(1); setShowModal(true); }} 
//               className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
//             >
//               <Plus size={14} strokeWidth={3} /> Add New Hire
//             </button>
//           )}
//         </div>
//       </div>

//       {/* TABLE SECTION */}
//       {loading ? (
//         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
//       ) : (
//         <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden transition-colors">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name (Aadhar)</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Designation</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mobile Number</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-[var(--border-color)]/30">
//               {data.length === 0 ? (
//                 <tr><td colSpan="4" className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No records found</td></tr>
//               ) : (
//                 data.map((emp) => (
//                   <tr key={emp.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
//                     <td className="px-5 py-1.5">
//                       <div className="flex items-center gap-3">
//                         <div className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 text-[11px] font-bold uppercase border border-indigo-500/20">{emp.fullName?.charAt(0)}</div>
//                         <div>
//                           <p className="text-[12px] font-black text-[var(--text-main)] uppercase leading-none mb-0.5">{emp.fullName}</p>
//                           <p className="text-[9px] font-bold text-slate-500 uppercase">UID: {emp.id}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-5 py-1.5 text-center">
//                       <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-md border bg-[var(--bg-body)] text-slate-400 border-[var(--border-color)]">{emp.offeredDesignation || "Unassigned"}</span>
//                     </td>
//                     <td className="px-5 py-1.5 text-center text-[11px] font-bold text-indigo-500 uppercase tracking-widest">
//                       {emp.mobileNumber || "---"}
//                     </td>
//                     <td className="px-5 py-1.5 text-right">
//                       <button 
//                         onClick={() => setSelectedRecord(emp)}
//                         className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-md text-slate-400 hover:text-indigo-600 transition-colors"
//                       >
//                         <Eye size={14}/>
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* VIEW DETAIL CARD MODAL */}
//       <AnimatePresence>
//         {selectedRecord && (
//           <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
//             <motion.div 
//               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
//               className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-color)] p-5 overflow-hidden transition-colors"
//               onClick={e => e.stopPropagation()}
//             >
//               <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--border-color)]/30">
//                 <div className="flex items-center gap-2">
//                   <UserCheck size={16} className="text-indigo-500" />
//                   <h3 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Employee Dossier</h3>
//                 </div>
//                 <button onClick={() => setSelectedRecord(null)} className="p-1 hover:bg-[var(--bg-body)] rounded-full text-slate-400 transition-colors"><X size={16}/></button>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <MiniInfo label="Full Name" value={selectedRecord.fullName} icon={<UserCheck size={12}/>}/>
//                 <MiniInfo label="Designation" value={selectedRecord.offeredDesignation} icon={<Briefcase size={12}/>}/>
//                 <MiniInfo label="Email" value={selectedRecord.email} icon={<Mail size={12}/>}/>
//                 <MiniInfo label="Contact" value={selectedRecord.mobileNumber} icon={<Phone size={12}/>}/>
//                 <MiniInfo label="PAN" value={selectedRecord.pan} icon={<CreditCard size={12}/>}/>
//                 <MiniInfo label="Joining Date" value={selectedRecord.dateOfJoining?.split('T')[0]} icon={<Calendar size={12}/>}/>
//                 <div className="col-span-2">
//                    <MiniInfo label="Permanent Address" value={selectedRecord.permanentAddress} icon={<MapPin size={12}/>}/>
//                 </div>
//               </div>

//               <button onClick={() => setSelectedRecord(null)} className="w-full mt-5 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-md hover:bg-indigo-700 transition-all active:scale-95">
//                 Close Record
//               </button>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* MULTI-STEP CREATION MODAL */}
//       <AnimatePresence>
//         {showModal && canCreate && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--bg-card)] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] flex flex-col max-h-[90vh] transition-colors">
//               <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
//                 <div className="flex items-center gap-3">
//                   <span className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md">{formPage}</span>
//                   <h2 className="text-[11px] font-black text-[var(--text-main)] tracking-widest uppercase">Step {formPage} of 5</h2>
//                 </div>
//                 <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[var(--bg-card)] rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
//               </div>

//               <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
//                 <form id="onboardingForm" onSubmit={handleSubmit}>
//                   {formPage === 1 && (
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
//                       <div className="md:col-span-3"><SectionTitle label="Personal & Family Details" /></div>
//                       <InputField label="Full Name (as per Aadhar)" name="FullName" value={formData.FullName} onChange={handleInputChange} required/>
//                       <InputField label="Date of Joining" type="date" name="DateOfJoining" value={formData.DateOfJoining} onChange={handleInputChange} />
//                       <InputField label="Date of Birth" type="date" name="DateOfBirth" value={formData.DateOfBirth} onChange={handleInputChange} />
//                       <InputField label="Email" name="Email" type="email" value={formData.Email} onChange={handleInputChange} />
//                       <InputField label="Mobile No" name="MobileNumber" value={formData.MobileNumber} onChange={handleInputChange} />
//                       <InputField label="Blood Group" name="BloodGroup" value={formData.BloodGroup} onChange={handleInputChange} />
//                       <SelectField label="Marital Status" name="MaritalStatus" options={['Single', 'Married', 'Divorced', 'Widowed']} value={formData.MaritalStatus} onChange={handleInputChange} />
//                       {formData.MaritalStatus === 'Married' && <InputField label="Spouse Name" name="SpouseName" value={formData.SpouseName} onChange={handleInputChange} />}
//                       <InputField label="Children Details" name="ChildrenDetails" value={formData.ChildrenDetails} onChange={handleInputChange} />
//                       <InputField label="Father's Name" name="FatherName" value={formData.FatherName} onChange={handleInputChange} />
//                       <SelectField label="Is Father Deceased?" name="IsFatherDeceased" options={['No', 'Yes']} value={formData.IsFatherDeceased} onChange={handleInputChange} />
//                       {formData.IsFatherDeceased === 'Yes' && <InputField label="Father DOD" type="date" name="FatherDOD" value={formData.FatherDOD} onChange={handleInputChange} />}
//                       <InputField label="Mother's Name" name="MotherName" value={formData.MotherName} onChange={handleInputChange} />
//                       <InputField label="PAN" name="PAN" value={formData.PAN} onChange={handleInputChange} />
//                       <InputField label="Aadhar Number" name="AadharNumber" value={formData.AadharNumber} onChange={handleInputChange} />
//                       <div className="md:col-span-3 grid grid-cols-2 gap-4 mt-1">
//                         <InputField label="Temporary Address" name="TemporaryAddress" value={formData.TemporaryAddress} onChange={handleInputChange} />
//                         <InputField label="Permanent Address" name="PermanentAddress" value={formData.PermanentAddress} onChange={handleInputChange} />
//                       </div>
//                     </div>
//                   )}

//                   {formPage === 2 && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
//                       <div className="md:col-span-2"><SectionTitle label="Work Experience" /></div>
//                       <InputField label="Previous Company" name="PreviousCompanyDetails" value={formData.PreviousCompanyDetails} onChange={handleInputChange} />
//                       <InputField label="Offered Designation" name="OfferedDesignation" value={formData.OfferedDesignation} onChange={handleInputChange} />
//                       <InputField label="Offered Salary NTH" type="number" name="OfferedSalaryNTH" value={formData.OfferedSalaryNTH} onChange={handleInputChange} />
//                       <InputField label="Offered Monthly CTC" type="number" name="OfferedMonthlyCTC" value={formData.OfferedMonthlyCTC} onChange={handleInputChange} />
//                       <InputField label="Total Experience" name="TotalExperience" value={formData.TotalExperience} onChange={handleInputChange} />
//                       <FileInput label="Previous Company Payslip" name="PreviousCompanyPayslip" file={files.PreviousCompanyPayslip} onChange={handleFileChange} />
//                     </div>
//                   )}

//                   {formPage === 3 && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
//                       <div className="md:col-span-2"><SectionTitle label="Bank Account Details" /></div>
//                       <InputField label="Bank Name" name="BankName" value={formData.BankName} onChange={handleInputChange} />
//                       <InputField label="Account Number" name="AccountNumber" value={formData.AccountNumber} onChange={handleInputChange} />
//                       <InputField label="IFSC Code" name="IFSC" value={formData.IFSC} onChange={handleInputChange} />
//                       <InputField label="Branch Name" name="BranchName" value={formData.BranchName} onChange={handleInputChange} />
//                     </div>
//                   )}

//                   {formPage === 4 && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
//                       <div className="md:col-span-2"><SectionTitle label="Softcopy Documents" /></div>
//                       <FileInput label="Aadhar Card" name="AadharCard" file={files.AadharCard} onChange={handleFileChange} />
//                       <FileInput label="PAN Card" name="PANCard" file={files.PANCard} onChange={handleFileChange} />
//                       <FileInput label="Bank Statement" name="BankStatement" file={files.BankStatement} onChange={handleFileChange} />
//                       <FileInput label="Bank Passbook" name="BankPassbook" file={files.BankPassbook} onChange={handleFileChange} />
//                       <FileInput label="Highest Qualification" name="HighestQualificationDocument" file={files.HighestQualificationDocument} onChange={handleFileChange} />
//                       <FileInput label="Experience Letter" name="ExperienceLetter" file={files.ExperienceLetter} onChange={handleFileChange} />
                      
//                       <div className="md:col-span-2 p-3 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl space-y-2 mt-2">
//                         <div className="flex justify-between items-center mb-1">
//                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Aadhar Cards</label>
//                           <button type="button" onClick={() => setParentAadharFiles([...parentAadharFiles, null])} className="text-[9px] text-indigo-500 font-black">+ ADD PARENT</button>
//                         </div>
//                         {parentAadharFiles.map((f, i) => (
//                           <div key={i}><FileInput label={`Parent ${i+1} Aadhar`} file={parentAadharFiles[i]} onChange={(e) => {
//                             const up = [...parentAadharFiles]; up[i] = e.target.files[0]; setParentAadharFiles(up);
//                           }} /></div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {formPage === 5 && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
//                       <div className="md:col-span-2"><SectionTitle label="Office Login Details" /></div>
//                       <InputField label="Office Mail ID" name="OfficeEmail" value={formData.OfficeEmail} onChange={handleInputChange} />
//                       <InputField label="Office Mobile No" name="OfficeMobileNumber" value={formData.OfficeMobileNumber} onChange={handleInputChange} />
//                       <InputField label="Laptop Serial No" name="LaptopSerialNumber" value={formData.LaptopSerialNumber} onChange={handleInputChange} />
//                       <FileInput label="Laptop Image" name="LaptopImage" file={files.LaptopImage} onChange={handleFileChange} />
//                     </div>
//                   )}
//                 </form>
//               </div>

//               <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-body)]/50 flex justify-end gap-2 shrink-0">
//                 <button type="button" disabled={formPage === 1} onClick={() => setFormPage(p => p - 1)} className="px-5 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 rounded-xl transition-all disabled:opacity-30">Back</button>
//                 {formPage < 5 ? (
//                   <button type="button" onClick={() => setFormPage(p => p + 1)} className="px-6 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl shadow-md transition-all active:scale-95">Continue</button>
//                 ) : (
//                   <button form="onboardingForm" type="submit" disabled={submitting} className="px-6 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md disabled:opacity-50 active:scale-95">{submitting ? "Saving..." : "Submit Entry"}</button>
//                 )}
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// const SectionTitle = ({ label }) => (
//   <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 border-b border-[var(--border-color)] pb-2">{label}</h3>
// );

// const InputField = ({ label, ...props }) => (
//   <div className="space-y-0.5">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
//     <input {...props} className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all" />
//   </div>
// );

// const SelectField = ({ label, options, ...props }) => (
//   <div className="space-y-0.5">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
//     <select {...props} className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all">
//       {options.map(o => <option key={o} value={o} className="bg-[var(--bg-card)]">{o}</option>)}
//     </select>
//   </div>
// );

// const FileInput = ({ label, onChange, name, file }) => (
//   <div className="space-y-0.5">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
//     <div className="relative group">
//       <input type="file" name={name} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
//       <div className={`flex items-center gap-2 px-2.5 py-1.5 border border-dashed rounded-xl transition-all ${file ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--bg-body)] border-[var(--border-color)] group-hover:border-indigo-500/40'}`}>
//         {file ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Upload size={12} className="text-slate-400" />}
//         <span className={`text-[10px] font-bold truncate ${file ? 'text-emerald-600' : 'text-slate-500'}`}>{file ? file.name : "Select File..."}</span>
//       </div>
//     </div>
//   </div>
// );

// const MiniInfo = ({ label, value, icon }) => (
//   <div className="p-2.5 bg-[var(--bg-body)] border border-[var(--border-color)]/50 rounded-xl group hover:bg-[var(--bg-card)] hover:border-indigo-500/30 transition-all">
//     <div className="flex items-center gap-1.5 text-indigo-500 mb-0.5">
//       {icon}
//       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
//     </div>
//     <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight truncate pl-0.5 opacity-90">{value || '---'}</p>
//   </div>
// );














// import React, { useState, useEffect, useMemo } from "react";
// import { 
//   Plus, X, Upload, UserCheck, Trash2, Loader2, Eye, 
//   Briefcase, Calendar, Fingerprint, Home, Landmark, AlertTriangle, Search, CheckCircle2, Users
// } from "lucide-react";
// import { onboardingApi } from "../api/onboarding.api";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// export default function Onboarding() {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [formPage, setFormPage] = useState(1);
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

//   const [formData, setFormData] = useState({
//     FullName: "", DateOfJoining: "", DateOfBirth: "", Email: "", MobileNumber: "",
//     BloodGroup: "O+", MaritalStatus: "single", SpouseName: "NA", SpouseDOB: "", 
//     ChildrenDetails: "NA", FatherName: "NA", FatherDOB: "", IsFatherDeceased: "no",
//     MotherName: "NA", MotherDOB: "", IsMotherDeceased: "no", 
//     PAN: "", AadharNumber: "", EmergencyContactName: "NA", 
//     EmergencyContactRelationship: "NA", TemporaryAddress: "NA", PermanentAddress: "NA",
//     PreviousCompanyDetails: "NA", OfferedDesignation: "", OfferedSalaryNTH: "0",
//     OfferedMonthlyCTC: "0", OfferedYearlyCTC: "0", TotalExperience: "0",
//     LastCompanyPFNumber: "NA", LastCompanyUAN: "NA", BankName: "NA", AccountNumber: "NA", 
//     IFSC: "NA", BranchName: "NA", OfficeEmail: "NA", OfficeMobileNumber: "0000000000", LaptopSerialNumber: "NA"
//   });

//   const [files, setFiles] = useState({});

//   useEffect(() => { fetchData(); }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const res = await onboardingApi.getOnboardingList();
//       setData(res.data || []);
//     } catch { toast.error("Registry Sync Error"); }
//     finally { setLoading(false); }
//   };

//   const triggerConfirm = (title, message, action) => {
//     setConfirm({ show: true, title, message, onConfirm: action });
//   };

//   const handleDelete = async (id) => {
//     try {
//       await onboardingApi.deleteOnboarding(id);
//       toast.success("Record Purged");
//       fetchData();
//     } catch { toast.error("Delete Restricted"); }
//   };

//   const handleSubmit = async () => {
//     const submissionData = new FormData();
//     const fmt = (val) => (val ? val.replace(/-/g, "/") : "2000/01/01");

//     Object.keys(formData).forEach(key => {
//       let value = formData[key];
//       if (key.includes("Date") || key.includes("DOB")) value = fmt(value);
//       submissionData.append(key, value || "NA");
//     });

//     const fileKeys = ["PreviousCompanyPayslip", "AadharCard", "PANCard", "BankStatement", "BankPassbook", "HighestQualificationDocument", "ExperienceLetter", "AcceptanceLetter", "LaptopImage"];
//     fileKeys.forEach(key => { if (files[key]) submissionData.append(key, files[key]); });

//     try {
//       setSubmitting(true);
//       const tid = toast.loading("Routing Data...");
//       await onboardingApi.createOnboarding(submissionData);
//       toast.success("Onboarding Logged", { id: tid });
//       setShowModal(false);
//       fetchData();
//     } catch { toast.error("Submission Failed"); }
//     finally { setSubmitting(false); }
//   };

//   const filteredData = data.filter(emp => 
//     emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     emp.employeeOnboardingId?.toString().includes(searchTerm)
//   );

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
//       <Toaster position="top-right" />

//       {/* CENTERED CONFIRMATION POPUP */}
//       <AnimatePresence>
//         {confirm.show && (
//           <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-xs rounded-2xl p-6 border border-[var(--border-color)] text-center shadow-2xl">
//               <AlertTriangle size={24} className="text-indigo-500 mx-auto mb-4" />
//               <h3 className="text-[14px] font-black uppercase tracking-widest mb-1 text-[var(--text-main)]">{confirm.title}</h3>
//               <p className="text-[10px] font-bold text-slate-500 uppercase mb-6">{confirm.message}</p>
//               <div className="flex gap-2">
//                 <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-2 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[10px] font-black uppercase border border-[var(--border-color)] transition-colors">Cancel</button>
//                 <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95">Confirm</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tight text-[var(--text-main)]">
//             <UserCheck size={22} className="text-indigo-600" /> Onboarding
//           </h2>
//           <div className="relative mt-2">
//             <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
//             <input type="text" placeholder="SEARCH EMPLOYEE..." onChange={(e) => setSearchTerm(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-6 pr-2 py-1 text-[9px] font-black outline-none w-48 uppercase text-[var(--text-main)] focus:border-indigo-500 transition-all" />
//           </div>
//         </div>
//         <button onClick={() => { setFormPage(1); setShowModal(true); }} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-md active:scale-95 flex items-center gap-2">
//           <Plus size={14} strokeWidth={3} /> Add New Hire
//         </button>
//       </div>

//       {/* TABLE */}
//       <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
//         <table className="w-full text-left border-collapse">
//           <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
//             <tr>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Designation</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-[var(--border-color)]/30">
//             {filteredData.map((emp) => (
//               <tr key={emp.employeeOnboardingId} className="hover:bg-indigo-500/5 transition-colors group">
//                 <td className="px-5 py-2.5 text-[11px] font-bold text-slate-400">#{emp.employeeOnboardingId}</td>
//                 <td className="px-5 py-2.5 text-[12px] font-black text-[var(--text-main)] uppercase">{emp.fullName}</td>
//                 <td className="px-5 py-2.5 text-[11px] font-medium text-slate-500 lowercase">{emp.email || "---"}</td>
//                 <td className="px-5 py-2.5 text-center">
//                   <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md border bg-[var(--bg-body)] text-indigo-500 border-indigo-500/20">
//                     {emp.offeredDesignation || emp.designation || "N/A"}
//                   </span>
//                 </td>
//                 <td className="px-5 py-2.5 text-right space-x-1">
//                   <button onClick={() => setSelectedRecord(emp)} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-md text-slate-400 hover:text-indigo-600 transition-colors"><Eye size={14}/></button>
//                   <button onClick={() => triggerConfirm("Delete Record", "Purge this employee?", () => handleDelete(emp.employeeOnboardingId))} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-md text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {loading && <div className="p-10 flex justify-center bg-[var(--bg-card)]"><Loader2 className="animate-spin text-indigo-500" /></div>}
//       </div>

//       {/* COMPACT VIEW DOSSIER */}
//       <AnimatePresence>
//         {selectedRecord && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-4xl rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
//               <div className="px-4 py-2 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
//                 <div className="flex items-center gap-2">
//                   <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white text-[10px] font-black uppercase">{selectedRecord.fullName?.charAt(0)}</div>
//                   <h3 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest leading-none">Employee Dossier : {selectedRecord.fullName}</h3>
//                 </div>
//                 <button onClick={() => setSelectedRecord(null)}><X size={16} className="text-slate-400 hover:text-rose-500"/></button>
//               </div>
//               <div className="p-3 grid grid-cols-4 gap-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
//                 <SectionLabel icon={<Briefcase size={10}/>} label="Career" />
//                 <MiniInfo label="Designation" value={selectedRecord.offeredDesignation} />
//                 <MiniInfo label="Experience" value={selectedRecord.totalExperience} />
//                 <MiniInfo label="Monthly CTC" value={selectedRecord.offeredMonthlyCTC} />
//                 <MiniInfo label="Joining Date" value={selectedRecord.dateOfJoining?.split('T')[0]} />

//                 <SectionLabel icon={<Fingerprint size={10}/>} label="Identity" />
//                 <MiniInfo label="Aadhar" value={selectedRecord.aadharNumber} />
//                 <MiniInfo label="PAN Card" value={selectedRecord.pan} />
//                 <MiniInfo label="Mobile" value={selectedRecord.mobileNumber} />
//                 <MiniInfo label="Birth Date" value={selectedRecord.dateOfBirth?.split('T')[0]} />

//                 <SectionLabel icon={<Landmark size={10}/>} label="Financial" />
//                 <MiniInfo label="Bank Name" value={selectedRecord.bankName} />
//                 <MiniInfo label="Account #" value={selectedRecord.accountNumber} />
//                 <MiniInfo label="IFSC Code" value={selectedRecord.ifsc} />
//                 <MiniInfo label="Branch" value={selectedRecord.branchName} />

//                 <SectionLabel icon={<Users size={10}/>} label="Personal" />
//                 <MiniInfo label="Father" value={selectedRecord.fatherName} />
//                 <MiniInfo label="Mother" value={selectedRecord.motherName} />
//                 <div className="col-span-2"><MiniInfo label="Address" value={selectedRecord.permanentAddress} /></div>
//               </div>
//               <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-body)] flex justify-end">
//                 <button onClick={() => setSelectedRecord(null)} className="px-8 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded shadow-md active:scale-95 transition-all">Close Dossier</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* MULTI-STEP CREATION MODAL */}
//       <AnimatePresence>
//         {showModal && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-5xl rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col max-h-[90vh]">
//               <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
//                 <div className="flex items-center gap-3 text-[var(--text-main)]">
//                   <span className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black">{formPage}</span>
//                   <h2 className="text-[11px] font-black uppercase tracking-widest">Step {formPage} of 5</h2>
//                 </div>
//                 <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
//               </div>

//               <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//                   {formPage === 1 && (
//                     <>
//                       <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">1. Primary Information</div>
//                       <InputField label="Full Name" onChange={e => setFormData({...formData, FullName: e.target.value})} />
//                       <InputField label="DOJ" type="date" onChange={e => setFormData({...formData, DateOfJoining: e.target.value})} />
//                       <InputField label="DOB" type="date" onChange={e => setFormData({...formData, DateOfBirth: e.target.value})} />
//                       <InputField label="Email" onChange={e => setFormData({...formData, Email: e.target.value})} />
//                       <InputField label="Mobile" onChange={e => setFormData({...formData, MobileNumber: e.target.value})} />
//                       <InputField label="Aadhar" onChange={e => setFormData({...formData, AadharNumber: e.target.value})} />
//                       <InputField label="PAN Card" onChange={e => setFormData({...formData, PAN: e.target.value})} />
//                       <InputField label="Blood Group" onChange={e => setFormData({...formData, BloodGroup: e.target.value})} />
//                     </>
//                   )}
//                   {formPage === 2 && (
//                     <>
//                       <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">2. Career & CTC</div>
//                       <InputField label="Designation" onChange={e => setFormData({...formData, OfferedDesignation: e.target.value})} />
//                       <InputField label="Monthly CTC" type="number" onChange={e => setFormData({...formData, OfferedMonthlyCTC: e.target.value})} />
//                       <InputField label="Yearly CTC" type="number" onChange={e => setFormData({...formData, OfferedYearlyCTC: e.target.value})} />
//                       <InputField label="Experience" onChange={e => setFormData({...formData, TotalExperience: e.target.value})} />
//                       <FileInput label="Payslip" onChange={e => setFiles({...files, PreviousCompanyPayslip: e.target.files[0]})} file={files.PreviousCompanyPayslip} />
//                     </>
//                   )}
//                   {formPage === 3 && (
//                     <>
//                       <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">3. Banking Details</div>
//                       <InputField label="Bank Name" onChange={e => setFormData({...formData, BankName: e.target.value})} />
//                       <InputField label="Account No" onChange={e => setFormData({...formData, AccountNumber: e.target.value})} />
//                       <InputField label="IFSC Code" onChange={e => setFormData({...formData, IFSC: e.target.value})} />
//                     </>
//                   )}
//                   {formPage === 4 && (
//                     <>
//                       <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">4. KYC Uploads</div>
//                       <FileInput label="Aadhar Card" onChange={e => setFiles({...files, AadharCard: e.target.files[0]})} file={files.AadharCard} />
//                       <FileInput label="PAN Card" onChange={e => setFiles({...files, PANCard: e.target.files[0]})} file={files.PANCard} />
//                       <FileInput label="Acceptance" onChange={e => setFiles({...files, AcceptanceLetter: e.target.files[0]})} file={files.AcceptanceLetter} />
//                     </>
//                   )}
//                   {formPage === 5 && (
//                     <>
//                       <div className="md:col-span-4 text-[10px] font-black text-indigo-500 border-b border-[var(--border-color)] pb-1 mb-2 uppercase tracking-tighter">5. IT & Assets</div>
//                       <InputField label="Laptop Serial" onChange={e => setFormData({...formData, LaptopSerialNumber: e.target.value})} />
//                       <FileInput label="Laptop Photo" onChange={e => setFiles({...files, LaptopImage: e.target.files[0]})} file={files.LaptopImage} />
//                     </>
//                   )}
//                 </div>
//               </div>

//               <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-body)] flex justify-end gap-2 shrink-0">
//                 <button disabled={formPage === 1} onClick={() => setFormPage(p => p - 1)} className="px-5 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 disabled:opacity-30">Back</button>
//                 {formPage < 5 ? (
//                   <button onClick={() => setFormPage(formPage + 1)} className="px-6 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase transition-all shadow hover:bg-slate-700 active:scale-95">Continue</button>
//                 ) : (
//                   <button onClick={() => triggerConfirm("Onboard", "Log new employee entry?", handleSubmit)} className="px-6 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase transition-all shadow hover:bg-indigo-700 active:scale-95">Finish</button>
//                 )}
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // UI HELPERS (Theme Aware)
// const SectionLabel = ({ icon, label }) => (
//   <div className="col-span-4 flex items-center gap-1.5 border-b border-[var(--border-color)] pb-1 mt-1">
//     <div className="text-indigo-500">{icon}</div>
//     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
//   </div>
// );

// const MiniInfo = ({ label, value }) => (
//   <div className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg hover:border-indigo-500/30 transition-colors">
//     <p className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">{label}</p>
//     <p className="text-[9px] font-black text-[var(--text-main)] uppercase truncate leading-none">{value || "---"}</p>
//   </div>
// );

// const InputField = ({ label, ...props }) => (
//   <div className="flex flex-col gap-0.5 group">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 transition-colors group-focus-within:text-indigo-500">{label}</label>
//     <input {...props} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)] focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
//   </div>
// );

// const FileInput = ({ label, onChange, file }) => (
//   <div className="flex flex-col gap-0.5">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label}</label>
//     <div className="relative">
//       <input type="file" onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
//       <div className={`flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-xl transition-all ${file ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[var(--bg-body)] border-[var(--border-color)]'}`}>
//         {file ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Upload size={12} className="text-slate-400" />}
//         <span className={`text-[9px] font-black truncate ${file ? 'text-emerald-600' : 'text-slate-500'}`}>{file ? file.name : "Select File"}</span>
//       </div>
//     </div>
//   </div>
// );


















import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, X, Upload, UserCheck, Trash2, Loader2, Eye, 
  Briefcase, Calendar, Fingerprint, Home, Landmark, AlertTriangle, Search, CheckCircle2, Users
} from "lucide-react";
import { onboardingApi } from "../api/onboarding.api";
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
        <button onClick={() => { setFormPage(1); setShowModal(true); }} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-md active:scale-95 flex items-center gap-2">
          <Plus size={14} strokeWidth={3} /> Add New Hire
        </button>
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
