import React, { useState, useEffect } from "react";
import { 
  Plus, X, Upload, CheckCircle2, MoreVertical, UserCheck, 
  MapPin, Loader2
} from "lucide-react";
import { onboardingApi } from "../api/onboarding.api";
import { motion, AnimatePresence } from "framer-motion";
// FIXED: Added Toaster to the import
import toast, { Toaster } from "react-hot-toast";

export default function Onboarding() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState([]);
  const [formPage, setFormPage] = useState(1);

  const [formData, setFormData] = useState({
    FullName: "", DateOfJoining: "", DateOfBirth: "", Email: "", MobileNumber: "",
    BloodGroup: "", MaritalStatus: "Single", SpouseName: "", SpouseDOB: "", 
    ChildrenDetails: "", FatherName: "", FatherDOB: "", IsFatherDeceased: "No",
    FatherDOD: "", FatherAge: "", MotherName: "", MotherDOB: "", 
    IsMotherDeceased: "No", MotherDOD: "", MotherAge: "", 
    PAN: "", AadharNumber: "", EmergencyContactName: "", 
    EmergencyContactRelationship: "", TemporaryAddress: "", PermanentAddress: "",
    PreviousCompanyDetails: "", OfferedDesignation: "", OfferedSalaryNTH: "",
    OfferedMonthlyCTC: "", OfferedYearlyCTC: "", TotalExperience: "",
    LastCompanyPFNumber: "", LastCompanyUAN: "", BankName: "", AccountNumber: "", 
    IFSC: "", BranchName: "", OfficeEmail: "", OfficeMobileNumber: "", LaptopSerialNumber: ""
  });

  const [files, setFiles] = useState({});
  const [parentAadharFiles, setParentAadharFiles] = useState([null]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await onboardingApi.getOnboardingList();
      setData(res.data || []);
    } catch (err) { toast.error("Failed to fetch records"); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
    Object.keys(files).forEach(key => { if (files[key]) submissionData.append(key, files[key]); });
    parentAadharFiles.forEach(file => { if (file) submissionData.append("ParentAadhar", file); });

    try {
      setSubmitting(true);
      await onboardingApi.createOnboarding(submissionData);
      toast.success("Onboarding data submitted!");
      setShowModal(false);
      setFormPage(1);
      fetchData();
    } catch (err) {
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />

      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <UserCheck size={22} className="text-indigo-600" /> Onboarding
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Employee Lifecycle & Docs</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setFormPage(1);
              setShowModal(true);
            }} 
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={3} /> Add New Hire
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
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee Name</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Designation</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr><td colSpan="3" className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No records found</td></tr>
              ) : (
                data.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-1.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 text-[11px] font-bold uppercase border border-indigo-100">{emp.fullName?.charAt(0)}</div>
                        <div>
                          <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-0.5">{emp.fullName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">ID: {emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-1.5 text-center">
                      <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-md border bg-slate-50 text-slate-500 border-slate-200">{emp.offeredDesignation || "Unassigned"}</span>
                    </td>
                    <td className="px-5 py-1.5 text-right">
                      <button className="p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-500 hover:text-indigo-600 transition-colors"><MoreVertical size={14}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MULTI-STEP MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md">{formPage}</span>
                  <h2 className="text-[11px] font-black text-slate-800 tracking-widest uppercase">Step {formPage} of 5</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <form id="onboardingForm" onSubmit={handleSubmit}>
                  {formPage === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                      <div className="md:col-span-3"><SectionTitle label="Personal & Family Details" /></div>
                      <InputField label="Full Name (as per Aadhar)" name="FullName" value={formData.FullName} onChange={handleInputChange} required/>
                      <InputField label="Date of Joining" type="date" name="DateOfJoining" value={formData.DateOfJoining} onChange={handleInputChange} />
                      <InputField label="Date of Birth" type="date" name="DateOfBirth" value={formData.DateOfBirth} onChange={handleInputChange} />
                      <InputField label="Email" name="Email" type="email" value={formData.Email} onChange={handleInputChange} />
                      <InputField label="Mobile No" name="MobileNumber" value={formData.MobileNumber} onChange={handleInputChange} />
                      <InputField label="Blood Group" name="BloodGroup" value={formData.BloodGroup} onChange={handleInputChange} />
                      <SelectField label="Marital Status" name="MaritalStatus" options={['Single', 'Married', 'Divorced', 'Widowed']} value={formData.MaritalStatus} onChange={handleInputChange} />
                      {formData.MaritalStatus === 'Married' && <InputField label="Spouse Name" name="SpouseName" value={formData.SpouseName} onChange={handleInputChange} />}
                      <InputField label="Children Details" name="ChildrenDetails" value={formData.ChildrenDetails} onChange={handleInputChange} />
                      <InputField label="Father's Name" name="FatherName" value={formData.FatherName} onChange={handleInputChange} />
                      <SelectField label="Is Father Deceased?" name="IsFatherDeceased" options={['No', 'Yes']} value={formData.IsFatherDeceased} onChange={handleInputChange} />
                      {formData.IsFatherDeceased === 'Yes' && <InputField label="Father DOD" type="date" name="FatherDOD" value={formData.FatherDOD} onChange={handleInputChange} />}
                      <InputField label="Mother's Name" name="MotherName" value={formData.MotherName} onChange={handleInputChange} />
                      <InputField label="PAN" name="PAN" value={formData.PAN} onChange={handleInputChange} />
                      <InputField label="Aadhar Number" name="AadharNumber" value={formData.AadharNumber} onChange={handleInputChange} />
                      <div className="md:col-span-3 grid grid-cols-2 gap-4 mt-1">
                        <InputField label="Temporary Address" name="TemporaryAddress" value={formData.TemporaryAddress} onChange={handleInputChange} />
                        <InputField label="Permanent Address" name="PermanentAddress" value={formData.PermanentAddress} onChange={handleInputChange} />
                      </div>
                    </div>
                  )}

                  {formPage === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                      <div className="md:col-span-2"><SectionTitle label="Work Experience" /></div>
                      <InputField label="Previous Company" name="PreviousCompanyDetails" value={formData.PreviousCompanyDetails} onChange={handleInputChange} />
                      <InputField label="Offered Designation" name="OfferedDesignation" value={formData.OfferedDesignation} onChange={handleInputChange} />
                      <InputField label="Offered Salary NTH" type="number" name="OfferedSalaryNTH" value={formData.OfferedSalaryNTH} onChange={handleInputChange} />
                      <InputField label="Offered Monthly CTC" type="number" name="OfferedMonthlyCTC" value={formData.OfferedMonthlyCTC} onChange={handleInputChange} />
                      <InputField label="Total Experience" name="TotalExperience" value={formData.TotalExperience} onChange={handleInputChange} />
                      <FileInput label="Previous Company Payslip" name="PreviousCompanyPayslip" file={files.PreviousCompanyPayslip} onChange={handleFileChange} />
                    </div>
                  )}

                  {formPage === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                      <div className="md:col-span-2"><SectionTitle label="Bank Account Details" /></div>
                      <InputField label="Bank Name" name="BankName" value={formData.BankName} onChange={handleInputChange} />
                      <InputField label="Account Number" name="AccountNumber" value={formData.AccountNumber} onChange={handleInputChange} />
                      <InputField label="IFSC Code" name="IFSC" value={formData.IFSC} onChange={handleInputChange} />
                      <InputField label="Branch Name" name="BranchName" value={formData.BranchName} onChange={handleInputChange} />
                    </div>
                  )}

                  {formPage === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                      <div className="md:col-span-2"><SectionTitle label="Softcopy Documents" /></div>
                      <FileInput label="Aadhar Card" name="AadharCard" file={files.AadharCard} onChange={handleFileChange} />
                      <FileInput label="PAN Card" name="PANCard" file={files.PANCard} onChange={handleFileChange} />
                      <FileInput label="Bank Statement" name="BankStatement" file={files.BankStatement} onChange={handleFileChange} />
                      <FileInput label="Bank Passbook" name="BankPassbook" file={files.BankPassbook} onChange={handleFileChange} />
                      <FileInput label="Highest Qualification" name="HighestQualificationDocument" file={files.HighestQualificationDocument} onChange={handleFileChange} />
                      <FileInput label="Experience Letter" name="ExperienceLetter" file={files.ExperienceLetter} onChange={handleFileChange} />
                      
                      <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Aadhar Cards</label>
                          <button type="button" onClick={() => setParentAadharFiles([...parentAadharFiles, null])} className="text-[9px] text-indigo-600 font-black">+ ADD PARENT</button>
                        </div>
                        {parentAadharFiles.map((f, i) => (
                          <div key={i}><FileInput label={`Parent ${i+1} Aadhar`} file={parentAadharFiles[i]} onChange={(e) => {
                            const up = [...parentAadharFiles]; up[i] = e.target.files[0]; setParentAadharFiles(up);
                          }} /></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formPage === 5 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                      <div className="md:col-span-2"><SectionTitle label="Office Login Details" /></div>
                      <InputField label="Office Mail ID" name="OfficeEmail" value={formData.OfficeEmail} onChange={handleInputChange} />
                      <InputField label="Office Mobile No" name="OfficeMobileNumber" value={formData.OfficeMobileNumber} onChange={handleInputChange} />
                      <InputField label="Laptop Serial No" name="LaptopSerialNumber" value={formData.LaptopSerialNumber} onChange={handleInputChange} />
                      <FileInput label="Laptop Image" name="LaptopImage" file={files.LaptopImage} onChange={handleFileChange} />
                    </div>
                  )}
                </form>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
                <button type="button" disabled={formPage === 1} onClick={() => setFormPage(p => p - 1)} className="px-5 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-30">Back</button>
                {formPage < 5 ? (
                  <button type="button" onClick={() => setFormPage(p => p + 1)} className="px-6 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl shadow-md transition-all">Continue</button>
                ) : (
                  <button form="onboardingForm" type="submit" disabled={submitting} className="px-6 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md disabled:opacity-50">{submitting ? "Saving..." : "Submit Entry"}</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SectionTitle = ({ label }) => (
  <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 border-b border-slate-100 pb-2">{label}</h3>
);

const InputField = ({ label, ...props }) => (
  <div className="space-y-0.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all" />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div className="space-y-0.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <select {...props} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const FileInput = ({ label, onChange, name, file }) => (
  <div className="space-y-0.5">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <div className="relative group">
      <input type="file" name={name} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className={`flex items-center gap-2 px-2.5 py-1.5 border border-dashed rounded-xl transition-all ${file ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-300 group-hover:border-indigo-400'}`}>
        {file ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Upload size={12} className="text-slate-400" />}
        <span className={`text-[10px] font-bold truncate ${file ? 'text-emerald-700' : 'text-slate-500'}`}>{file ? file.name : "Select File..."}</span>
      </div>
    </div>
  </div>
);