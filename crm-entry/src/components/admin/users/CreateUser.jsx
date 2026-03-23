// import { useEffect, useState } from "react";
// import { getDomains } from "../../../api/admin/domains.api";
// import { getAdminRoles } from "../../../api/admin/roles.api";
// import { createUser } from "../../../api/users/users.api";

// export default function CreateUser({ onSuccess, onClose }) {
//   const [domains, setDomains] = useState([]);
//   const [roles, setRoles] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const [form, setForm] = useState({
//     username: "",
//     email: "",
//     domainCode: "",
//     temporaryPassword: "",
//     roleCodes: [],
//     profile: {
//       firstName: "",
//       lastName: "",
//       mobileNumber: "",
//       department: "",
//       designation: "",
//     },
//   });

//   /* =======================
//      LOAD DOMAINS & ROLES
//      ======================= */
// useEffect(() => {
//   const load = async () => {
//     try {
//       const [domainsData, rolesData] = await Promise.all([
//         getDomains(),
//         getAdminRoles(),
//       ]);

//       setDomains(Array.isArray(domainsData) ? domainsData : []);
//       setRoles(Array.isArray(rolesData) ? rolesData : []);
//     } catch {
//       setError("Failed to load domains or roles");
//     }
//   };

//   load();
// }, []);


//   /* =======================
//      DOMAIN CHANGE
//      ======================= */
//   const handleDomainChange = (value) => {
//     setForm((prev) => ({
//       ...prev,
//       domainCode: value,
//       profile: {
//         ...prev.profile,
//         department: value,
//       },
//     }));
//   };

//   /* =======================
//      ROLE TOGGLE
//      ======================= */
//   const toggleRole = (roleCode) => {
//     setForm((prev) => ({
//       ...prev,
//       roleCodes: prev.roleCodes.includes(roleCode)
//         ? prev.roleCodes.filter((r) => r !== roleCode)
//         : [...prev.roleCodes, roleCode],
//     }));
//   };

//   /* =======================
//      SUBMIT
//      ======================= */
//   const handleSubmit = async () => {
//     setError(null);

//     if (
//       !form.username ||
//       !form.email ||
//       !form.domainCode ||
//       !form.roleCodes.length
//     ) {
//       setError("Please fill all required fields");
//       return;
//     }

//     try {
//       setLoading(true);
//       await createUser(form);
//       onSuccess?.();
//     } catch {
//       setError("Failed to create user");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =======================
//      UI
//      ======================= */
//   return (
//     <div className="space-y-5">
//       {/* HEADER */}
//       <div className="flex justify-between items-center border-b pb-3">
//         <h3 className="text-lg font-semibold text-slate-800">
//           Create User
//         </h3>
//         <button
//           onClick={onClose}
//           className="text-slate-500 hover:text-slate-800 text-xl leading-none"
//           title="Close"
//         >
//           ×
//         </button>
//       </div>

//       {error && (
//         <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded">
//           {error}
//         </div>
//       )}

//       {/* FORM */}
//       <div className="grid grid-cols-2 gap-4">
//         <input
//           placeholder="Username *"
//           value={form.username}
//           onChange={(e) => setForm({ ...form, username: e.target.value })}
//           className="border px-3 py-2 rounded text-sm"
//         />

//         <input
//           placeholder="Email *"
//           value={form.email}
//           onChange={(e) => setForm({ ...form, email: e.target.value })}
//           className="border px-3 py-2 rounded text-sm"
//         />

//         <input
//           placeholder="First Name"
//           value={form.profile.firstName}
//           onChange={(e) =>
//             setForm({
//               ...form,
//               profile: { ...form.profile, firstName: e.target.value },
//             })
//           }
//           className="border px-3 py-2 rounded text-sm"
//         />

//         <input
//           placeholder="Last Name"
//           value={form.profile.lastName}
//           onChange={(e) =>
//             setForm({
//               ...form,
//               profile: { ...form.profile, lastName: e.target.value },
//             })
//           }
//           className="border px-3 py-2 rounded text-sm"
//         />

//         <input
//           placeholder="Mobile Number"
//           value={form.profile.mobileNumber}
//           onChange={(e) =>
//             setForm({
//               ...form,
//               profile: { ...form.profile, mobileNumber: e.target.value },
//             })
//           }
//           className="border px-3 py-2 rounded text-sm"
//         />

