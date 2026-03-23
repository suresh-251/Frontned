import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getAllSignatures, getSignatureHistory, requestSignature,
  signDocument, updateSignature, deleteSignature,
  viewDocument, downloadSignedDocument,
} from "../../api/recruitment/hr.digitalSignature";
import { getAdminUsers } from "../../../api/admin/users.api";
import { onboardingApi } from "../../api/onboarding.api";
import { hasPermission, getAuthDetails } from "../../configs/auth.utils";
import {
  Fingerprint, Plus, Loader2, X, Search, Trash2, Eye,
  Edit3, Download, FileText, AlertTriangle, ChevronLeft, ChevronRight, PenTool,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const canView    = () => hasPermission("DIGITALSIGNATURE_VIEW");
const canCreate  = () => hasPermission("DIGITALSIGNATURE_CREATE");
const canRequest = () => hasPermission("DIGITALSIGNATURE_REQUEST");
const canUpdate  = () => hasPermission("DIGITALSIGNATURE_UPDATE");
const canDelete  = () => hasPermission("DIGITALSIGNATURE_DELETE");

const EMPTY_FORM = { userId: "", documentName: "", documentType: "", remarks: "", documentFile: null };

export default function DigitalSignature() {
  const authDetails = useMemo(() => getAuthDetails(), []);
  const isManager   = !!(authDetails?.isAdmin || authDetails?.role === "HR_MANAGER");
  const currentUser = useMemo(() => ({ id: authDetails?.userId ? Number(authDetails.userId) : 0 }), [authDetails]);

  const [records, setRecords]       = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [signRecord, setSignRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [confirm, setConfirm]       = useState({ show: false, message: "", onConfirm: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 9;

  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown, setShowDropdown]     = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [signForm, setSignForm] = useState({ remarks: "", signatureImageBase64: "" });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isManager) {
        const [empRes, onboardRes] = await Promise.all([
          getAdminUsers({ page: 1, pageSize: 200 }),
          onboardingApi.getOnboardingList(),
        ]);
        const active     = (empRes?.users || empRes || []).map(u => ({ userId: u.userId || u.id, username: u.username || u.name, type: "employee" }));
        const onboarding = (onboardRes?.data || onboardRes || []).map(u => ({ userId: u.employeeOnboardingId, username: u.fullName, type: "onboarding" }));
        const seen = new Set();
        const unique = [...active, ...onboarding].filter(u => {
          const key = (u.username || "").toLowerCase().trim();
          if (!key || seen.has(key)) return false;
          seen.add(key); return true;
        });
        setEmployees(unique);
        const res = await getAllSignatures();
        setRecords(Array.isArray(res) ? res : (res?.data || []));
      } else {
        const res = await getSignatureHistory(currentUser.id);
        setRecords(Array.isArray(res) ? res : (res?.data || []));
      }
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, [isManager, currentUser.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Filtered / paginated ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return records.filter(r => {
      const emp = employees.find(e => Number(e.userId) === Number(r.userId));
      return (emp?.username || "").toLowerCase().includes(q) ||
             (r.documentName || "").toLowerCase().includes(q);
    });
  }, [records, employees, searchTerm]);

  const totalPages  = Math.ceil(filtered.length / rowsPerPage) || 1;
  const currentData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRequest = async (e) => {
    e.preventDefault();
    const targetId = isManager ? formData.userId : currentUser.id;
    if (!targetId) return toast.error("Select a user first");
    const tid = toast.loading("Submitting...");
    try {
      const fd = new FormData();
      fd.append("UserId", Number(targetId));
      fd.append("RequestedBy", currentUser.id);
      fd.append("DocumentName", formData.documentName);
      fd.append("DocumentType", formData.documentType);
      if (formData.documentFile) fd.append("DocumentFile", formData.documentFile);
      if (formData.remarks) fd.append("Remarks", formData.remarks);
      await requestSignature(fd);
      toast.success("Request submitted", { id: tid });
      setShowModal(false);
      setFormData(EMPTY_FORM);
      setEmpSearchQuery("");
      fetchData();
    } catch { toast.error("Submission failed", { id: tid }); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Updating...");
    try {
      const fd = new FormData();
      fd.append("UserId", Number(editRecord.userId));
      fd.append("RequestedBy", currentUser.id);
      fd.append("DocumentName", editForm.documentName);
      fd.append("DocumentType", editForm.documentType);
      if (editForm.documentFile) fd.append("DocumentFile", editForm.documentFile);
      if (editForm.remarks) fd.append("Remarks", editForm.remarks);
      await updateSignature(editRecord.id, fd);
      toast.success("Updated", { id: tid });
      setEditRecord(null);
      fetchData();
    } catch { toast.error("Update failed", { id: tid }); }
  };

  const handleSign = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Signing...");
    try {
      const fd = new FormData();
      fd.append("UserId", currentUser.id);
      if (signForm.remarks) fd.append("Remarks", signForm.remarks);
      if (signForm.signatureImageBase64) fd.append("SignatureImageBase64", signForm.signatureImageBase64);
      await signDocument(signRecord.id, fd);
      toast.success("Document signed", { id: tid });
      setSignRecord(null);
      fetchData();
    } catch { toast.error("Sign failed", { id: tid }); }
  };

  const handleDelete = async (id) => {
    const tid = toast.loading("Deleting...");
    try {
      await deleteSignature(id);
      toast.success("Deleted", { id: tid });
      fetchData();
    } catch { toast.error("Delete failed", { id: tid }); }
  };

  const handleViewDoc = async (id) => {
    const tid = toast.loading("Opening document...");
    try {
      const res  = await viewDocument(id);
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/pdf" });
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.dismiss(tid);
    } catch { toast.error("Could not open document", { id: tid }); }
  };

  const handleDownload = async (id, name) => {
    const tid = toast.loading("Downloading...");
    try {
      const res  = await downloadSignedDocument(id);
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = name || `signed-document-${id}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded", { id: tid });
    } catch { toast.error("Download failed", { id: tid }); }
  };

  // ── Permission gate ────────────────────────────────────────────────────────
  if (!canView()) {
    return (
      <div className="max-w-7xl mx-auto p-2 h-[92vh] flex items-center justify-center">
        <p className="text-[11px] font-black uppercase text-slate-400">Access Denied</p>
      </div>
    );
  }

  const statusColor = (s) => {
    if (s === "Signed")   return "bg-emerald-500/10 text-emerald-500 border-emerald-200";
    if (s === "Rejected") return "bg-rose-500/10 text-rose-500 border-rose-200";
    return "bg-amber-500/10 text-amber-500 border-amber-200";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3 p-2 font-sans text-[var(--text-main)] h-[92vh] flex flex-col overflow-hidden">
      <Toaster position="top-right" />

      {/* CONFIRM */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-[260px] rounded-2xl p-5 border border-[var(--border-color)] text-center shadow-2xl">
              <AlertTriangle size={28} className="text-rose-500 mx-auto mb-3" />
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-5 leading-tight">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-1.5 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[9px] font-black border border-[var(--border-color)]">No</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-1.5 bg-rose-600 text-white rounded-xl text-[9px] font-black">Yes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <h2 className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tight">
          <Fingerprint size={22} className="text-violet-500" /> Digital Signature
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input type="text" placeholder="SEARCH..." onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-8 pr-2 py-1 text-[9px] font-black w-48 uppercase outline-none focus:border-violet-500" />
          </div>
          {(canCreate() || canRequest()) && (
            <button onClick={() => setShowModal(true)} className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">+ Request</button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex-1 flex flex-col overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-4 py-2.5 w-12 text-center">ID</th>
              <th className="px-4 py-2.5 w-40">Personnel</th>
              <th className="px-4 py-2.5 w-auto">Document</th>
              <th className="px-4 py-2.5 w-28 text-center">Type</th>
              <th className="px-4 py-2.5 w-24 text-center">Status</th>
              <th className="px-4 py-2.5 w-36 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30 bg-[var(--bg-card)]">
            {loading ? (
              <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-violet-500" /></td></tr>
            ) : currentData.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center text-[10px] font-black uppercase text-slate-400">No Records</td></tr>
            ) : currentData.map((r) => {
              const emp = employees.find(e => Number(e.userId) === Number(r.userId));
              return (
                <tr key={r.id} className="hover:bg-violet-500/5 transition-colors">
                  <td className="px-4 py-2 text-center font-bold text-slate-400 text-[11px]">#{r.id}</td>
                  <td className="px-4 py-2 truncate font-black uppercase text-[11px]">{emp?.username || `UID: ${r.userId}`}</td>
                  <td className="px-4 py-2 font-black uppercase text-violet-600 truncate text-[11px]">{r.documentName}</td>
                  <td className="px-4 py-2 text-center text-[10px] font-bold text-slate-500 truncate">{r.documentType || "---"}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded border font-black text-[8px] uppercase ${statusColor(r.status)}`}>{r.status || "Pending"}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewRecord({ ...r, username: emp?.username })} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-400 hover:text-violet-500 transition-all" title="View"><Eye size={13} /></button>
                      {canUpdate() && (
                        <button onClick={() => { setEditRecord(r); setEditForm({ documentName: r.documentName, documentType: r.documentType, remarks: r.remarks || "", documentFile: null }); }} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-indigo-400 hover:text-indigo-600 transition-all" title="Edit"><Edit3 size={13} /></button>
                      )}
                      {isManager && r.status !== "Signed" && (
                        <button onClick={() => { setSignRecord(r); setSignForm({ remarks: "", signatureImageBase64: "" }); }} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-emerald-400 hover:text-emerald-600 transition-all" title="Sign"><PenTool size={13} /></button>
                      )}
                      {canDelete() && (
                        <button onClick={() => setConfirm({ show: true, message: "Delete this record?", onConfirm: () => handleDelete(r.id) })} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-300 hover:text-rose-500 transition-all" title="Delete"><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-auto px-4 py-2 bg-[var(--bg-body)] border-t border-[var(--border-color)] flex items-center justify-between shrink-0">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 border border-[var(--border-color)] rounded bg-[var(--bg-card)] disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 border border-[var(--border-color)] rounded bg-[var(--bg-card)] disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewRecord && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewRecord(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-5 text-[var(--text-main)]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-3">
                <h3 className="text-[10px] font-black uppercase text-violet-500">Signature Details</h3>
                <button onClick={() => setViewRecord(null)}><X size={16} className="text-slate-400 hover:text-rose-500" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <ViewBox label="Personnel"    value={viewRecord.username || `UID: ${viewRecord.userId}`} />
                <ViewBox label="Status"       value={viewRecord.status || "Pending"} />
                <ViewBox label="Document"     value={viewRecord.documentName} />
                <ViewBox label="Type"         value={viewRecord.documentType || "---"} />
                <ViewBox label="Requested By" value={`UID: ${viewRecord.requestedBy}`} />
                <ViewBox label="Created"      value={viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleDateString() : "---"} />
              </div>
              {viewRecord.remarks && (
                <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)] mb-3">
                  <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Remarks</p>
                  <p className="text-[10px] font-medium italic">"{viewRecord.remarks}"</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleViewDoc(viewRecord.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[9px] font-black uppercase text-violet-500 hover:bg-violet-500/10 transition-all">
                  <FileText size={12} /> View Doc
                </button>
                {viewRecord.status === "Signed" && (
                  <button onClick={() => handleDownload(viewRecord.id, viewRecord.documentName)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all">
                    <Download size={12} /> Download
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REQUEST MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-5 text-[var(--text-main)]">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-3">
                <h3 className="text-[10px] font-black uppercase text-violet-500 flex items-center gap-1.5"><Plus size={13} /> Request Signature</h3>
                <button onClick={() => { setShowModal(false); setFormData(EMPTY_FORM); setEmpSearchQuery(""); }}><X size={16} className="text-slate-400 hover:text-rose-500" /></button>
              </div>
              <form onSubmit={handleRequest} className="space-y-2">
                {isManager && (
                  <div className="relative" ref={dropdownRef}>
                    <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Personnel *</p>
                    <input type="text" placeholder="Search employee..." className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[10px] font-black outline-none focus:border-violet-500 text-[var(--text-main)]" value={empSearchQuery} onFocus={() => setShowDropdown(true)} onChange={(e) => { setEmpSearchQuery(e.target.value); setShowDropdown(true); }} />
                    {showDropdown && (
                      <div className="absolute z-[120] w-full mt-0.5 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-lg max-h-32 overflow-y-auto">
                        {employees.filter(e => e.username.toLowerCase().includes(empSearchQuery.toLowerCase())).map(emp => (
                          <button key={emp.userId} type="button" onClick={() => { setFormData({ ...formData, userId: emp.userId }); setEmpSearchQuery(emp.username); setShowDropdown(false); }} className="w-full px-3 py-1.5 text-left hover:bg-violet-500/10 border-b border-[var(--border-color)] last:border-0 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase text-[var(--text-main)]">{emp.username}</span>
                            {emp.type === "onboarding" && <span className="text-[8px] font-black text-indigo-400 uppercase shrink-0">Onboarding</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <SigField label="Document Name *" required value={formData.documentName} onChange={e => setFormData({ ...formData, documentName: e.target.value })} />
                  <SigField label="Document Type *" required value={formData.documentType} onChange={e => setFormData({ ...formData, documentType: e.target.value })} placeholder="e.g. Contract" />
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Document File *</p>
                  <input required type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => setFormData({ ...formData, documentFile: e.target.files[0] })} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold text-[var(--text-main)] outline-none file:mr-2 file:text-[9px] file:font-black file:uppercase file:border-0 file:bg-violet-600 file:text-white file:px-2 file:py-0.5 file:rounded cursor-pointer" />
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Remarks</p>
                  <textarea rows="2" className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold outline-none text-[var(--text-main)] resize-none" onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                </div>
                <button type="submit" className="w-full py-2 bg-violet-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Submit Request</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPDATE MODAL */}
      <AnimatePresence>
        {editRecord && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-5 text-[var(--text-main)]">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-3">
                <h3 className="text-[10px] font-black uppercase text-indigo-500 flex items-center gap-1.5"><Edit3 size={13} /> Update Record</h3>
                <button onClick={() => setEditRecord(null)}><X size={16} className="text-slate-400 hover:text-rose-500" /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <SigField label="Document Name *" required value={editForm.documentName} onChange={e => setEditForm({ ...editForm, documentName: e.target.value })} />
                  <SigField label="Document Type *" required value={editForm.documentType} onChange={e => setEditForm({ ...editForm, documentType: e.target.value })} />
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Replace Document File</p>
                  <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => setEditForm({ ...editForm, documentFile: e.target.files[0] })} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold text-[var(--text-main)] outline-none file:mr-2 file:text-[9px] file:font-black file:uppercase file:border-0 file:bg-indigo-600 file:text-white file:px-2 file:py-0.5 file:rounded cursor-pointer" />
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Remarks</p>
                  <textarea rows="2" value={editForm.remarks} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold outline-none text-[var(--text-main)] resize-none" onChange={e => setEditForm({ ...editForm, remarks: e.target.value })} />
                </div>
                <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Save Changes</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIGN MODAL */}
      <AnimatePresence>
        {signRecord && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-5 text-[var(--text-main)]">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-3">
                <h3 className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1.5"><PenTool size={13} /> Sign Document</h3>
                <button onClick={() => setSignRecord(null)}><X size={16} className="text-slate-400 hover:text-rose-500" /></button>
              </div>
              <div className="mb-3 p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Document</p>
                <p className="text-[11px] font-black uppercase">{signRecord.documentName}</p>
              </div>
              <form onSubmit={handleSign} className="space-y-2">
                <div>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Signature (Base64 / Text)</p>
                  <textarea rows="2" placeholder="Paste signature or leave blank..." className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold outline-none text-[var(--text-main)] resize-none" onChange={e => setSignForm({ ...signForm, signatureImageBase64: e.target.value })} />
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Remarks</p>
                  <textarea rows="2" className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold outline-none text-[var(--text-main)] resize-none" onChange={e => setSignForm({ ...signForm, remarks: e.target.value })} />
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Confirm Signature</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ViewBox = ({ label, value }) => (
  <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
    <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
    <p className="text-[10px] font-black uppercase truncate">{value || "---"}</p>
  </div>
);

const SigField = ({ label, ...props }) => (
  <div>
    <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">{label}</p>
    <input {...props} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold outline-none focus:border-violet-500 transition-colors text-[var(--text-main)]" />
  </div>
);
