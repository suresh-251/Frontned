import React, { useState, useEffect } from "react";
import { 
  Plus, Search, FileText, MoreVertical, UserCheck, 
  Clock, AlertCircle, X, Upload, CheckCircle2, Trash2,
  ChevronRight, ChevronLeft, FileIcon
} from "lucide-react";
import { onboardingApi } from "../api/onboarding.api";
import { toast } from "react-hot-toast";

export default function Onboarding() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
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
    
    // Append Text Fields
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
    
    // Append Standard Files
    Object.keys(files).forEach(key => {
      if (files[key]) submissionData.append(key, files[key]);
    });

    // Append Parent Aadhar Array
    parentAadharFiles.forEach(file => {
      if (file) submissionData.append("ParentAadhar", file);
    });

    try {
      setLoading(true);
      await onboardingApi.createOnboarding(submissionData);
      toast.success("Data stored in backend successfully!");
      setShowModal(false);
      setFormPage(1);
      fetchData();
    } catch (err) {
      toast.error("Submission failed. Ensure all required fields are mapped.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Onboarding Dashboard</h1>
          <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">Employee Lifecycle & Docs</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center gap-2">
          <Plus size={14} /> Add New Hire
        </button>
      </div>

      {/* COMPACT TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full table-fixed text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-[40%] px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Employee Name</th>
              <th className="w-[30%] px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Designation</th>
              <th className="w-[30%] px-4 py-3 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && !data.length ? (
              <tr><td colSpan="3" className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing with backend...</td></tr>
            ) : data.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 text-xs font-bold text-slate-700">{emp.fullName}</td>
                <td className="px-4 py-2 text-xs font-medium text-slate-500">{emp.offeredDesignation}</td>
                <td className="px-4 py-2 text-right">
                  <button className="p-1 hover:bg-slate-200 rounded text-slate-400"><MoreVertical size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BEST-FIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <span className="bg-indigo-600 text-white w-6 h-6 rounded flex items-center justify-center text-[10px] font-black">{formPage}</span>
                <h2 className="text-xs font-black text-slate-800 tracking-widest uppercase">Onboarding Step {formPage} of 5</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500"><X size={18}/></button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {formPage === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3"><SectionTitle label="Personal & Family Details" /></div>
                  <InputField label="Employee Full Name (as per Aadhar)" name="FullName" value={formData.FullName} onChange={handleInputChange} />
                  <InputField label="Date of Joining (DOJ)" type="date" name="DateOfJoining" value={formData.DateOfJoining} onChange={handleInputChange} />
                  <InputField label="Date of Birth (DOB)" type="date" name="DateOfBirth" value={formData.DateOfBirth} onChange={handleInputChange} />
                  <InputField label="Contact Email" name="Email" value={formData.Email} onChange={handleInputChange} />
                  <InputField label="Mobile Number" name="MobileNumber" value={formData.MobileNumber} onChange={handleInputChange} />
                  <InputField label="Blood Group" name="BloodGroup" value={formData.BloodGroup} onChange={handleInputChange} />
                  <SelectField label="Marital Status" name="MaritalStatus" options={['Single', 'Married', 'Divorced', 'Widowed']} value={formData.MaritalStatus} onChange={handleInputChange} />
                  {formData.MaritalStatus === 'Married' && <InputField label="Spouse Full Name" name="SpouseName" value={formData.SpouseName} onChange={handleInputChange} />}
                  <InputField label="Children Details (Name & Age)" name="ChildrenDetails" value={formData.ChildrenDetails} onChange={handleInputChange} />
                  <InputField label="Father's Full Name" name="FatherName" value={formData.FatherName} onChange={handleInputChange} />
                  <SelectField label="Is Father Deceased?" name="IsFatherDeceased" options={['No', 'Yes']} value={formData.IsFatherDeceased} onChange={handleInputChange} />
                  {formData.IsFatherDeceased === 'Yes' && <InputField label="Father Date of Demise (DOD)" type="date" name="FatherDOD" value={formData.FatherDOD} onChange={handleInputChange} />}
                  <InputField label="Mother's Full Name" name="MotherName" value={formData.MotherName} onChange={handleInputChange} />
                  <InputField label="Permanent Account Number (PAN)" name="PAN" value={formData.PAN} onChange={handleInputChange} />
                  <InputField label="Aadhar Number" name="AadharNumber" value={formData.AadharNumber} onChange={handleInputChange} />
                  <div className="md:col-span-3 grid grid-cols-2 gap-4">
                    <InputField label="Temporary Address" name="TemporaryAddress" value={formData.TemporaryAddress} onChange={handleInputChange} />
                    <InputField label="Permanent Address" name="PermanentAddress" value={formData.PermanentAddress} onChange={handleInputChange} />
                  </div>
                </div>
              )}

              {formPage === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><SectionTitle label="Work Experience" /></div>
                  <InputField label="Previous Company Details" name="PreviousCompanyDetails" value={formData.PreviousCompanyDetails} onChange={handleInputChange} />
                  <InputField label="Offered Designation" name="OfferedDesignation" value={formData.OfferedDesignation} onChange={handleInputChange} />
                  <InputField label="Offered Salary NTH" type="number" name="OfferedSalaryNTH" value={formData.OfferedSalaryNTH} onChange={handleInputChange} />
                  <InputField label="Offered Monthly CTC" type="number" name="OfferedMonthlyCTC" value={formData.OfferedMonthlyCTC} onChange={handleInputChange} />
                  <InputField label="Total Experience" name="TotalExperience" value={formData.TotalExperience} onChange={handleInputChange} />
                  <FileInput label="Previous Company Payslip" name="PreviousCompanyPayslip" file={files.PreviousCompanyPayslip} onChange={handleFileChange} />
                </div>
              )}

              {formPage === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><SectionTitle label="Bank Account Details" /></div>
                  <InputField label="Bank Name" name="BankName" value={formData.BankName} onChange={handleInputChange} />
                  <InputField label="Account Number" name="AccountNumber" value={formData.AccountNumber} onChange={handleInputChange} />
                  <InputField label="IFSC Code" name="IFSC" value={formData.IFSC} onChange={handleInputChange} />
                  <InputField label="Branch Name" name="BranchName" value={formData.BranchName} onChange={handleInputChange} />
                </div>
              )}

              {formPage === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><SectionTitle label="Softcopy Documents" /></div>
                  <FileInput label="Aadhar Card" name="AadharCard" file={files.AadharCard} onChange={handleFileChange} />
                  <FileInput label="PAN Card" name="PANCard" file={files.PANCard} onChange={handleFileChange} />
                  <FileInput label="Bank Statement (Last 4 Months)" name="BankStatement" file={files.BankStatement} onChange={handleFileChange} />
                  <FileInput label="Bank Passbook" name="BankPassbook" file={files.BankPassbook} onChange={handleFileChange} />
                  <FileInput label="Highest Education Qualification Document" name="HighestQualificationDocument" file={files.HighestQualificationDocument} onChange={handleFileChange} />
                  <FileInput label="Experience Letter" name="ExperienceLetter" file={files.ExperienceLetter} onChange={handleFileChange} />
                  <div className="md:col-span-2 p-3 bg-white border rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Parent Aadhar Cards</label>
                      <button type="button" onClick={() => setParentAadharFiles([...parentAadharFiles, null])} className="text-[9px] text-indigo-600 font-black">+ ADD PARENT</button>
                    </div>
                    {parentAadharFiles.map((f, i) => (
                      <div key={i} className="mb-2"><FileInput label={`Parent ${i+1} Aadhar`} file={parentAadharFiles[i]} onChange={(e) => {
                        const up = [...parentAadharFiles]; up[i] = e.target.files[0]; setParentAadharFiles(up);
                      }} /></div>
                    ))}
                  </div>
                </div>
              )}

              {formPage === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><SectionTitle label="NAFA Office Login" /></div>
                  <InputField label="Office Mail ID" name="OfficeEmail" value={formData.OfficeEmail} onChange={handleInputChange} />
                  <InputField label="Office Mobile No" name="OfficeMobileNumber" value={formData.OfficeMobileNumber} onChange={handleInputChange} />
                  <InputField label="Office Laptop Serial No" name="LaptopSerialNumber" value={formData.LaptopSerialNumber} onChange={handleInputChange} />
                  <FileInput label="Office Laptop Image" name="LaptopImage" file={files.LaptopImage} onChange={handleFileChange} />
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-4 border-t bg-white flex justify-between">
  <button
    type="button"
    disabled={formPage === 1}
    onClick={() => setFormPage(p => p - 1)}
    className="bg-black text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-0"
  >
    Back
  </button>
  {formPage < 5 ? (
    <button
      type="button"
      onClick={() => setFormPage(p => p + 1)}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
    >
      Continue
    </button>
  ) : (
    <button
      onClick={handleSubmit}
      className="bg-blue-600 text-white px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100"
    >
      Submit
    </button>
  )}
</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimalist Subcomponents
const SectionTitle = ({ label }) => (
  <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{label}</h3>
);

const InputField = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input {...props} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all" />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <select {...props} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const FileInput = ({ label, onChange, name, file }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <input type="file" name={name} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className={`flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg transition-all ${file ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
        {file ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Upload size={12} className="text-slate-400" />}
        <span className={`text-[9px] font-black truncate uppercase ${file ? 'text-emerald-700' : 'text-slate-400'}`}>
          {file ? file.name : "Select File"}
        </span>
      </div>
    </div>
  </div>
);