//         <input
//           placeholder="Designation"
//           value={form.profile.designation}
//           onChange={(e) =>
//             setForm({
//               ...form,
//               profile: { ...form.profile, designation: e.target.value },
//             })
//           }
//           className="border px-3 py-2 rounded text-sm"
//         />

//         {/* DOMAIN */}
//         <select
//           value={form.domainCode}
//           onChange={(e) => handleDomainChange(e.target.value)}
//           className="border px-3 py-2 rounded text-sm col-span-2"
//         >
//           <option value="">Select Domain *</option>
//           {domains.map((d) => (
//             <option key={d.domainId} value={d.domainCode}>
//               {d.domainName}
//             </option>
//           ))}
//         </select>

//         {/* ROLES */}
//         <div className="col-span-2">
//           <p className="text-sm font-medium text-slate-700 mb-2">
//             Assign Roles *
//           </p>

//           <div className="border rounded p-3 max-h-40 overflow-y-auto space-y-2">
//             {roles.map((r) => (
//               <label
//                 key={r.roleCode}
//                 className="flex items-center gap-2 text-sm cursor-pointer"
//               >
//                 <input
//                   type="checkbox"
//                   checked={form.roleCodes.includes(r.roleCode)}
//                   onChange={() => toggleRole(r.roleCode)}
//                 />
//                 {r.roleName}
//               </label>
//             ))}
//           </div>
//         </div>

//         <input
//           placeholder="Temporary Password *"
//           value={form.temporaryPassword}
//           onChange={(e) =>
//             setForm({ ...form, temporaryPassword: e.target.value })
//           }
//           className="border px-3 py-2 rounded text-sm col-span-2"
//         />
//       </div>

//       {/* ACTIONS */}
//       <div className="flex justify-end gap-3 pt-2">
//         <button
//           onClick={onClose}
//           className="px-4 py-2 text-sm border rounded"
//         >
//           Cancel
//         </button>

//         <button
//           disabled={loading}
//           onClick={handleSubmit}
//           className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
//         >
//           Create User
//         </button>
//       </div>
//     </div>
//   );
// }



import { useEffect, useRef, useState } from "react";
import { getDomains } from "../../../api/admin/domains.api";
import { getAdminRoles } from "../../../api/admin/roles.api";
import { createUser } from "../../../api/users/users.api";

