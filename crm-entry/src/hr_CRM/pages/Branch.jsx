// // import { useEffect, useState } from "react";
// // import {
// //   getBranches,
// //   createBranch,
// //   updateBranch,
// //   deleteBranch,
// // } from "../api/api.branch";

// // export default function Branch() {
// //   const [branches, setBranches] = useState([]);
// //   const [formData, setFormData] = useState({
// //     branchId: "",
// //     branchName: "",
// //     location: "",
// //     status: "Active",
// //   });
// //   const [editingId, setEditingId] = useState(null);
// //   const [loading, setLoading] = useState(false);

// //   // ================= LOAD BRANCHES =================
// //   const loadBranches = async () => {
// //     try {
// //       const res = await getBranches();
// //       setBranches(res.data);
// //     } catch (error) {
// //       console.error("Error loading branches:", error);
// //     }
// //   };

// //   useEffect(() => {
// //     loadBranches();
// //   }, []);

// //   // ================= HANDLE INPUT =================
// //   const handleChange = (e) => {
// //     setFormData({ ...formData, [e.target.name]: e.target.value });
// //   };

// //   // ================= HANDLE SUBMIT =================
// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setLoading(true);

// //     try {
// //       if (editingId) {
// //         await updateBranch(editingId, formData);
// //         alert("Branch Updated Successfully ✅");
// //       } else {
// //         await createBranch(formData);
// //         alert("Branch Added Successfully ✅");
// //       }

// //       setFormData({ branchId: "", branchName: "", location: "", status: "Active" });
// //       setEditingId(null);
// //       loadBranches();
// //     } catch (error) {
// //       console.error("Error saving branch:", error);
// //       alert("Operation failed ❌");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // ================= HANDLE EDIT =================
// //   const handleEdit = (branch) => {
// //     setFormData({
// //       branchId: branch.branchId,
// //       branchName: branch.branchName,
// //       location: branch.location,
// //       status: branch.status,
// //     });
// //     setEditingId(branch.branchId);
// //     window.scrollTo({ top: 0, behavior: "smooth" });
// //   };

// //   // ================= HANDLE DELETE =================
// //   const handleDelete = async (branchId) => {
// //     if (!window.confirm("Are you sure you want to delete this branch?")) return;
// //     try {
// //       await deleteBranch(branchId);
// //       loadBranches();
// //       alert("Branch Deleted Successfully 🗑️");
// //     } catch (error) {
// //       console.error("Error deleting branch:", error);
// //     }
// //   };

// //   // ================= RENDER =================
// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8">
// //       <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-10">
// //         Branch Management
// //       </h1>

// //       {/* FORM */}
// //       <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-8 mb-10 border border-gray-200">
// //         <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-6 items-center">
// //           <select
// //             name="branchId"
// //             value={formData.branchId}
// //             onChange={handleChange}
// //             className="border p-4 rounded-xl focus:ring-4 focus:ring-blue-300 outline-none transition"
// //             required
// //           >
// //             <option value="">Select Branch</option>
// //             {branches.map((b) => (
// //               <option key={b.branchId} value={b.branchId}>
// //                 {b.branchId}. {b.branchName}
// //               </option>
// //             ))}
// //           </select>

// //           <input
// //             type="text"
// //             name="location"
// //             placeholder="Location"
// //             value={formData.location}
// //             onChange={handleChange}
// //             className="border p-4 rounded-xl focus:ring-4 focus:ring-purple-300 outline-none transition"
// //             required
// //           />

// //           <select
// //             name="status"
// //             value={formData.status}
// //             onChange={handleChange}
// //             className="border p-4 rounded-xl focus:ring-4 focus:ring-pink-300 outline-none transition"
// //             required
// //           >
// //             <option value="Active">Active</option>
// //             <option value="Inactive">Inactive</option>
// //           </select>

// //           <button
// //             type="submit"
// //             disabled={loading}
// //             className={`rounded-xl px-6 py-4 text-white font-semibold transition-all duration-300 shadow-lg ${
// //               editingId
// //                 ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105"
// //                 : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105"
// //             } disabled:opacity-50`}
// //           >
// //             {editingId ? "Update Branch" : "Add Branch"}
// //           </button>
// //         </form>
// //       </div>

