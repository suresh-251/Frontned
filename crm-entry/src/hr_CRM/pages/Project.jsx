import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api/project.api";

import { getManagers } from "../../api/users/users.api";
import { getDepartments } from "../api/hr.dept";

/* ================= PROJECT TABLE ================= */
const ProjectTable = ({ projects = [], onEdit, onDelete }) => {
  return (
    <div className="relative h-full rounded-2xl border border-indigo-100 shadow-xl bg-white overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider">
            <th className="px-6 py-4 text-left">Name</th>
            <th className="px-6 py-4 text-left">Duration</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-left">Manager</th>
            <th className="px-6 py-4 text-left">Department</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {projects.map((p, index) => (
            <tr
              key={p.projectId}
              className={`hover:bg-indigo-50 transition ${
                index % 2 === 0 ? "bg-slate-50" : "bg-white"
              }`}
            >
              <td className="px-6 py-4 font-semibold">{p.projectName}</td>
              <td className="px-6 py-4">{p.duration}</td>
              <td className="px-6 py-4">
                <span className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                  {p.status}
                </span>
              </td>
              <td className="px-6 py-4">{p.managerName}</td>
              <td className="px-6 py-4">
                {p.departmentName} - {p.branchName} - {p.location}
              </td>
              <td className="px-6 py-4 text-center space-x-2">
                <button
                  onClick={() => onEdit(p)}
                  className="bg-yellow-500 text-white px-3 py-1.5 rounded-md text-xs hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(p.projectId)}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {projects.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No projects found
        </div>
      )}
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function Project() {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    projectName: "",
    duration: "",
    status: "",
    managerId: "",
    departmentId: "",
  });

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data || []);
  };

  useEffect(() => {
    loadProjects();
    getManagers("SOCIALMEDIA").then(setManagers);
    getDepartments().then(setDepartments);
  }, []);

  const handleSubmit = async () => {
    if (!formData.status) {
      alert("Please select status");
      return;
    }

    const payload = {
      ...formData,
      managerId: Number(formData.managerId),
      departmentId: Number(formData.departmentId),
    };

    if (editingId) {
      await updateProject(editingId, payload);
    } else {
      await createProject(payload);
    }

    closeModal();
    loadProjects();
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({
      projectName: "",
      duration: "",
      status: "",
      managerId: "",
      departmentId: "",
    });
  };

  const handleEdit = (p) => {
    setEditingId(p.projectId);
    setFormData({
      projectName: p.projectName,
      duration: p.duration,
      status: p.status,
      managerId: p.managerId?.toString(),
      departmentId: p.departmentId?.toString(),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await deleteProject(id);
    loadProjects();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          Project Management
        </h2>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:opacity-90 transition"
        >
          + Create Project
        </button>
      </div>

      {/* TABLE */}
      <div className="flex-1 min-h-0">
        <ProjectTable
          projects={projects}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* ================= MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative bg-white w-full max-w-3xl mx-4 rounded-2xl shadow-2xl border border-indigo-200 p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-indigo-700 mb-6">
              {editingId ? "Update Project" : "Create Project"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <Input
                placeholder="Project Name"
                value={formData.projectName}
                onChange={(e) =>
                  setFormData({ ...formData, projectName: e.target.value })
                }
              />

              <Input
                placeholder="Duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="col-span-2 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              >
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={formData.managerId}
                onChange={(e) =>
                  setFormData({ ...formData, managerId: e.target.value })
                }
                className="col-span-2 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">Select Manager</option>
                {managers?.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.domainCode})
                  </option>
                ))}
              </select>

              <select
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
                className="col-span-2 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="">Select Department</option>
                {departments?.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName} - {d.branchName} - {d.location}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={handleSubmit}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition"
              >
                {editingId ? "Update" : "Create"}
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