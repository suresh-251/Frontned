import { useEffect, useState } from "react";

import { Edit2, Trash2, Layers, X, AlertCircle, Loader2, MapPin, Building2 } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import toast, { Toaster } from "react-hot-toast";

import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/hr.dept";

import { getBranches } from "../api/api.branch";

import { Button } from "../components/ui/Buttons";

import { Card } from "../components/ui/Cards";



export default function Departments() {

  const [departments, setDepartments] = useState([]);

  const [allDepartments, setAllDepartments] = useState([]);

  const [branches, setBranches] = useState([]);

  const [selectedBranchId, setSelectedBranchId] = useState("");

 

  const [formData, setFormData] = useState({ departmentName: "", branchId: "" });

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });



  const loadData = async () => {

    setLoading(true);

    try {

      const [branchData, deptData] = await Promise.all([getBranches(), getDepartments()]);

      setBranches(Array.isArray(branchData) ? branchData : []);

      const dData = Array.isArray(deptData) ? deptData : [];

      setAllDepartments(dData);

      setDepartments(dData);

    } catch (error) {

      toast.error("Failed to load data");

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => { loadData(); }, []);



  useEffect(() => {

    if (!selectedBranchId) {

      setDepartments(allDepartments);

    } else {

      const filtered = allDepartments.filter(d => d.branchId === Number(selectedBranchId));

      setDepartments(filtered);

    }

  }, [selectedBranchId, allDepartments]);



  const activeBranches = branches.filter(b => b.status === "Active");



  const handleSubmit = async (e) => {

    e.preventDefault();

    const tid = toast.loading(editingId ? "Updating..." : "Creating...");

    try {

      const payload = {

        departmentName: formData.departmentName,

        branchId: Number(formData.branchId),

      };

      if (editingId) {

        await updateDepartment(editingId, payload);

        toast.success("Updated Successfully", { id: tid });

      } else {

        await createDepartment(payload);

        toast.success("Created Successfully", { id: tid });

      }

      setShowModal(false);

      loadData();

    } catch (error) {

      toast.error("Request Failed", { id: tid });

    }

  };



  const handleConfirmedDelete = async () => {

    const tid = toast.loading("Removing...");

    try {

      await deleteDepartment(confirmDelete.id);

      toast.success("Department Removed", { id: tid });

      setConfirmDelete({ show: false, id: null });

      loadData();

    } catch (error) {

      toast.error("Delete Failed", { id: tid });

    }

  };



  return (

    <div className="max-w-7xl mx-auto space-y-4 p-2">

      <Toaster position="top-right" />



      {/* COMPACT HEADER */}

      <div className="flex items-center justify-between px-1">

        <div>

          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">

            <Layers size={22} className="text-indigo-600" /> Departments

          </h2>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Organization Units</p>

        </div>



        <div className="flex items-center gap-2">

          <select

            value={selectedBranchId}

            onChange={(e) => setSelectedBranchId(e.target.value)}

            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-50"

          >

            <option value="">Filter: All Branches</option>

            {branches.map((b) => (

              <option key={b.branchId} value={b.branchId}>{b.branchName}</option>

            ))}

          </select>

          <Button variant="primary" className="py-2 px-4 text-xs font-bold" onClick={() => { setEditingId(null); setFormData({departmentName:"", branchId:""}); setShowModal(true); }}>

            + Add New

          </Button>

        </div>

      </div>



      {/* COMPACT GRID */}

      {loading ? (

        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">

          {departments.map((d) => {

            const branch = branches.find(b => b.branchId === d.branchId);

            return (

              <motion.div layout key={d.departmentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                <Card className="p-3 hover:border-indigo-200 transition-all border-slate-100 shadow-sm relative group bg-white">

                  <div className="flex flex-col h-full justify-between">

                    <div>

                      <div className="flex justify-between items-start mb-2">

                         <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">ID #{d.departmentId}</span>

                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                            <button onClick={() => { setEditingId(d.departmentId); setFormData({departmentName: d.departmentName, branchId: d.branchId}); setShowModal(true); }} className="p-1 hover:text-indigo-600 text-slate-400"><Edit2 size={13}/></button>

                            <button onClick={() => setConfirmDelete({ show: true, id: d.departmentId, name: d.departmentName })} className="p-1 hover:text-red-600 text-slate-400"><Trash2 size={13}/></button>

                         </div>

                      </div>

                     

                      {/* Bolder, Bigger Department Name */}

                      <h3 className="text-[16px] font-black text-slate-800 leading-tight mb-1">

                        {d.departmentName}

                      </h3>

                     

                      {/* Combined Branch - Location */}

                      <div className="flex items-center gap-1.5 text-slate-500">

                        <Building2 size={12} className="text-slate-300 shrink-0" />

                        <span className="text-[12px] font-semibold truncate italic">

                          {branch ? `${branch.branchName} - ${branch.location}` : "No Branch Assigned"}

                        </span>

                      </div>

                    </div>

                  </div>

                </Card>

              </motion.div>

            );

          })}

        </div>

      )}



      {/* MODAL - ADD/EDIT */}

      <AnimatePresence>

        {showModal && (

          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">

                <h3 className="font-black text-slate-800 tracking-tight">{editingId ? "Update Dept" : "New Dept"}</h3>

                <X size={18} className="text-slate-400 cursor-pointer" onClick={() => setShowModal(false)} />

              </div>

             

              <form onSubmit={handleSubmit} className="p-5 space-y-4">

                <div>

                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Branch (Active)</label>

                  <select

                    value={formData.branchId}

                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}

                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"

                    required

                  >

                    <option value="">Choose a branch...</option>

                    {activeBranches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName} - {b.location}</option>)}

                  </select>

                </div>



                <div>

                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Department Name</label>

                  <input

                    value={formData.departmentName}

                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}

                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"

                    placeholder="e.g. Sales & Marketing"

                    required

                  />

                </div>



                <div className="flex gap-2 pt-2">

                  <Button variant="secondary" className="flex-1 py-2.5 text-xs font-bold" type="button" onClick={() => setShowModal(false)}>Cancel</Button>

                  <Button variant="primary" className="flex-1 py-2.5 text-xs font-bold" type="submit">Save Record</Button>

                </div>

              </form>

            </motion.div>

          </div>

        )}

      </AnimatePresence>



      {/* VERIFY DELETE POPUP */}

      <AnimatePresence>

        {confirmDelete.show && (

          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">

              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">

                <AlertCircle size={24} />

              </div>

              <h3 className="font-black text-slate-800">Delete {confirmDelete.name}?</h3>

              <p className="text-[11px] text-slate-500 mt-2 font-medium">This action will permanently remove this department from the system.</p>

              <div className="flex gap-2 mt-5">

                <Button variant="secondary" className="flex-1 text-xs font-bold" onClick={() => setConfirmDelete({ show: false, id: null })}>Cancel</Button>

                <Button variant="danger" className="flex-1 text-xs font-bold" onClick={handleConfirmedDelete}>Confirm</Button>

              </div>

            </motion.div>

          </div>

        )}

      </AnimatePresence>

    </div>

  );

}