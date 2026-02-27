// import { useEffect, useState } from "react";
// import {
//   getBranches,
//   createBranch,
//   updateBranch,
//   deleteBranch,
// } from "../api/api.branch";

// export default function Branch() {
//   const [branches, setBranches] = useState([]);
//   const [filteredBranches, setFilteredBranches] = useState([]);
//   const [statusFilter, setStatusFilter] = useState("Active");

//   const [showModal, setShowModal] = useState(false);
//   const [editingBranch, setEditingBranch] = useState(null);

//   const [formData, setFormData] = useState({
//     branchName: "",
//     location: "",
//     status: "Active",
//   });

//   const [loading, setLoading] = useState(false);

//   /* ================= LOAD ================= */

//   const loadBranches = async () => {
//     try {
//       setLoading(true);
//       const data = await getBranches();
//       const safeData = Array.isArray(data) ? data : [];
//       setBranches(safeData);
//       applyFilter(safeData, statusFilter);
//     } catch (error) {
//       console.error("Load Error:", error);
//       setBranches([]);
//       setFilteredBranches([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadBranches();
//   }, []);

//   /* ================= FILTER ================= */

//   const applyFilter = (data, filter) => {
//     if (filter === "All") {
//       setFilteredBranches(data);
//     } else {
//       setFilteredBranches(data.filter((b) => b.status === filter));
//     }
//   };

//   const handleFilterChange = (e) => {
//     const value = e.target.value;
//     setStatusFilter(value);
//     applyFilter(branches, value);
//   };

//   /* ================= FORM ================= */

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const openCreateModal = () => {
//     setEditingBranch(null);
//     setFormData({
//       branchName: "",
//       location: "",
//       status: "Active",
//     });
//     setShowModal(true);
//   };

//   const openEditModal = (branch) => {
//     setEditingBranch(branch);
//     setFormData({
//       branchName: branch.branchName || "",
//       location: branch.location || "",
//       status: branch.status || "Active",
//     });
//     setShowModal(true);
//   };

//   const closeModal = () => {
//     setShowModal(false);
//   };

//   /* ================= SUBMIT ================= */

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       if (editingBranch) {
//         await updateBranch(editingBranch.id, formData);
//       } else {
//         await createBranch(formData);
//       }

//       await loadBranches();
//       closeModal();
//     } catch (error) {
//       console.error("Submit Error:", error);
//     }
//   };

//   /* ================= DELETE ================= */

//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete this branch?")) return;

//     try {
//       await deleteBranch(id);
//       await loadBranches();
//     } catch (error) {
//       console.error("Delete Error:", error);
//     }
//   };

//   return (
//     <div className="h-full overflow-y-auto p-1">

//       {/* HEADER ROW */}
//       <div className="flex flex-wrap items-center justify-between mb-6 gap-4">

//         <div>
//           <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
//             Branch Management
//           </h2>
//           <p className="text-sm text-gray-500 mt-1">
//             Manage organization branches and status
//           </p>
//         </div>

//         <div className="flex items-center gap-3">

//           <div className="flex items-center gap-2">
//             <span className="text-sm font-medium text-gray-600">
//               Filter By:
//             </span>

//             <select
//               value={statusFilter}
//               onChange={handleFilterChange}
//               className="border rounded-xl px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
//             >
//               <option value="All">All</option>
//               <option value="Active">Active</option>
//               <option value="Inactive">Inactive</option>
//             </select>
//           </div>

//           <button
//             onClick={openCreateModal}
//             className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-xl shadow-md hover:opacity-90 transition text-sm font-medium"
//           >
//             + Add Branch
//           </button>
//         </div>
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
//         <div className="max-h-[500px] overflow-y-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider sticky top-0">
//               <tr>
//                 <th className="px-6 py-4 text-left">Branch Name</th>
//                 <th className="px-6 py-4 text-left">Location</th>
//                 <th className="px-6 py-4 text-left">Status</th>
//                 <th className="px-6 py-4 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-100">
//               {loading ? (
//                 <tr>
//                   <td colSpan="4" className="text-center py-10 text-gray-400">
//                     Loading...
//                   </td>
//                 </tr>
//               ) : filteredBranches.length === 0 ? (
//                 <tr>
//                   <td colSpan="4" className="text-center py-10 text-gray-400">
//                     No branches found
//                   </td>
//                 </tr>
//               ) : (
//                 filteredBranches.map((branch, index) => (
//                   <tr
//   key={branch.id ?? `branch-${index}`}
//   className={`transition hover:bg-indigo-50 ${
//     index % 2 === 0 ? "bg-slate-50" : "bg-white"
//   }`}
// >
//                     <td className="px-6 py-4 font-semibold text-gray-800">
//                       {branch.branchName}
//                     </td>
//                     <td className="px-6 py-4 text-gray-600">
//                       {branch.location}
//                     </td>
//                     <td className="px-6 py-4">
//                       <span
//                         className={`px-3 py-1 text-xs rounded-full ${
//                           branch.status === "Active"
//                             ? "bg-green-100 text-green-700"
//                             : "bg-red-100 text-red-700"
//                         }`}
//                       >
//                         {branch.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-center space-x-2">
//                       <button
//                         onClick={() => openEditModal(branch)}
//                         className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => handleDelete(branch.id)}
//                         className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
//                       >
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 ))
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
//               {editingBranch ? "Update Branch" : "Add Branch"}
//             </h3>

