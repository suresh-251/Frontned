import React, { useState, useEffect } from "react";
import { 
  Plus, Search, FileText, MoreVertical, UserCheck, 
  Clock, AlertCircle, X, Upload, CheckCircle2, Trash2,
  ChevronRight, ChevronLeft
} from "lucide-react";
import { onboardingApi } from "../api/onboarding.api";
import { toast } from "react-hot-toast";

export default function Onboarding() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [formPage, setFormPage] = useState(1); // 1 to 5

  const [formData, setFormData] = useState({
    // Page 1
    FullName: "", DateOfJoining: "", DateOfBirth: "", Email: "", MobileNumber: "",
    BloodGroup: "", MaritalStatus: "Single", SpouseName: "", SpouseDOB: "", 
    ChildrenDetails: "", FatherName: "", FatherDOB: "", IsFatherDeceased: "No",
    FatherDOD: "", FatherAge: "", MotherName: "", MotherDOB: "", 
    IsMotherDeceased: "No", MotherDOD: "", MotherAge: "", 
    PAN: "", AadharNumber: "", EmergencyContactName: "", 
    EmergencyContactRelationship: "", TemporaryAddress: "", PermanentAddress: "",

    // Page 2
    PreviousCompanyDetails: "", OfferedDesignation: "", OfferedSalaryNTH: "",
    OfferedMonthlyCTC: "", OfferedYearlyCTC: "", TotalExperience: "",
    LastCompanyPFNumber: "", LastCompanyUAN: "",

    // Page 3
    BankName: "", AccountNumber: "", IFSC: "", BranchName: "",

    // Page 5
    OfficeEmail: "", OfficeMobileNumber: "", LaptopSerialNumber: ""
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
    setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentAadharFiles[0]) return toast.error("First Parent Aadhar is mandatory");

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
    Object.keys(files).forEach(key => { if (files[key]) submissionData.append(key, files[key]); });
    parentAadharFiles.forEach(file => { if (file) submissionData.append("ParentAadhar", file); });

    try {
      await onboardingApi.createOnboarding(submissionData);
      toast.success("Employee Onboarded Successfully!");
      setShowModal(false);
      setFormPage(1);
      fetchData();
    } catch (err) { toast.error("Submission failed."); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER & STATS (Keeping your working UI) */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Employee Onboarding</h1>
          <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">Lifecycle Management</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-black shadow-lg shadow-indigo-200"><Plus size={16} /> ADD NEW HIRE</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: "Active Onboarding", val: data.length, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Docs", val: "12", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Verification", val: "08", icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-50" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}><stat.icon size={20} /></div>
            <div><p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{stat.label}</p><p className="text-xl font-black text-slate-800">{stat.val}</p></div>
          </div>
        ))}
      </div>

      {/* TABLE (Keeping your working UI) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-[40%] px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</th>
              <th className="w-[30%] px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Designation</th>
              <th className="w-[30%] px-4 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="3" className="p-10 text-center text-xs font-bold text-slate-400 tracking-widest uppercase">Loading API...</td></tr> : 
             data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3"><div className="flex flex-col"><span className="text-xs font-black text-slate-800 uppercase">{item.fullName}</span><span className="text-[10px] text-slate-400">{item.email}</span></div></td>
                <td className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-tight">{item.offeredDesignation}</td>
                <td className="px-4 py-3 text-right"><button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400"><MoreVertical size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REGISTRATION MODAL (PAGES 1-5) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">PAGE {formPage} OF 5</h2>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Employee Registration Wizard</p>
              </div>
              <button onClick={() => {setShowModal(false); setFormPage(1);}} className="p-2 hover:bg-rose-50 text-rose-500 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              
              {/* PAGE 1: PERSONAL & FAMILY */}
              {formPage === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-3"><SectionHeader label="Page 1: Personal & Family" /></div>
                  <InputField label="Full Name (Aadhar)" name="FullName" value={formData.FullName} onChange={handleInputChange} />
                  <InputField label="DOJ" name="DateOfJoining" type="date" value={formData.DateOfJoining} onChange={handleInputChange} />
                  <InputField label="DOB" name="DateOfBirth" type="date" value={formData.DateOfBirth} onChange={handleInputChange} />
                  <InputField label="Email" name="Email" type="email" value={formData.Email} onChange={handleInputChange} />
                  <InputField label="Mobile" name="MobileNumber" value={formData.MobileNumber} onChange={handleInputChange} />
                  <InputField label="Blood Group" name="BloodGroup" value={formData.BloodGroup} onChange={handleInputChange} />
                  <SelectField label="Marital Status" name="MaritalStatus" options={['Single', 'Married', 'Divorced', 'Widowed']} value={formData.MaritalStatus} onChange={handleInputChange} />
                  {formData.MaritalStatus === 'Married' && (
                    <>
                      <InputField label="Spouse Name" name="SpouseName" value={formData.SpouseName} onChange={handleInputChange} />
                      <InputField label="Spouse DOB" name="SpouseDOB" type="date" value={formData.SpouseDOB} onChange={handleInputChange} />
                    </>
                  )}
                  <div className="md:col-span-3"><InputField label="Children Details (Name & Age)" name="ChildrenDetails" value={formData.ChildrenDetails} onChange={handleInputChange} /></div>
                  <InputField label="Father's Name" name="FatherName" value={formData.FatherName} onChange={handleInputChange} />
                  <InputField label="Father DOB" name="FatherDOB" type="date" value={formData.FatherDOB} onChange={handleInputChange} />
                  <SelectField label="Father Deceased?" name="IsFatherDeceased" options={['No', 'Yes']} value={formData.IsFatherDeceased} onChange={handleInputChange} />
                  {formData.IsFatherDeceased === 'Yes' && <InputField label="Father DOD" name="FatherDOD" type="date" value={formData.FatherDOD} onChange={handleInputChange} />}
                  <InputField label="Mother's Name" name="MotherName" value={formData.MotherName} onChange={handleInputChange} />
                  <InputField label="Mother DOB" name="MotherDOB" type="date" value={formData.MotherDOB} onChange={handleInputChange} />
                  <SelectField label="Mother Deceased?" name="IsMotherDeceased" options={['No', 'Yes']} value={formData.IsMotherDeceased} onChange={handleInputChange} />
                  <InputField label="PAN" name="PAN" value={formData.PAN} onChange={handleInputChange} />
                  <InputField label="Aadhar No" name="AadharNumber" value={formData.AadharNumber} onChange={handleInputChange} />
                  <div className="md:col-span-3 grid grid-cols-2 gap-4">
                    <InputField label="Temp Address" name="TemporaryAddress" value={formData.TemporaryAddress} onChange={handleInputChange} />
                    <InputField label="Perm Address" name="PermanentAddress" value={formData.PermanentAddress} onChange={handleInputChange} />
                  </div>
                </div>
              )}

              {/* PAGE 2: WORK EXPERIENCE */}
              {formPage === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2"><SectionHeader label="Page 2: Work Experience" /></div>
                  <InputField label="Prev Co. Details" name="PreviousCompanyDetails" value={formData.PreviousCompanyDetails} onChange={handleInputChange} />
                  <InputField label="Designation" name="OfferedDesignation" value={formData.OfferedDesignation} onChange={handleInputChange} />
                  <InputField label="Salary NTH" name="OfferedSalaryNTH" type="number" value={formData.OfferedSalaryNTH} onChange={handleInputChange} />
                  <InputField label="Monthly CTC" name="OfferedMonthlyCTC" type="number" value={formData.OfferedMonthlyCTC} onChange={handleInputChange} />
                  <InputField label="Yearly CTC" name="OfferedYearlyCTC" type="number" value={formData.OfferedYearlyCTC} onChange={handleInputChange} />
                  <InputField label="Total Experience" name="TotalExperience" value={formData.TotalExperience} onChange={handleInputChange} />
                  <FileInput label="Prev Co. Payslip" name="PreviousCompanyPayslip" onChange={handleFileChange} />
                </div>
              )}

              {/* PAGE 3: BANKING */}
              {formPage === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2"><SectionHeader label="Page 3: Bank Account" /></div>
                  <InputField label="Bank Name" name="BankName" value={formData.BankName} onChange={handleInputChange} />
                  <InputField label="Account Number" name="AccountNumber" value={formData.AccountNumber} onChange={handleInputChange} />
                  <InputField label="IFSC Code" name="IFSC" value={formData.IFSC} onChange={handleInputChange} />
                  <InputField label="Branch Name" name="BranchName" value={formData.BranchName} onChange={handleInputChange} />
                </div>
              )}

              {/* PAGE 4: DOCUMENTS */}
              {formPage === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-3"><SectionHeader label="Page 4: Softcopy Documents" /></div>
                  <FileInput label="Aadhar Card" name="AadharCard" onChange={handleFileChange} />
                  <FileInput label="PAN Card" name="PANCard" onChange={handleFileChange} />
                  <FileInput label="Bank Statement (4 Months)" name="BankStatement" onChange={handleFileChange} />
                  <FileInput label="Bank Passbook" name="BankPassbook" onChange={handleFileChange} />
                  <FileInput label="Experience Letter" name="ExperienceLetter" onChange={handleFileChange} />
                  <FileInput label="Acceptance Letter" name="AcceptanceLetter" onChange={handleFileChange} />
                  
                  <div className="md:col-span-3 p-4 bg-white rounded-xl border border-slate-200 mt-4">
                     <div className="flex justify-between mb-4"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Parent Aadhar Cards</label>
                     <button type="button" onClick={() => setParentAadharFiles([...parentAadharFiles, null])} className="text-xs font-black text-indigo-600">+ ADD</button></div>
                     <div className="grid grid-cols-2 gap-4">
                        {parentAadharFiles.map((f, i) => (
                          <div key={i} className="relative">
                            <FileInput label={`Parent Aadhar ${i+1}`} onChange={(e) => {
                              const up = [...parentAadharFiles]; up[i] = e.target.files[0]; setParentAadharFiles(up);
                            }} />
                            {i > 0 && <button type="button" onClick={() => setParentAadharFiles(parentAadharFiles.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 text-rose-500"><Trash2 size={14}/></button>}
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {/* PAGE 5: NAFA OFFICE */}
              {formPage === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2"><SectionHeader label="Page 5: NAFA Office Login" /></div>
                  <InputField label="Office Email" name="OfficeEmail" value={formData.OfficeEmail} onChange={handleInputChange} />
                  <InputField label="Office Mobile" name="OfficeMobileNumber" value={formData.OfficeMobileNumber} onChange={handleInputChange} />
                  <InputField label="Laptop Serial No" name="LaptopSerialNumber" value={formData.LaptopSerialNumber} onChange={handleInputChange} />
                  <FileInput label="Laptop Image" name="LaptopImage" onChange={handleFileChange} />
                </div>
              )}

              {/* FOOTER NAV */}
              <div className="mt-12 flex justify-between border-t border-slate-100 pt-6">
                <button type="button" disabled={formPage === 1} onClick={() => setFormPage(p => p - 1)} className="px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest disabled:opacity-0 transition-all">Previous</button>
                {formPage < 5 ? (
                  <button type="button" onClick={() => setFormPage(p => p + 1)} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-xl">Next <ChevronRight size={16}/></button>
                ) : (
                  <button type="submit" className="bg-indigo-600 text-white px-10 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200">Save & Execute</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents matching your working UI
const SectionHeader = ({ label }) => (
  <h3 className="text-[11px] font-black text-indigo-600 tracking-[0.2em] border-b pb-1 border-indigo-100 uppercase">{label}</h3>
);

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    <input {...props} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium" />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    <select {...props} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const FileInput = ({ label, onChange, name }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    <div className="relative group">
      <input type="file" name={name} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg group-hover:border-indigo-400 transition-all">
        <Upload size={14} className="text-slate-400 group-hover:text-indigo-500" />
        <span className="text-[10px] text-slate-400 font-bold truncate">Choose File...</span>
      </div>
    </div>
  </div>
);