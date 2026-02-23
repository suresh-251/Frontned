import { useEffect, useState } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../api/hr.dept";
import { getBranches } from "../api/api.branch";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [formData, setFormData] = useState({
    departmentName: "",
    branchId: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  /* ================= LOAD DATA ================= */

  const loadBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Branch Load Error:", error);
      setBranches([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setAllDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Department Load Error:", error);
      setAllDepartments([]);
    }
  };

  useEffect(() => {
    loadBranches();
    loadDepartments();
  }, []);

  /* ================= FILTER ================= */

  useEffect(() => {
    if (!selectedBranchId) {
      setDepartments(allDepartments);
    } else {
      const filtered = allDepartments.filter(
        (d) => d.branchId === Number(selectedBranchId)
      );
      setDepartments(filtered);
    }
  }, [selectedBranchId, allDepartments]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.departmentName || !formData.branchId) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        departmentName: formData.departmentName,
        branchId: Number(formData.branchId),
      };

      if (editingId) {
        await updateDepartment(editingId, payload);
      } else {
        await createDepartment(payload);
      }

      setFormData({ departmentName: "", branchId: "" });
      setEditingId(null);
      setShowModal(false);
      await loadDepartments();
    } catch (error) {
      console.error("Submit Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (dept) => {
    setFormData({
      departmentName: dept.departmentName,
      branchId: dept.branchId,
    });
    setEditingId(dept.departmentId);
    setShowModal(true);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      await deleteDepartment(id);
      await loadDepartments();
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  /* ================= UI (UNCHANGED) ================= */

  return (
    <div className="h-full overflow-y-auto p-1">

      {/* HEADER ROW */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">

        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Department Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage departments across branches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            View By:
          </span>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="border rounded-xl px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.branchId} value={b.branchId}>
                {b.branchName} ({b.location})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setFormData({ departmentName: "", branchId: "" });
            setEditingId(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-xl shadow-md hover:opacity-90 transition text-sm font-medium"
        >
          + Add Department
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Department</th>
                <th className="px-6 py-4 text-left">Branch</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {departments.map((d, index) => {
                const branch = branches.find(
                  (b) => b.branchId === d.branchId
                );

                return (
                  <tr
                    key={d.departmentId}
                    className={`transition hover:bg-indigo-50 ${
                      index % 2 === 0 ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 text-gray-500">
                      {d.departmentId}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {d.departmentName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {branch
                        ? `${branch.branchName} (${branch.location})`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(d)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d.departmentId)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {departments.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">
                    No departments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? "Update Department" : "Add Department"}
            </h3>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs text-gray-600">Select Branch</label>
                <select
                  value={formData.branchId}
                  onChange={(e) =>
                    setFormData({ ...formData, branchId: e.target.value })
                  }
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.branchName} ({b.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600">
                  Department Name
                </label>
                <input
                  value={formData.departmentName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentName: e.target.value,
                    })
                  }
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  {editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}