// //       {/* TABLE */}
// //       <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl p-8 border border-gray-200">
// //         <table className="w-full text-left">
// //           <thead>
// //             <tr className="border-b text-gray-600 text-lg">
// //               <th className="py-4">ID</th>
// //               <th>Name</th>
// //               <th>Location</th>
// //               <th>Status</th>
// //               <th className="text-center">Actions</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {branches.length === 0 && (
// //               <tr>
// //                 <td colSpan={5} className="py-6 text-center text-gray-400">
// //                   No branches found
// //                 </td>
// //               </tr>
// //             )}
// //             {branches.map((branch) => (
// //               <tr key={branch.branchId} className="border-b hover:bg-blue-50 transition duration-200">
// //                 <td className="py-4 font-medium">{branch.branchId}</td>
// //                 <td className="font-semibold text-blue-700">{branch.branchName}</td>
// //                 <td>{branch.location}</td>
// //                 <td>
// //                   <span
// //                     className={`px-4 py-1 rounded-full text-sm font-medium ${
// //                       branch.status.toLowerCase() === "active"
// //                         ? "bg-green-100 text-green-700"
// //                         : "bg-red-100 text-red-700"
// //                     }`}
// //                   >
// //                     {branch.status}
// //                   </span>
// //                 </td>
// //                 <td className="text-center space-x-3">
// //                   <button
// //                     onClick={() => handleEdit(branch)}
// //                     className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition shadow-md"
// //                   >
// //                     Edit
// //                   </button>
// //                   <button
// //                     onClick={() => handleDelete(branch.branchId)}
// //                     className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition shadow-md"
// //                   >
// //                     Delete
// //                   </button>
// //                 </td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>
// //     </div>
// //   );
// // }







































//  import { useEffect, useState } from "react";
// import {
//   getBranches,
//   createBranch,
//   updateBranch,
//   deleteBranch,
// } from "../api/api.branch";

// export default function Branch() {
//   const [branches, setBranches] = useState([]);
//   const [filteredBranches, setFilteredBranches] = useState([]);
//   const [formData, setFormData] = useState({
//     branchName: "",
//     location: "",
//     status: "Active",
//   });
//   const [loading, setLoading] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [statusFilter, setStatusFilter] = useState(""); // Status filter for table

//   // ================= LOAD BRANCHES =================
//   const loadBranches = async () => {
//     try {
//       const res = await getBranches();
//       setBranches(res.data);
//       filterBranches(res.data, statusFilter);
//     } catch (error) {
//       console.error("Error loading branches:", error);
//     }
//   };

//   useEffect(() => {
//     loadBranches();
//   }, []);

//   // ================= HANDLE INPUT =================
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // ================= HANDLE STATUS FILTER =================
//   const handleStatusFilter = (e) => {
//     const value = e.target.value;
//     setStatusFilter(value);
//     filterBranches(branches, value);
//   };

//   const filterBranches = (allBranches, status) => {
//     if (!status) {
//       setFilteredBranches(allBranches);
//     } else {
//       setFilteredBranches(
//         allBranches.filter((b) => b.status.toLowerCase() === status.toLowerCase())
//       );
//     }
//   };

