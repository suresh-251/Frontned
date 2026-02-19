// import { useEffect, useState } from "react";
// import {
//   getEmployees,
//   createEmployee,
//   updateEmployee,
//   deleteEmployee,
// } from "../api/hr.api";

// export default function Employees() {
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [isEdit, setIsEdit] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);

//   const initialForm = {
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     emergencyContact: "",
//     departmentId: "",
//     designation: "",
//     address: "",
//     dateOfJoining: "",
//     salary: "",
//     status: "Active",
//   };

//   const [formData, setFormData] = useState(initialForm);

//   /* ================= FETCH ================= */

//   const fetchEmployees = async () => {
//     try {
//       setLoading(true);
//       const res = await getEmployees();
//       setEmployees(res.data);
//     } catch (error) {
//       console.error("Fetch error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEmployees();
//   }, []);

//   /* ================= HANDLE INPUT ================= */

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]:
//         name === "departmentId" || name === "salary"
//           ? value === ""
//             ? ""
//             : Number(value)
//           : value,
//     }));
//   };

//   /* ================= OPEN EDIT ================= */

//   const handleEdit = (emp) => {
//     setIsEdit(true);
//     setSelectedId(emp.employeeId);
//     setFormData({
//       ...emp,
//       departmentId: emp.departmentId ?? "",
//       salary: emp.salary ?? "",
//       lastName: emp.lastName ?? "",
//     });
//     setShowModal(true);
//   };

//   /* ================= SUBMIT ================= */

//   const handleSubmit = async () => {
//     try {
//       if (
//         !formData.firstName ||
//         !formData.lastName ||
//         !formData.email ||
//         !formData.departmentId ||
//         !formData.salary ||
//         !formData.dateOfJoining
//       ) {
//         alert("Please fill all required fields");
//         return;
//       }

//       console.log("Submitting:", formData);

//       if (isEdit) {
//         await updateEmployee(selectedId, formData);
//       } else {
//         await createEmployee(formData);
//       }

//       setShowModal(false);
//       setFormData(initialForm);
//       setIsEdit(false);
//       setSelectedId(null);
//       fetchEmployees();
//     } catch (error) {
//       console.error("Submit error:", error.response?.data || error);
//     }
//   };

//   /* ================= DELETE ================= */

//   const handleDelete = async (id) => {
//     try {
//       await deleteEmployee(id);
//       fetchEmployees();
//     } catch (error) {
//       console.error("Delete error:", error);
//     }
//   };

//   return (
//     <div>
//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Employees</h1>

//         <button
//           onClick={() => {
//             setIsEdit(false);
//             setFormData(initialForm);
//             setShowModal(true);
//           }}
//           className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
//         >
//           + Add Employee
//         </button>
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
//         {loading ? (
//           <p>Loading...</p>
//         ) : (
//           <table className="w-full text-left">
//             <thead>
//               <tr className="border-b">
//                 <th>ID</th>
//                 <th>Name</th>
//                 <th>Email</th>
//                 <th>Designation</th>
//                 <th>Status</th>
//                 <th>Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {employees?.map((emp) => (
//                 <tr key={emp.employeeId} className="border-b">
//                   <td>{emp.employeeId}</td>
//                   <td>
//                     {emp.firstName} {emp.lastName}
//                   </td>
//                   <td>{emp.email}</td>
//                   <td>{emp.designation}</td>
//                   <td>{emp.status}</td>
//                   <td className="space-x-3">
//                     <button
//                       onClick={() => handleEdit(emp)}
//                       className="text-blue-600 hover:underline"
//                     >
//                       Edit
//                     </button>

//                     <button
//                       onClick={() =>
//                         handleDelete(emp.employeeId)
//                       }
//                       className="text-red-600 hover:underline"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}

//               {employees?.length === 0 && (
//                 <tr>
//                   <td colSpan="6" className="text-center py-6 text-gray-400">
//                     No employees found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* ================= MODAL ================= */}
//       {showModal && (
//   <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    
//     <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">

//       {/* HEADER */}
//       <div className="p-6 border-b">
//         <h2 className="text-2xl font-bold">
//           {isEdit ? "Edit Employee" : "Add New Employee"}
//         </h2>
//       </div>

//       {/* BODY (Scrollable) */}
//       <div className="p-6 overflow-y-auto">

//         {/* PERSONAL DETAILS */}
//         <h3 className="font-semibold text-gray-700 mb-4">
//           Personal Details
//         </h3>

