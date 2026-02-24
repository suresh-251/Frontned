// import { useEffect, useState } from "react";
// import {
//   getRecruitments,
//   createRecruitment,
// } from "../api/recruitment.api";
// import { getDepartments } from "../api/hr.dept";

// /* ================= TABLE ================= */
// const RecruitmentTable = ({ data = [], onView }) => {
//   return (
//     <div className="relative h-full rounded-2xl border border-indigo-100 shadow-xl bg-white overflow-auto">
//       <table className="min-w-full text-sm">
//         <thead className="sticky top-0 z-10">
//           <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider">
//             <th className="px-6 py-4 text-left">ID</th>
//             <th className="px-6 py-4 text-left">Candidate</th>
//             <th className="px-6 py-4 text-left">Position</th>
//             <th className="px-6 py-4 text-left">Status</th>
//             <th className="px-6 py-4 text-center">Actions</th>
//           </tr>
//         </thead>

//         <tbody className="divide-y divide-gray-100">
//           {data.map((r, index) => (
//             <tr
//               key={r.id}
//               className={`hover:bg-indigo-50 transition ${
//                 index % 2 === 0 ? "bg-slate-50" : "bg-white"
//               }`}
//             >
//               <td className="px-6 py-4">{r.id}</td>
//               <td className="px-6 py-4 font-semibold">
//                 {r.firstName} {r.lastName}
//               </td>
//               <td className="px-6 py-4">{r.appliedPosition}</td>
//               <td className="px-6 py-4">{r.status}</td>
//               <td className="px-6 py-4 text-center">
//                 <button
//                   onClick={() => onView(r)}
//                   className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-indigo-700 transition"
//                 >
//                   View
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {data.length === 0 && (
//         <div className="text-center py-10 text-gray-500">
//           No applications found
//         </div>
//       )}
//     </div>
//   );
// };

// /* ================= MAIN ================= */
// export default function Recruitment() {
//   const [data, setData] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [createOpen, setCreateOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [form, setForm] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     appliedPosition: "",
//     departmentId: "",
//     status: "",
//     source: "",
//   });

//   /* ================= LOAD DATA ================= */

//   const load = async () => {
//     try {
//       setLoading(true);
//       const res = await getRecruitments();
//       setData(res || []); // ✅ FIXED
//     } catch (error) {
//       console.error("Failed to load recruitments:", error);
//       setData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadDepartments = async () => {
//     try {
//       const res = await getDepartments();
//       setDepartments(res || []); // ✅ FIXED
//     } catch (error) {
//       console.error("Failed to load departments:", error);
//       setDepartments([]);
//     }
//   };

//   useEffect(() => {
//     load();
//     loadDepartments();
//   }, []);

//   /* ================= SUBMIT ================= */

//   const handleSubmit = async () => {
//     if (!form.firstName || !form.email || !form.departmentId) {
//       alert("Please fill required fields");
//       return;
//     }

//     const payload = {
//       ...form,
//       departmentId: Number(form.departmentId),
//       applicationDate: new Date().toISOString(),
//     };

//     try {
//       await createRecruitment(payload);

//       setCreateOpen(false);

//       setForm({
//         firstName: "",
//         lastName: "",
//         email: "",
//         phone: "",
//         appliedPosition: "",
//         departmentId: "",
//         status: "",
//         source: "",
//       });

//       load();
//     } catch (error) {
//       console.error("Create failed:", error);
//       alert("Failed to create application");
//     }
//   };

//   return (
//     <div className="flex flex-col h-full overflow-hidden">
//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
//           Recruitment Management
//         </h2>

//         <button
//           onClick={() => setCreateOpen(true)}
//           className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:opacity-90 transition"
//         >
//           + Add Candidate
//         </button>
//       </div>

//       <div className="flex-1 min-h-0">
//         {loading ? (
//           <div className="text-center py-10">Loading...</div>
//         ) : (
//           <RecruitmentTable data={data} onView={setSelected} />
//         )}
//       </div>

//       {/* VIEW MODAL */}
//       {selected && (
//         <Modal title="Candidate Details" onClose={() => setSelected(null)}>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <ProfileItem label="First Name" value={selected.firstName} />
//             <ProfileItem label="Last Name" value={selected.lastName} />
//             <ProfileItem label="Email" value={selected.email} />
//             <ProfileItem label="Phone" value={selected.phone} />
//             <ProfileItem label="Applied Position" value={selected.appliedPosition} />
//             <ProfileItem label="Department ID" value={selected.departmentId} />
//             <ProfileItem label="Status" value={selected.status} />
//             <ProfileItem label="Source" value={selected.source} />
//           </div>
//         </Modal>
//       )}

//       {/* CREATE MODAL */}
//       {createOpen && (
//         <Modal title="Add New Candidate" onClose={() => setCreateOpen(false)}>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

//             <Input
//               placeholder="First Name"
//               value={form.firstName}
//               onChange={(e) =>
//                 setForm({ ...form, firstName: e.target.value })
//               }
//             />

//             <Input
//               placeholder="Last Name"
//               value={form.lastName}
//               onChange={(e) =>
//                 setForm({ ...form, lastName: e.target.value })
//               }
//             />

//             <Input
//               placeholder="Email"
//               value={form.email}
//               onChange={(e) =>
//                 setForm({ ...form, email: e.target.value })
//               }
//             />

//             <Input
//               placeholder="Phone"
//               value={form.phone}
//               onChange={(e) =>
//                 setForm({ ...form, phone: e.target.value })
//               }
//             />

//             <Input
//               placeholder="Applied Position"
//               value={form.appliedPosition}
//               onChange={(e) =>
//                 setForm({ ...form, appliedPosition: e.target.value })
//               }
//             />

//             <select
//               value={form.departmentId}
//               onChange={(e) =>
//                 setForm({ ...form, departmentId: e.target.value })
//               }
//               className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
//             >
//               <option value="">Select Department</option>
//               {departments.map((d) => (
//                 <option key={d.departmentId} value={d.departmentId}>
//                   {d.departmentName}
//                 </option>
//               ))}
//             </select>

//             <Input
//               placeholder="Status"
//               value={form.status}
//               onChange={(e) =>
//                 setForm({ ...form, status: e.target.value })
//               }
//             />

//             <Input
//               placeholder="Source"
//               value={form.source}
//               onChange={(e) =>
//                 setForm({ ...form, source: e.target.value })
//               }
//             />
//           </div>

//           <div className="mt-6 flex justify-end gap-3">
//             <button
//               onClick={handleSubmit}
//               className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl"
//             >
//               Save
//             </button>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ================= COMMON COMPONENTS ================= */

// const Modal = ({ title, children, onClose }) => (
//   <div className="fixed inset-0 z-50 flex items-center justify-center">
//     <div
//       className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//       onClick={onClose}
//     />
//     <div className="relative bg-white w-full max-w-4xl mx-4 rounded-2xl shadow-2xl border border-indigo-200 p-8 max-h-[90vh] overflow-y-auto">
//       <h3 className="text-2xl font-bold text-indigo-700 mb-6">{title}</h3>
//       {children}
//       <div className="mt-8 flex justify-end">
//         <button
//           onClick={onClose}
//           className="bg-gray-200 px-6 py-2.5 rounded-xl"
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   </div>
// );

// const Input = ({ className = "", ...props }) => (
//   <input
//     {...props}
//     className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none ${className}`}
//   />
// );

// const ProfileItem = ({ label, value }) => (
//   <div>
//     <p className="text-gray-500 text-sm">{label}</p>
//     <p className="font-semibold text-gray-800">{value || "-"}</p>
//   </div>
// );







import { useEffect, useState } from "react";
import {
  getRecruitments,
  createRecruitment,
} from "../api/recruitment.api";
import { getDepartments } from "../api/hr.dept";
import hrApi from "../api/hr.api";

/* ================= TABLE ================= */
const RecruitmentTable = ({ data = [], onView }) => {
  return (
    <div className="relative h-full rounded-2xl border border-indigo-100 shadow-xl bg-white overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider">
            <th className="px-6 py-4 text-left">Candidate ID</th>
            <th className="px-6 py-4 text-left">Candidate</th>
            <th className="px-6 py-4 text-left">Position</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((r, index) => (
            <tr
              key={r.candidateId}
              className={`hover:bg-indigo-50 transition ${
                index % 2 === 0 ? "bg-slate-50" : "bg-white"
              }`}
            >
              <td className="px-6 py-4">{r.candidateId}</td>
              <td className="px-6 py-4 font-semibold">
                {r.firstName} {r.lastName}
              </td>
              <td className="px-6 py-4">{r.appliedPosition}</td>
              <td className="px-6 py-4">{r.status}</td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => onView(r)}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-indigo-700 transition"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No applications found
        </div>
      )}
    </div>
  );
};

/* ================= MAIN ================= */
export default function Recruitment() {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    candidateId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    appliedPosition: "",
    departmentId: "",
    status: "",
    source: "",
    applicationDate: "",
  });

  /* ================= VALIDATION ================= */

  const validate = () => {
    let newErrors = {};

    if (!form.firstName.trim())
      newErrors.firstName = "First name is required";

    if (!form.email.trim())
      newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email format";

    if (!form.departmentId)
      newErrors.departmentId = "Department is required";

    if (form.phone && !/^[0-9]+$/.test(form.phone))
      newErrors.phone = "Phone must contain only numbers";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= LOAD ================= */

  const load = async () => {
    try {
      setLoading(true);
      const res = await getRecruitments();
      setData(res || []);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    const res = await getDepartments();
    setDepartments(res || []);
  };

  useEffect(() => {
    load();
    loadDepartments();
  }, []);

  /* ================= CREATE ================= */

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      ...form,
      departmentId: Number(form.departmentId),
      applicationDate: new Date().toISOString(),
    };

    await createRecruitment(payload);
    setCreateOpen(false);
    resetForm();
    load();
  };

  /* ================= UPDATE ================= */

  const handleUpdate = async () => {
    if (!validate()) return;

    await hrApi.put(`/api/Recruitment/${form.candidateId}`, {
      ...form,
      departmentId: Number(form.departmentId),
    });

    setCreateOpen(false);
    setIsEdit(false);
    resetForm();
    load();
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await hrApi.delete(`/api/Recruitment/${id}`);
    setSelected(null);
    load();
  };

  const resetForm = () => {
    setForm({
      candidateId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      appliedPosition: "",
      departmentId: "",
      status: "",
      source: "",
      applicationDate: "",
    });
    setErrors({});
  };

  const openEdit = () => {
    setForm(selected);
    setIsEdit(true);
    setSelected(null);
    setCreateOpen(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          Recruitment Management
        </h2>

        <button
          onClick={() => {
            resetForm();
            setIsEdit(false);
            setCreateOpen(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:opacity-90 transition"
        >
          + Add Candidate
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <RecruitmentTable data={data} onView={setSelected} />
        )}
      </div>

      {/* VIEW MODAL */}
      {selected && (
        <Modal title="Candidate Details" onClose={() => setSelected(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ProfileItem label="Candidate ID" value={selected.candidateId} />
            <ProfileItem label="Application Date" value={selected.applicationDate} />
            <ProfileItem label="First Name" value={selected.firstName} />
            <ProfileItem label="Last Name" value={selected.lastName} />
            <ProfileItem label="Email" value={selected.email} />
            <ProfileItem label="Phone" value={selected.phone} />
            <ProfileItem label="Applied Position" value={selected.appliedPosition} />
            <ProfileItem label="Department ID" value={selected.departmentId} />
            <ProfileItem label="Status" value={selected.status} />
            <ProfileItem label="Source" value={selected.source} />
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button onClick={openEdit} className="bg-blue-600 text-white px-5 py-2 rounded-xl">
              Update
            </button>
            <button onClick={() => handleDelete(selected.candidateId)}
              className="bg-red-600 text-white px-5 py-2 rounded-xl">
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* CREATE / UPDATE MODAL */}
      {createOpen && (
        <Modal
          title={isEdit ? "Update Candidate" : "Add New Candidate"}
          onClose={() => setCreateOpen(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

            <Input placeholder="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              error={errors.firstName} />

            <Input placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })} />

            <Input placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email} />

            <Input placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone} />

            <Input placeholder="Applied Position"
              value={form.appliedPosition}
              onChange={(e) => setForm({ ...form, appliedPosition: e.target.value })} />

            <div>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="border rounded-xl px-4 py-2.5 w-full focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>
              )}
            </div>

            <Input placeholder="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })} />

            <Input placeholder="Source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={isEdit ? handleUpdate : handleSubmit}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl"
            >
              {isEdit ? "Update" : "Save"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= MODAL ================= */
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border border-indigo-200 p-6 max-h-[85vh] overflow-y-auto">
      <h3 className="text-xl font-bold text-indigo-700 mb-5">{title}</h3>
      {children}
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="bg-gray-200 px-5 py-2 rounded-xl">
          Close
        </button>
      </div>
    </div>
  </div>
);

const Input = ({ error, className = "", ...props }) => (
  <div>
    <input
      {...props}
      className={`border rounded-xl px-4 py-2.5 w-full focus:ring-2 focus:ring-indigo-400 outline-none ${className}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const ProfileItem = ({ label, value }) => (
  <div>
    <p className="text-gray-500 text-sm">{label}</p>
    <p className="font-semibold text-gray-800">{value || "-"}</p>
  </div>
);