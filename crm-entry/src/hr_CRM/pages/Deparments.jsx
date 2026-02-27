// import { useEffect, useState } from "react";
// import {
//   getDepartments,
//   createDepartment,
//   updateDepartment,
//   deleteDepartment,
// } from "../api/hr.dept";
// import { getBranches } from "../api/api.branch";

// export default function Departments() {
//   const [departments, setDepartments] = useState([]);
//   const [allDepartments, setAllDepartments] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [selectedBranchId, setSelectedBranchId] = useState("");
//   const [formData, setFormData] = useState({
//     departmentName: "",
//     branchId: "",
//   });
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);

//   /* ================= LOAD DATA ================= */

//   const loadBranches = async () => {
//     try {
//       const data = await getBranches();
//       setBranches(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Branch Load Error:", error);
//       setBranches([]);
//     }
//   };

//   const loadDepartments = async () => {
//     try {
//       const data = await getDepartments();
//       setAllDepartments(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Department Load Error:", error);
//       setAllDepartments([]);
//     }
//   };

//   useEffect(() => {
//     loadBranches();
//     loadDepartments();
//   }, []);

//   /* ================= FILTER ================= */

//   useEffect(() => {
//     if (!selectedBranchId) {
//       setDepartments(allDepartments);
//     } else {
//       const filtered = allDepartments.filter(
//         (d) => d.branchId === Number(selectedBranchId)
//       );
//       setDepartments(filtered);
//     }
//   }, [selectedBranchId, allDepartments]);

//   /* ================= SUBMIT ================= */

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.departmentName || !formData.branchId) {
//       alert("Please fill all fields");
//       return;
//     }

//     try {
//       setLoading(true);

//       const payload = {
//         departmentName: formData.departmentName,
//         branchId: Number(formData.branchId),
//       };

//       if (editingId) {
//         await updateDepartment(editingId, payload);
//       } else {
//         await createDepartment(payload);
//       }

//       setFormData({ departmentName: "", branchId: "" });
//       setEditingId(null);
//       setShowModal(false);
//       await loadDepartments();
//     } catch (error) {
//       console.error("Submit Error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= EDIT ================= */

//   const handleEdit = (dept) => {
//     setFormData({
//       departmentName: dept.departmentName,
//       branchId: dept.branchId,
//     });
//     setEditingId(dept.departmentId);
//     setShowModal(true);
//   };

//   /* ================= DELETE ================= */

//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete this department?")) return;

//     try {
//       await deleteDepartment(id);
//       await loadDepartments();
//     } catch (error) {
//       console.error("Delete Error:", error);
//     }
//   };

//   /* ================= UI (UNCHANGED) ================= */

//   return (
//     <div className="h-full overflow-y-auto p-1">

//       {/* HEADER ROW */}
//       <div className="flex flex-wrap items-center justify-between mb-6 gap-4">

//         <div>
//           <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
//             Department Management
//           </h2>
//           <p className="text-sm text-gray-500 mt-1">
//             Manage departments across branches
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <span className="text-sm font-medium text-gray-600">
//             View By:
//           </span>
//           <select
//             value={selectedBranchId}
//             onChange={(e) => setSelectedBranchId(e.target.value)}
//             className="border rounded-xl px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
//           >
//             <option value="">All Branches</option>
//             {branches.map((b) => (
//               <option key={b.branchId} value={b.branchId}>
//                 {b.branchName} ({b.location})
//               </option>
//             ))}
//           </select>
//         </div>

//         <button
//           onClick={() => {
//             setFormData({ departmentName: "", branchId: "" });
//             setEditingId(null);
//             setShowModal(true);
//           }}
//           className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-xl shadow-md hover:opacity-90 transition text-sm font-medium"
//         >
//           + Add Department
//         </button>
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
//         <div className="max-h-[500px] overflow-y-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider sticky top-0">
//               <tr>
//                 <th className="px-6 py-4 text-left">ID</th>
//                 <th className="px-6 py-4 text-left">Department</th>
//                 <th className="px-6 py-4 text-left">Branch</th>
//                 <th className="px-6 py-4 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-100">
//               {departments.map((d, index) => {
//                 const branch = branches.find(
//                   (b) => b.branchId === d.branchId
//                 );

//                 return (
//                   <tr
//                     key={d.departmentId}
//                     className={`transition hover:bg-indigo-50 ${
//                       index % 2 === 0 ? "bg-slate-50" : "bg-white"
//                     }`}
//                   >
//                     <td className="px-6 py-4 text-gray-500">
//                       {d.departmentId}
//                     </td>
//                     <td className="px-6 py-4 font-semibold text-gray-800">
//                       {d.departmentName}
//                     </td>
//                     <td className="px-6 py-4 text-gray-600">
//                       {branch
//                         ? `${branch.branchName} (${branch.location})`
//                         : "N/A"}
//                     </td>
//                     <td className="px-6 py-4 text-center space-x-2">
//                       <button
//                         onClick={() => handleEdit(d)}
//                         className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => handleDelete(d.departmentId)}
//                         className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
//                       >
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}

//               {departments.length === 0 && (
//                 <tr>
//                   <td colSpan={4} className="text-center py-10 text-gray-400">
//                     No departments found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* MODAL */}
//       {showModal && (
//         <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
//           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
//             <h3 className="text-lg font-semibold mb-4">
//               {editingId ? "Update Department" : "Add Department"}
//             </h3>

//             <form className="space-y-4" onSubmit={handleSubmit}>
//               <div>
//                 <label className="text-xs text-gray-600">Select Branch</label>
//                 <select
//                   value={formData.branchId}
//                   onChange={(e) =>
//                     setFormData({ ...formData, branchId: e.target.value })
//                   }
//                   className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
//                   required
//                 >
//                   <option value="">Select Branch</option>
//                   {branches.map((b) => (
//                     <option key={b.branchId} value={b.branchId}>
//                       {b.branchName} ({b.location})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600">
//                   Department Name
//                 </label>
//                 <input
//                   value={formData.departmentName}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       departmentName: e.target.value,
//                     })
//                   }
//                   className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
//                   required
//                 />
//               </div>

//               <div className="flex justify-end gap-3 pt-3">
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   className="px-4 py-2 text-sm rounded-lg border"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   disabled={loading}
//                   className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:opacity-90"
//                 >
//                   {editingId ? "Update" : "Add"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



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