//         <div className="grid md:grid-cols-2 gap-4 mb-8">
//           <Input label="First Name *" name="firstName" value={formData.firstName} onChange={handleChange} />
//           <Input label="Last Name *" name="lastName" value={formData.lastName} onChange={handleChange} />
//           <Input label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} />
//           <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
//           <Input label="Emergency Contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
//           <Input label="Address" name="address" value={formData.address} onChange={handleChange} colSpan />
//         </div>

//         {/* JOB DETAILS */}
//         <h3 className="font-semibold text-gray-700 mb-4">
//           Job Details
//         </h3>

//         <div className="grid md:grid-cols-2 gap-4">
//           <Input label="Designation *" name="designation" value={formData.designation} onChange={handleChange} />

//           <Input
//             label="Department ID *"
//             name="departmentId"
//             type="number"
//             value={formData.departmentId}
//             onChange={handleChange}
//           />

//           <Input
//             label="Salary *"
//             name="salary"
//             type="number"
//             value={formData.salary}
//             onChange={handleChange}
//           />

//           <div>
//             <label className="text-sm font-medium">
//               Date Of Joining *
//             </label>
//             <input
//               type="date"
//               name="dateOfJoining"
//               value={formData.dateOfJoining}
//               onChange={handleChange}
//               className="w-full border p-2 rounded mt-1"
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium">
//               Status
//             </label>
//             <select
//               name="status"
//               value={formData.status}
//               onChange={handleChange}
//               className="w-full border p-2 rounded mt-1"
//             >
//               <option value="Active">Active</option>
//               <option value="Inactive">Inactive</option>
//               <option value="On Leave">On Leave</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* FOOTER (Sticky Buttons) */}
//       <div className="p-6 border-t flex justify-end gap-4 bg-gray-50 rounded-b-2xl">
//         <button
//           onClick={() => setShowModal(false)}
//           className="px-4 py-2 border rounded-lg hover:bg-gray-100"
//         >
//           Cancel
//         </button>

//         <button
//           onClick={handleSubmit}
//           className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
//         >
//           {isEdit ? "Update Employee" : "Save Employee"}
//         </button>
//       </div>
//     </div>
//   </div>
// )}

//     </div>
//   );
// }

// /* ===== Reusable Input Component ===== */

// function Input({ label, colSpan, ...props }) {
//   return (
//     <div className={colSpan ? "col-span-2" : ""}>
//       <label className="text-sm font-medium">{label}</label>
//       <input
//         {...props}
//         className="w-full border p-2 rounded mt-1"
//       />
//     </div>
//   );
// }















































// // src/pages/hr/Employees.jsx
// import { useEffect, useState } from "react";
// import api from "../../api/axios";
// import { getAdminUsers } from "../../api/admin/users.api";
// import { getDomains } from "../../api/admin/domains.api";

// // Reuse UsersTable style
// const EmployeesTable = ({
//   users = [],
//   onSelectUser,
// }) => {
//   return (
//     <table className="w-full text-sm">
//       <thead className="bg-slate-50 text-slate-600">
//         <tr>
//           <th className="px-4 py-3 text-left">ID</th>
//           <th className="px-4 py-3 text-left">Username</th>
//           <th className="px-4 py-3 text-left">Email</th>
//           <th className="px-4 py-3 text-left">Department</th>
//           <th className="px-4 py-3 text-left">Designation</th>
//         </tr>
//       </thead>
//       <tbody className="divide-y">
//         {users.map((u) => (
//           <tr
//             key={u.userId}
//             className="hover:bg-slate-50 cursor-pointer"
//             onClick={() => onSelectUser(u.userId)}
//           >
//             <td className="px-4 py-3 text-slate-600">{u.userId}</td>
//             <td className="px-4 py-3 font-medium text-slate-800">{u.username}</td>
//             <td className="px-4 py-3 text-slate-600">{u.email}</td>
//             <td className="px-4 py-3 text-slate-600">{u.department || "-"}</td>
//             <td className="px-4 py-3 text-slate-600">{u.designation || "-"}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

// export default function Employees() {
//   const [users, setUsers] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [createOpen, setCreateOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     name: "",
//     department: "",
//     designation: "",
//   });
//   const [editingUserId, setEditingUserId] = useState(null);
//   const [submitting, setSubmitting] = useState(false);