export default function CreateUser({ onSuccess, onClose }) {
  const containerRef = useRef(null);

  const [domains, setDomains] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    domainCode: "",
    temporaryPassword: "",
    roleCodes: [],
    profile: {
      firstName: "",
      lastName: "",
      mobileNumber: "",
    },
    employeeId: "",
    gender: "",
    assignedBranch: "",
    department: "",
    designation: "",
    employmentType: "",
    payrollAmount: "",
  });

  /* =======================
     AUTO SCROLL ON OPEN
     ======================= */
  useEffect(() => {
    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, []);

  /* =======================
     LOAD DOMAINS & ROLES
     ======================= */
  useEffect(() => {
    const load = async () => {
      try {
        const [domainsData, rolesData] = await Promise.all([
          getDomains(),
          getAdminRoles(),
        ]);
        setDomains(Array.isArray(domainsData) ? domainsData : []);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch {
        setError("Failed to load domains or roles");
      }
    };
    load();
  }, []);

  /* =======================
     DOMAIN CHANGE
     ======================= */
  const handleDomainChange = (value) => {
    setForm((prev) => ({
      ...prev,
      domainCode: value,
      profile: { ...prev.profile, department: value },
    }));
  };

  /* =======================
     ROLE TOGGLE
     ======================= */
  const toggleRole = (roleCode) => {
    setForm((prev) => ({
      ...prev,
      roleCodes: prev.roleCodes.includes(roleCode)
        ? prev.roleCodes.filter((r) => r !== roleCode)
        : [...prev.roleCodes, roleCode],
    }));
  };

  /* =======================
     VALIDATIONS
     ======================= */
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* =======================
     SUBMIT
     ======================= */
  const handleSubmit = async () => {
    setError(null);

    if (!form.email) return showError("Email is required");
    if (!isValidEmail(form.email))
      return showError("Please enter a valid email address");

    if (!form.profile.mobileNumber)
      return showError("Mobile number is required");

    if (form.profile.mobileNumber.length !== 10)
      return showError("Mobile number must be 10 digits");

    if (!form.domainCode)
      return showError("Please select a domain");

    if (!form.roleCodes.length)
      return showError("Please assign at least one role");

    if (!form.temporaryPassword)
      return showError("Temporary password is required");

    try {
      setLoading(true);
      await createUser(form);
      onSuccess?.();
    } catch {
      showError("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg) => {
    setError(msg);
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* =======================
     UI
     ======================= */
  return (
    <div
      ref={containerRef}
      className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-6"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="text-2xl font-bold text-slate-800">
          Create User
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 text-2xl"
        >
          ×
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* FORM */}
      <div className="grid grid-cols-2 gap-5">
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-mono focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
        />

        <input
          placeholder="Email *"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          className="rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500"
        />

        <input
          placeholder="First Name"
          value={form.profile.firstName}
          onChange={(e) =>
            setForm({
              ...form,
              profile: {
                ...form.profile,
                firstName: e.target.value,
              },
            })
          }
          className="rounded-xl border px-4 py-3 text-sm"
        />

        <input
          placeholder="Last Name"
          value={form.profile.lastName}
          onChange={(e) =>
            setForm({
              ...form,
              profile: {
                ...form.profile,
                lastName: e.target.value,
              },
            })
          }
          className="rounded-xl border px-4 py-3 text-sm"
        />

        <input
          placeholder="Mobile Number *"
          value={form.profile.mobileNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            if (value.length <= 10) {
              setForm({
                ...form,
                profile: {
                  ...form.profile,
                  mobileNumber: value,
                },
              });
            }
          }}
          className="rounded-xl border px-4 py-3 text-sm"
        />

        <input
          placeholder="Employee ID"
          value={form.employeeId}
          onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          className="rounded-xl border px-4 py-3 text-sm"
        />

        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="rounded-xl border px-4 py-3 text-sm bg-white"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <input
          placeholder="Designation"
          value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })}
          className="rounded-xl border px-4 py-3 text-sm"
        />

        <input
          placeholder="Department"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="rounded-xl border px-4 py-3 text-sm"
        />

        <input
          placeholder="Assigned Branch"
          value={form.assignedBranch}
          onChange={(e) => setForm({ ...form, assignedBranch: e.target.value })}
          className="rounded-xl border px-4 py-3 text-sm"
        />

        <select
          value={form.employmentType}
          onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
          className="rounded-xl border px-4 py-3 text-sm bg-white"
        >
          <option value="">Employment Type</option>
          <option value="FullTime">Full Time</option>
          <option value="PartTime">Part Time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
        </select>

        <input
          placeholder="Payroll Amount"
          type="number"
          min="0"
          value={form.payrollAmount}
          onChange={(e) => setForm({ ...form, payrollAmount: e.target.value })}
          className="rounded-xl border px-4 py-3 text-sm"
        />

        {/* DOMAIN */}
        <select
          value={form.domainCode}
          onChange={(e) => handleDomainChange(e.target.value)}
          className="col-span-2 rounded-xl border px-4 py-3 text-sm bg-white"
        >
          <option value="">Select Domain *</option>
          {domains.map((d) => (
            <option key={d.domainId} value={d.domainCode}>
              {d.domainName}
            </option>
          ))}
        </select>

        {/* ROLES */}
        <div className="col-span-2">
          <p className="text-sm font-semibold mb-2">
            Assign Roles *
          </p>
          <div className="border rounded-xl bg-slate-50 p-4 max-h-44 overflow-y-auto space-y-2">
            {roles.map((r) => (
              <label
                key={r.roleCode}
                className="flex gap-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.roleCodes.includes(
                    r.roleCode
                  )}
                  onChange={() => toggleRole(r.roleCode)}
                />
                {r.roleName}
              </label>
            ))}
          </div>
        </div>

        <input
          placeholder="Temporary Password *"
          value={form.temporaryPassword}
          onChange={(e) =>
            setForm({
              ...form,
              temporaryPassword: e.target.value,
            })
          }
          className="col-span-2 rounded-xl border px-4 py-3 text-sm"
        />
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={onClose}
          className="border px-6 py-3 rounded-xl"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-7 py-3 rounded-xl"
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </div>
    </div>
  );
}