//   // ================= HANDLE SUBMIT =================
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.branchName || !formData.location) {
//       alert("Please enter Branch Name and Location");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await getBranches();
//       const exists = res.data.some(
//         (b) =>
//           b.branchName.toLowerCase() === formData.branchName.toLowerCase() &&
//           b.location.toLowerCase() === formData.location.toLowerCase() &&
//           b.branchId !== editingId
//       );

//       if (exists) {
//         alert("Branch already exists in this location ❌");
//         setLoading(false);
//         return;
//       }

//       if (editingId) {
//         await updateBranch(editingId, formData);
//         alert("Branch Updated Successfully ✅");
//       } else {
//         await createBranch(formData);
//         alert("Branch Added Successfully ✅");
//       }

//       setFormData({ branchName: "", location: "", status: "Active" });
//       setEditingId(null);
//       loadBranches();
//     } catch (error) {
//       console.error("Error saving branch:", error);
//       alert("Operation failed ❌");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ================= HANDLE EDIT =================
//   const handleEdit = (branch) => {
//     setFormData({
//       branchName: branch.branchName,
//       location: branch.location,
//       status: branch.status,
//     });
//     setEditingId(branch.branchId);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   // ================= HANDLE DELETE =================
//   const handleDelete = async (branchId) => {
//     if (!window.confirm("Are you sure you want to delete this branch?")) return;
//     try {
//       await deleteBranch(branchId);
//       alert("Branch Deleted Successfully 🗑️");
//       loadBranches();
//     } catch (error) {
//       console.error("Error deleting branch:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8">
//       <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-10">
//         Branch Management
//       </h1>

//       {/* FORM */}
//       <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-8 mb-10 border border-gray-200">
//         <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-6 items-center">
          
//           {/* Branch Name */}
//           <div className="flex flex-col">
//             <label className="font-semibold mb-1">Company Name</label>
//             <input
//               type="text"
//               name="branchName"
//               placeholder="Enter company name"
//               value={formData.branchName}
//               onChange={handleChange}
//               className="border p-4 rounded-xl outline-none focus:ring-4 focus:ring-blue-300"
//               required
//             />
//           </div>

//           {/* Location */}
//           <div className="flex flex-col">
//             <label className="font-semibold mb-1">Location</label>
//             <input
//               type="text"
//               name="location"
//               placeholder="Enter location (e.g., Madhapur, Hitech City)"
//               value={formData.location}
//               onChange={handleChange}
//               className="border p-4 rounded-xl outline-none focus:ring-4 focus:ring-purple-300"
//               required
//             />
//           </div>

//           {/* Status */}
//           <div className="flex flex-col">
//             <label className="font-semibold mb-1">Select Status</label>
//             <select
//               name="status"
//               value={formData.status}
//               onChange={handleChange}
//               className="border p-4 rounded-xl outline-none focus:ring-4 focus:ring-pink-300"
//               required
//             >
//               <option value="">Select Status</option>
//               <option value="Active">Active</option>
//               <option value="Inactive">Inactive</option>
//             </select>
//           </div>

//           {/* Submit Button */}
//           <div className="flex items-end">
//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition disabled:opacity-50"
//             >
//               {editingId ? "Update Branch" : "Add Branch"}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* STATUS FILTER */}
//       <div className="max-w-4xl mx-auto mb-6 flex justify-end">
//         <select
//           value={statusFilter}
//           onChange={handleStatusFilter}
//           className="border p-3 rounded-xl outline-none focus:ring-4 focus:ring-indigo-300"
//         >
//           <option value="">Select Status</option>
//           <option value="Active">Active</option>
//           <option value="Inactive">Inactive</option>
//         </select>
//       </div>

//       {/* TABLE */}
//       <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl p-8 border border-gray-200">
//         <table className="w-full text-left">
//           <thead>
//             <tr className="border-b text-gray-600 text-lg">
//               <th className="py-4">ID</th>
//               <th>Company Name</th>
//               <th>Location</th>
//               <th>Status</th>
//               <th className="text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredBranches.length === 0 && (
//               <tr>
//                 <td colSpan={5} className="py-6 text-center text-gray-400">
//                   No branches found
//                 </td>
//               </tr>
//             )}
//             {filteredBranches.map((branch) => (
//               <tr key={branch.branchId} className="border-b hover:bg-blue-50 transition duration-200">
//                 <td className="py-4 font-medium">{branch.branchId}</td>
//                 <td className="font-semibold text-blue-700">{branch.branchName}</td>
//                 <td>{branch.location}</td>
//                 <td>
//                   <span
//                     className={`px-4 py-1 rounded-full text-sm font-medium ${
//                       branch.status.toLowerCase() === "active"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-red-100 text-red-700"
//                     }`}
//                   >
//                     {branch.status}
//                   </span>
//                 </td>
//                 <td className="text-center space-x-3">
//                   <button
//                     onClick={() => handleEdit(branch)}
//                     className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition shadow-md"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(branch.branchId)}
//                     className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition shadow-md"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }





































// import { useEffect, useState } from "react";
// import {
//   getBranches,
//   createBranch,
//   updateBranch,
//   deleteBranch,
// } from "../api/api.branch";

// /* =========================
//    BRANCH PAGE (PREMIUM)
// ========================= */
// export default function Branch() {
//   const [branches, setBranches] = useState([]);
//   const [filteredBranches, setFilteredBranches] = useState([]);

//   const [statusFilter, setStatusFilter] = useState("");
//   const [loading, setLoading] = useState(false);

//   const [showModal, setShowModal] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   const [formData, setFormData] = useState({
//     branchName: "",
//     location: "",
//     status: "Active",
//   });

//   /* =========================
//      LOAD BRANCHES (UNCHANGED)
//   ========================= */
//   const loadBranches = async () => {
//     try {
//       const res = await getBranches();
//       setBranches(res.data);
//       filterBranches(res.data, statusFilter);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     loadBranches();
//   }, []);

//   /* =========================
//      FILTER (UNCHANGED)
//   ========================= */
//   const filterBranches = (data, status) => {
//     if (!status) setFilteredBranches(data);
//     else
//       setFilteredBranches(
//         data.filter(
//           (b) => b.status.toLowerCase() === status.toLowerCase()
//         )
//       );
//   };

//   const handleStatusFilter = (e) => {
//     const value = e.target.value;
//     setStatusFilter(value);
//     filterBranches(branches, value);
//   };

//   /* =========================
//      FORM HANDLING (UNCHANGED)
//   ========================= */
//   const handleChange = (e) =>
//     setFormData({ ...formData, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       if (editingId) {
//         await updateBranch(editingId, formData);
//       } else {
//         await createBranch(formData);
//       }

//       closeModal();
//       loadBranches();
//     } catch (err) {
//       alert("Operation failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = (branch) => {
//     setFormData({
//       branchName: branch.branchName,
//       location: branch.location,
//       status: branch.status,
//     });
//     setEditingId(branch.branchId);
//     setShowModal(true);
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete this branch?")) return;
//     await deleteBranch(id);
//     loadBranches();
//   };

//   const closeModal = () => {
//     setShowModal(false);
//     setEditingId(null);
//     setFormData({ branchName: "", location: "", status: "Active" });
//   };

//   /* =========================
//      UI
//   ========================= */
//   return (
//     <div className="h-full flex flex-col overflow-hidden">

//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
//             Branch Management
//           </h2>
//           <p className="text-sm text-gray-500">
//             Create, update and manage company branches
//           </p>
//         </div>

//         <div className="flex items-center gap-4">
//           <select
//             value={statusFilter}
//             onChange={handleStatusFilter}
//             className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
//           >
//             <option value="">All</option>
//             <option value="Active">Active</option>
//             <option value="Inactive">Inactive</option>
//           </select>

//           <button
//             onClick={() => setShowModal(true)}
//             className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:opacity-90 transition"
//           >
//             + Add Branch
//           </button>
//         </div>
//       </div>

//       {/* TABLE AREA (SCROLL FIXED) */}
//       <div className="flex-1 overflow-auto pr-1">
//         <div className="rounded-2xl overflow-hidden border border-indigo-100 shadow-xl bg-white">
//           <table className="w-full text-sm">
//             <thead className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase">
//               <tr>
//                 <th className="px-6 py-4 text-left">Company</th>
//                 <th className="px-6 py-4 text-left">Location</th>
//                 <th className="px-6 py-4 text-left">Status</th>
//                 <th className="px-6 py-4 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-100">
//               {filteredBranches.map((b, i) => (
//                 <tr
//                   key={b.branchId}
//                   className={`hover:bg-indigo-50 ${
//                     i % 2 === 0 ? "bg-slate-50" : "bg-white"
//                   }`}
//                 >
//                   <td className="px-6 py-4 font-semibold text-gray-800">
//                     {b.branchName}
//                   </td>
//                   <td className="px-6 py-4 text-gray-600">
//                     {b.location}
//                   </td>
//                   <td className="px-6 py-4">
//                     <span
//                       className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                         b.status === "Active"
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-600"
//                       }`}
//                     >
//                       {b.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-center space-x-2">
//                     <button
//                       onClick={() => handleEdit(b)}
//                       className="text-indigo-600 font-medium hover:underline"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDelete(b.branchId)}
//                       className="text-red-600 font-medium hover:underline"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}

//               {filteredBranches.length === 0 && (
//                 <tr>
//                   <td colSpan="4" className="text-center py-10 text-gray-400">
//                     No branches found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* MODAL */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div
//             className="absolute inset-0 bg-black/30 backdrop-blur-sm"
//             onClick={closeModal}
//           />

//           <form
//             onSubmit={handleSubmit}
//             className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-indigo-200 p-8"
//           >
//             <h3 className="text-2xl font-bold text-indigo-700 mb-6">
//               {editingId ? "Edit Branch" : "Add Branch"}
//             </h3>

//             <div className="space-y-4">
//               <input
//                 name="branchName"
//                 placeholder="Company Name"
//                 value={formData.branchName}
//                 onChange={handleChange}
//                 className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
//                 required
//               />

//               <input
//                 name="location"
//                 placeholder="Location"
//                 value={formData.location}
//                 onChange={handleChange}
//                 className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
//                 required
//               />

//               <select
//                 name="status"
//                 value={formData.status}
//                 onChange={handleChange}
//                 className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
//               >
//                 <option>Active</option>
//                 <option>Inactive</option>
//               </select>
//             </div>

//             <div className="mt-8 flex justify-end gap-3">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700"
//               >
//                 {loading ? "Saving..." : "Save"}
//               </button>
//               <button
//                 type="button"
//                 onClick={closeModal}
//                 className="bg-gray-200 px-6 py-2.5 rounded-xl hover:bg-gray-300"
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// }





























import { useEffect, useState } from "react";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../api/api.branch";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [formData, setFormData] = useState({
    branchName: "",
    location: "",
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const loadBranches = async () => {
    const res = await getBranches();
    setBranches(res.data);
    filterBranches(res.data, statusFilter);
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const filterBranches = (all, status) => {
    if (!status) setFilteredBranches(all);
    else
      setFilteredBranches(
        all.filter((b) => b.status.toLowerCase() === status.toLowerCase())
      );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) await updateBranch(editingId, formData);
    else await createBranch(formData);

    setFormData({ branchName: "", location: "", status: "Active" });
    setEditingId(null);
    loadBranches();
    setLoading(false);
  };

  const handleEdit = (b) => {
    setFormData(b);
    setEditingId(b.branchId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this branch?")) {
      await deleteBranch(id);
      loadBranches();
    }
  };

  return (
  <div className="h-full overflow-y-auto pr-1">

    {/* HEADER */}
    <div className="mb-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
        Branch Management
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        Create, update and manage company branches
      </p>
    </div>

    {/* FORM CARD */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <form
        className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="text-xs font-medium text-gray-600">
            Company Name
          </label>
          <input
            value={formData.branchName}
            onChange={(e) =>
              setFormData({ ...formData, branchName: e.target.value })
            }
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">
            Location
          </label>
          <input
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <button
          disabled={loading}
          className="h-[38px] bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          {editingId ? "Update Branch" : "Add Branch"}
        </button>
      </form>
    </div>

    {/* FILTER */}
    <div className="flex justify-end mb-4">
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          filterBranches(branches, e.target.value);
        }}
        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
      >
        <option value="">All Status</option>
        <option>Active</option>
        <option>Inactive</option>
      </select>
    </div>

    {/* TABLE CARD */}
    <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden mb-6">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4 text-left">ID</th>
            <th className="px-6 py-4 text-left">Company</th>
            <th className="px-6 py-4 text-left">Location</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {filteredBranches.map((b, index) => (
            <tr
              key={b.branchId}
              className={`transition hover:bg-indigo-50 ${
                index % 2 === 0 ? "bg-slate-50" : "bg-white"
              }`}
            >
              <td className="px-6 py-4 text-gray-500">{b.branchId}</td>
              <td className="px-6 py-4 font-semibold text-gray-800">
                {b.branchName}
              </td>
              <td className="px-6 py-4 text-gray-600">{b.location}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    b.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {b.status}
                </span>
              </td>
              <td className="px-6 py-4 text-center space-x-2">
                <button
                  onClick={() => handleEdit(b)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(b.branchId)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {filteredBranches.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-10 text-gray-400">
                No branches found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

}