//   /* =======================
//      LOAD USERS
//   ======================= */
//   const loadUsers = async () => {
//     try {
//       setLoading(true);
//       const res = await getAdminUsers({ page: 1, pageSize: 100 });
//       setUsers(res?.users ?? res ?? []);
//     } catch (err) {
//       console.error("Failed to load users", err);
//       setUsers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =======================
//      LOAD DEPARTMENTS
//   ======================= */
//   const loadDepartments = async () => {
//     try {
//       const res = await getDomains();
//       setDepartments(Array.isArray(res) ? res : []);
//     } catch (err) {
//       console.error("Failed to load departments", err);
//       setDepartments([]);
//     }
//   };

//   useEffect(() => {
//     loadUsers();
//     loadDepartments();
//   }, []);

//   /* =======================
//      CREATE / EDIT EMPLOYEE
//   ======================= */
//   const handleSubmit = async () => {
//     if (!formData.username || !formData.email || !formData.name) {
//       alert("Username, email and name are required");
//       return;
//     }

//     try {
//       setSubmitting(true);

//       if (editingUserId) {
//         // Update employee
//         await api.put(`/api/admin/users/${editingUserId}`, formData);
//         alert("Employee updated successfully");
//       } else {
//         // Create employee
//         await api.post("/api/admin/users", formData);
//         alert("Employee created successfully");
//       }

//       setFormData({ username: "", email: "", name: "", department: "", designation: "" });
//       setEditingUserId(null);
//       setCreateOpen(false);
//       loadUsers();
//     } catch (err) {
//       console.error("Failed to submit employee", err);
//       alert("Error submitting employee");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   /* =======================
//      EDIT EMPLOYEE
//   ======================= */
//   const handleEdit = (user) => {
//     setFormData({
//       username: user.username || "",
//       email: user.email || "",
//       name: user.name || "",
//       department: user.department || "",
//       designation: user.designation || "",
//     });
//     setEditingUserId(user.userId);
//     setCreateOpen(true);
//   };

//   /* =======================
//      LOADING STATE
//   ======================= */
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
//           <p className="mt-4 text-gray-600 font-medium">Loading employees...</p>
//         </div>
//       </div>
//     );
//   }

//   /* =======================
//      MAIN UI
//   ======================= */
//   return (
//     <div className="min-h-screen p-6">
//       <div className="max-w-6xl mx-auto space-y-6">

//         {/* HEADER */}
//         <div className="flex justify-between items-center">
//           <h2 className="text-2xl font-bold">Employees Management</h2>
//           <button
//             onClick={() => setCreateOpen(true)}
//             className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all"
//           >
//             {editingUserId ? "Edit Employee" : "Add Employee"}
//           </button>
//         </div>

//         {/* EMPLOYEES TABLE */}
//         <div className="bg-white rounded-xl shadow overflow-hidden">
//           <EmployeesTable
//             users={users}
//             onSelectUser={handleEdit}
//           />
//         </div>

//         {/* CREATE / EDIT FORM */}
//         {createOpen && (
//           <div className="bg-white rounded-xl shadow p-6 mt-4">
//             <h3 className="text-lg font-semibold mb-4">
//               {editingUserId ? "Edit Employee" : "Add New Employee"}
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <input
//                 type="text"
//                 placeholder="Full Name"
//                 value={formData.name}
//                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                 className="border-2 border-gray-300 rounded-xl px-4 py-2"
//               />
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={formData.username}
//                 onChange={(e) => setFormData({ ...formData, username: e.target.value })}
//                 className="border-2 border-gray-300 rounded-xl px-4 py-2"
//               />
//               <input
//                 type="email"
//                 placeholder="Email"
//                 value={formData.email}
//                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                 className="border-2 border-gray-300 rounded-xl px-4 py-2"
//               />
//               <select
//                 value={formData.department}
//                 onChange={(e) => setFormData({ ...formData, department: e.target.value })}
//                 className="border-2 border-gray-300 rounded-xl px-4 py-2"
//               >
//                 <option value="">Select Department</option>
//                 {departments.map((d) => (
//                   <option key={d.domainId} value={d.domainName}>
//                     {d.domainName}
//                   </option>
//                 ))}
//               </select>
//               <input
//                 type="text"
//                 placeholder="Designation"
//                 value={formData.designation}
//                 onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
//                 className="border-2 border-gray-300 rounded-xl px-4 py-2"
//               />
//             </div>

