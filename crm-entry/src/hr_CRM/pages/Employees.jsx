import { useEffect, useState } from "react";
import { getAdminUsers } from "../../api/admin/users.api";
import { getDomains } from "../../api/admin/domains.api";
import { getAdminRoles } from "../../api/admin/roles.api";
import { createUser } from "../../api/users/users.api";

/* ========================= EMPLOYEES TABLE ========================= */
const EmployeesTable = ({ users = [], onView }) => {
  return (
    <div className="relative h-full rounded-2xl border border-indigo-100 shadow-xl bg-white overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider">
            <th className="px-6 py-4 text-left">ID</th>
            <th className="px-6 py-4 text-left">Username</th>
            <th className="px-6 py-4 text-left">Email</th>
            <th className="px-6 py-4 text-left">Department</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {users.map((u, index) => (
            <tr
              key={u.userId}
              className={`hover:bg-indigo-50 transition ${
                index % 2 === 0 ? "bg-slate-50" : "bg-white"
              }`}
            >
              <td className="px-6 py-4">{u.userId}</td>
              <td className="px-6 py-4 font-semibold">{u.username}</td>
              <td className="px-6 py-4">{u.email}</td>
              <td className="px-6 py-4">{u.department || "-"}</td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => onView(u)}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-indigo-700 transition"
                >
                  View Profile
                </button>
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
  const [domains, setDomains] = useState([]);
  const [roles, setRoles] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      designation: "",
    },
  });

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
    try {
      const res = await getAdminUsers({ page: 1, pageSize: 25 });
      setUsers(res?.users ?? []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
    getDomains().then(setDomains);
    getAdminRoles().then(setRoles);
  }, []);

  /* ================= ROLE TOGGLE ================= */
  const toggleRole = (roleCode) => {
    setForm((prev) => ({
      ...prev,
      roleCodes: prev.roleCodes.includes(roleCode)
        ? prev.roleCodes.filter((r) => r !== roleCode)
        : [...prev.roleCodes, roleCode],
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.profile.mobileNumber) {
      alert("Username, Email & Mobile required");
      return;
    }

    try {
      setSubmitting(true);
      await createUser(form);
      closeModal();
      loadUsers();
    } catch {
      alert("Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setCreateOpen(false);
    setForm({
      username: "",
      email: "",
      domainCode: "",
      temporaryPassword: "",
      roleCodes: [],
      profile: {
        firstName: "",
        lastName: "",
        mobileNumber: "",
        designation: "",
      },
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
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
      <div className="flex-1 min-h-0">
        <EmployeesTable users={users} onView={setSelectedUser} />
      </div>

      {/* ================= VIEW PROFILE MODAL ================= */}
      {selectedUser && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Background */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => setSelectedUser(null)}
    />

    {/* Modal Box */}
    <div className="relative bg-white w-full max-w-4xl mx-4 rounded-2xl shadow-2xl border border-indigo-200 p-8 max-h-[90vh] overflow-y-auto">
      
      <h3 className="text-2xl font-bold text-indigo-700 mb-6">
        Employee Profile
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">

        <ProfileItem label="User ID" value={selectedUser.userId} />
        <ProfileItem label="Full Name" value={selectedUser.name} />
        <ProfileItem label="Username" value={selectedUser.username} />
        <ProfileItem label="Email" value={selectedUser.email} />
        <ProfileItem label="Department" value={selectedUser.department} />
        <ProfileItem label="Designation" value={selectedUser.designation} />
        <ProfileItem label="Account Status" value={selectedUser.accountStatus} />
        <ProfileItem label="Manager Name" value={selectedUser.managerName} />
        <ProfileItem label="Created At" value={selectedUser.createdAt} />
        <ProfileItem label="Last Activity" value={selectedUser.lastActivityAt} />

        {/* Roles Section */}
        <div className="md:col-span-2">
          <p className="text-gray-500 mb-2">Assigned Roles</p>
          <div className="flex flex-wrap gap-2">
            {selectedUser.roles && selectedUser.roles.length > 0 ? (
              selectedUser.roles.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">
                No roles assigned
              </span>
            )}
          </div>
        </div>

      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setSelectedUser(null)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {/* ================= ADD EMPLOYEE MODAL ================= */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative bg-white w-full max-w-4xl mx-4 rounded-2xl shadow-2xl border border-indigo-200 p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-indigo-700 mb-6">
              Add New Employee
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
              />

              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <Input
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
              />

              <Input
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
              />

              <Input
                placeholder="Mobile Number"
                value={form.profile.mobileNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    profile: {
                      ...form.profile,
                      mobileNumber: e.target.value,
                    },
                  })
                }
              />

              <select
                value={form.domainCode}
                onChange={(e) =>
                  setForm({ ...form, domainCode: e.target.value })
                }
                className="col-span-2 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">Select Domain</option>
                {domains?.map((d) => (
                  <option key={d.domainId} value={d.domainCode}>
                    {d.domainName}
                  </option>
                ))}
              </select>

              <div className="col-span-2">
                <p className="text-sm font-semibold mb-2">Assign Roles</p>
                <div className="border rounded-xl p-4 max-h-40 overflow-y-auto bg-slate-50">
                  {roles?.map((r) => (
                    <label key={r.roleCode} className="flex gap-2 text-sm mb-1">
                      <input
                        type="checkbox"
                        checked={form.roleCodes.includes(r.roleCode)}
                        onChange={() => toggleRole(r.roleCode)}
                      />
                      {r.roleName}
                    </label>
                  ))}
                </div>
              </div>

              <Input
                placeholder="Temporary Password"
                value={form.temporaryPassword}
                onChange={(e) =>
                  setForm({
                    ...form,
                    temporaryPassword: e.target.value,
                  })
                }
                className="col-span-2"
              />
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition"
              >
                {submitting ? "Submitting..." : "Add Employee"}
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

/* ================= REUSABLE INPUT ================= */
const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none ${className}`}
  />
);

/* ================= PROFILE FIELD ================= */
const ProfileItem = ({ label, value }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800">{value || "-"}</p>
  </div>
);