//             <form className="space-y-4" onSubmit={handleSubmit}>
//               <div>
//                 <label className="text-xs text-gray-600">Branch Name</label>
//                 <input
//                   name="branchName"
//                   value={formData.branchName}
//                   onChange={handleChange}
//                   required
//                   className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600">Location</label>
//                 <input
//                   name="location"
//                   value={formData.location}
//                   onChange={handleChange}
//                   required
//                   className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
//                 />
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600">Status</label>
//                 <select
//                   name="status"
//                   value={formData.status}
//                   onChange={handleChange}
//                   className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
//                 >
//                   <option value="Active">Active</option>
//                   <option value="Inactive">Inactive</option>
//                 </select>
//               </div>

//               <div className="flex justify-end gap-3 pt-3">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 text-sm rounded-lg border"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:opacity-90"
//                 >
//                   {editingBranch ? "Update" : "Add"}
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
import { Plus, Edit2, Trash2, MapPin, Building2, Filter, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api/api.branch";
import { Button } from "../components/ui/Buttons";
import { Card } from "../components/ui/Cards";
import { Badge } from "../components/ui/Badge";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Active"); // Initially "Active"
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, branch: null });
  const [editingBranch, setEditingBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    branchName: "", 
    location: "", 
    status: "Active" 
  });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await getBranches();
      const safeData = Array.isArray(data) ? data : [];
      setBranches(safeData);
      
      // Initially filter only Active branches
      const activeOnly = safeData.filter(b => b.status === "Active");
      setFilteredBranches(activeOnly);
    } catch (error) {
      toast.error("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBranches(); }, []);

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    if (val === "All") {
      setFilteredBranches(branches);
    } else {
      setFilteredBranches(branches.filter(b => b.status === val));
    }
  };

  const openModal = (branch = null) => {
    setEditingBranch(branch);
    setFormData(branch ? { 
      branchName: branch.branchName, 
      location: branch.location, 
      status: branch.status 
    } : { branchName: "", location: "", status: "Active" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading(editingBranch ? "Updating..." : "Creating...");
    try {
      if (editingBranch) {
        // Use branchId from Swagger response
        await updateBranch(editingBranch.branchId, formData);
        toast.success("Branch updated successfully", { id: tid });
      } else {
        await createBranch(formData);
        toast.success("Branch created successfully", { id: tid });
      }
      setShowModal(false);
      loadBranches();
    } catch (error) {
      toast.error("Operation failed", { id: tid });
    }
  };

  const handleDeactivate = async () => {
    const tid = toast.loading("Deactivating...");
    try {
      await deleteBranch(confirmDelete.branch.branchId);
      toast.success("Branch deactivated", { id: tid });
      setConfirmDelete({ show: false, branch: null });
      loadBranches();
    } catch (error) {
      toast.error("Failed to deactivate", { id: tid });
    }
  };

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Branch Directory</h2>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tighter">Manage office locations</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={statusFilter}
            onChange={handleFilterChange}
            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-50"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <Button variant="primary" className="py-1.5 text-xs" onClick={() => openModal()}>+ Add Branch</Button>
        </div>
      </div>

      {/* SLIM TABLE CARD */}
      <Card className="p-0 border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branch Name</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-400" size={24} /></td></tr>
              ) : filteredBranches.map((branch) => (
                <tr key={branch.branchId} className="hover:bg-slate-50/30 group transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-700 text-sm">
                    <div className="flex items-center gap-2">
                       <Building2 size={14} className="text-indigo-400" />
                       {branch.branchName}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-300" />
                      {branch.location}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <Badge type={branch.status === "Active" ? "success" : "error"}>{branch.status}</Badge>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(branch)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><Edit2 size={14}/></button>
                      <button onClick={() => setConfirmDelete({ show: true, branch })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL & VERIFICATION (Logic remains same as compact design) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
              <h3 className="text-base font-bold text-slate-800 mb-4">{editingBranch ? "Edit Branch" : "New Branch"}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input 
                  placeholder="Branch Name" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                  value={formData.branchName} 
                  onChange={(e) => setFormData({...formData, branchName: e.target.value})} 
                  required 
                />
                <input 
                  placeholder="Location" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                  required 
                />
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" className="flex-1 text-xs" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button variant="primary" className="flex-1 text-xs" type="submit">Save</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEACTIVATE VERIFICATION */}
      <AnimatePresence>
        {confirmDelete.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="relative bg-white rounded-xl p-6 max-w-xs w-full text-center shadow-2xl">
              <AlertTriangle className="mx-auto text-amber-500 mb-3" size={32} />
              <h3 className="font-bold text-slate-800">Deactivate Branch?</h3>
              <p className="text-xs text-slate-500 mt-1">This will change the status of <b>{confirmDelete.branch.branchName}</b> to Inactive.</p>
              <div className="flex gap-2 mt-5">
                <Button variant="secondary" className="flex-1 text-xs" onClick={() => setConfirmDelete({ show: false, branch: null })}>Cancel</Button>
                <Button variant="danger" className="flex-1 text-xs" onClick={handleDeactivate}>Deactivate</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}