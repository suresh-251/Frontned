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
  const [statusFilter, setStatusFilter] = useState("Active");

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [formData, setFormData] = useState({
    branchName: "",
    location: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);

  /* ================= LOAD ================= */

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await getBranches();
      const safeData = Array.isArray(data) ? data : [];
      setBranches(safeData);
      applyFilter(safeData, statusFilter);
    } catch (error) {
      console.error("Load Error:", error);
      setBranches([]);
      setFilteredBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  /* ================= FILTER ================= */

  const applyFilter = (data, filter) => {
    if (filter === "All") {
      setFilteredBranches(data);
    } else {
      setFilteredBranches(data.filter((b) => b.status === filter));
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    applyFilter(branches, value);
  };

  /* ================= FORM ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormData({
      branchName: "",
      location: "",
      status: "Active",
    });
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      branchName: branch.branchName || "",
      location: branch.location || "",
      status: branch.status || "Active",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, formData);
      } else {
        await createBranch(formData);
      }

      await loadBranches();
      closeModal();
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this branch?")) return;

    try {
      await deleteBranch(id);
      await loadBranches();
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-1">

      {/* HEADER ROW */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">

        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Branch Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage organization branches and status
          </p>
        </div>

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Filter By:
            </span>

            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="border rounded-xl px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-xl shadow-md hover:opacity-90 transition text-sm font-medium"
          >
            + Add Branch
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left">Branch Name</th>
                <th className="px-6 py-4 text-left">Location</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    No branches found
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch, index) => (
                  <tr
                    key={branch.id}
                    className={`transition hover:bg-indigo-50 ${
                      index % 2 === 0 ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {branch.branchName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {branch.location}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          branch.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {branch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => openEditModal(branch)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:opacity-90"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
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
              {editingBranch ? "Update Branch" : "Add Branch"}
            </h3>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs text-gray-600">Branch Name</label>
                <input
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Location</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:opacity-90"
                >
                  {editingBranch ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}