//             <div className="mt-4 flex gap-2">
//               <button
//                 onClick={handleSubmit}
//                 disabled={submitting}
//                 className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-all"
//               >
//                 {submitting ? "Submitting..." : editingUserId ? "Update Employee" : "Add Employee"}
//               </button>
//               <button
//                 onClick={() => {
//                   setCreateOpen(false);
//                   setEditingUserId(null);
//                   setFormData({ username: "", email: "", name: "", department: "", designation: "" });
//                 }}
//                 className="bg-gray-200 px-6 py-2 rounded-xl hover:bg-gray-300 transition-all"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
















import { useEffect, useState } from "react";
import api from "../../api/axios";
import { getAdminUsers } from "../../api/admin/users.api";
import { getDomains } from "../../api/admin/domains.api";

/* ========================= EMPLOYEES TABLE (PREMIUM) ========================= */
const EmployeesTable = ({ users = [], onSelectUser }) => {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-indigo-100 shadow-xl bg-white">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider">
            <th className="px-6 py-4 text-left">ID</th>
            <th className="px-6 py-4 text-left">Username</th>
            <th className="px-6 py-4 text-left">Email</th>
            <th className="px-6 py-4 text-left">Department</th>
            <th className="px-6 py-4 text-left">Designation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u, index) => (
            <tr
              key={u.userId}
              onClick={() => onSelectUser(u)}
              className={`cursor-pointer transition-all hover:bg-indigo-50 ${
                index % 2 === 0 ? "bg-slate-50" : "bg-white"
              }`}
            >
              <td className="px-6 py-4 text-gray-500">{u.userId}</td>
              <td className="px-6 py-4 font-semibold text-gray-800">
                {u.username}
              </td>
              <td className="px-6 py-4 text-gray-600">{u.email}</td>
              <td className="px-6 py-4 text-gray-600">
                {u.department || "-"}
              </td>
              <td className="px-6 py-4 text-gray-600">
                {u.designation || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No employees found
        </div>
      )}
    </div>
  );
};

/* ========================= MAIN COMPONENT ========================= */
export default function Employees() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    department: "",
    designation: "",
  });

  /* ========================= LOAD USERS ========================= */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers({ page: 1, pageSize: 100 });
      setUsers(res?.users ?? res ?? []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  /* ========================= LOAD DEPARTMENTS ========================= */
  const loadDepartments = async () => {
    try {
      const res = await getDomains();
      setDepartments(Array.isArray(res) ? res : []);
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  /* ========================= CREATE / UPDATE ========================= */
  const handleSubmit = async () => {
    if (!formData.username || !formData.email || !formData.name) {
      alert("Username, Email & Name are required");
      return;
    }
    try {
      setSubmitting(true);
      if (editingUserId) {
        await api.put(`/api/admin/users/${editingUserId}`, formData);
      } else {
        await api.post("/api/admin/users", formData);
      }
      closeModal();
      loadUsers();
    } catch (err) {
      alert("Failed to submit employee");
    } finally {
      setSubmitting(false);
    }
  };

  /* ========================= EDIT ========================= */
  const handleEdit = (user) => {
    setFormData({
      username: user.username || "",
      email: user.email || "",
      name: user.name || "",
      department: user.department || "",
      designation: user.designation || "",
    });
    setEditingUserId(user.userId);
    setCreateOpen(true);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingUserId(null);
    setFormData({
      username: "",
      email: "",
      name: "",
      department: "",
      designation: "",
    });
  };

  /* ========================= LOADING ========================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  /* ========================= UI ========================= */
  return (
    <div className="h-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Employees Management
          </h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:opacity-90 transition"
          >
            + Add Employee
          </button>
        </div>

        {/* TABLE */}
        <EmployeesTable users={users} onSelectUser={handleEdit} />
      </div>

      {/* ========================= MODAL ========================= */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* MODAL CARD */}
          <div className="relative bg-white w-full max-w-3xl mx-4 rounded-2xl shadow-2xl border border-indigo-200 p-8 animate-scaleIn">
            <h3 className="text-2xl font-bold text-indigo-700 mb-6">
              {editingUserId ? "Edit Employee" : "Add New Employee"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[60vh] overflow-y-auto pr-2">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.domainId} value={d.domainName}>
                    {d.domainName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Designation"
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>

            <div className="mt-8 flex justify-end gap-3">
                            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition"
              >
                {submitting
                  ? "Submitting..."
                  : editingUserId
                  ? "Update Employee"
                  : "Add Employee"}
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-200 px-6 py-2.5 rounded-xl hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}