import { useEffect, useState } from "react";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../api/todo.api";

/* ================= TABLE ================= */
const TodoTable = ({ data = [], onEdit, onDelete, onView }) => (
  <div className="flex-1 overflow-auto rounded-2xl border border-indigo-100 shadow-xl bg-white">
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs uppercase tracking-wider">
          <th className="px-6 py-4 text-left">ID</th>
          <th className="px-6 py-4 text-left">Title</th>
          <th className="px-6 py-4 text-left">Due Date</th>
          <th className="px-6 py-4 text-left">Status</th>
          <th className="px-6 py-4 text-left">Actions</th>
          <th className="px-6 py-4 text-left">Details</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {data.map((t, index) => (
          <tr
            key={t.taskId}
            className={`hover:bg-indigo-50 transition ${
              index % 2 === 0 ? "bg-slate-50" : "bg-white"
            }`}
          >
            <td className="px-6 py-4 font-semibold">{t.taskId}</td>
            <td className="px-6 py-4">{t.title}</td>

            <td className="px-6 py-4">
              {t.dueDate
                ? new Date(t.dueDate).toLocaleDateString()
                : "-"}
            </td>

            <td className="px-6 py-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  t.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : t.status === "InProgress"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {t.status}
              </span>
            </td>

            <td className="px-6 py-4 flex gap-2">
              <button
                onClick={() => onEdit(t)}
                className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:scale-105 transition"
              >
                Edit
              </button>

              <button
                onClick={() => onDelete(t.taskId)}
                className="px-3 py-1 bg-red-600 text-white rounded-md text-xs hover:scale-105 transition"
              >
                Delete
              </button>
            </td>

            <td className="px-6 py-4">
              <button
                onClick={() => onView(t)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:scale-105 transition"
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ================= MAIN ================= */
export default function Todo() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    status: "Pending",
  });

  const load = async () => {
    const res = await getTodos();
    setData(res || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      status: "Pending",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editTask) {
      await updateTodo(editTask.taskId, {
        ...form,
        assignedTo: Number(form.assignedTo),
        dueDate: new Date(form.dueDate).toISOString(),
      });
    } else {
      await createTodo({
        ...form,
        assignedTo: Number(form.assignedTo),
        dueDate: new Date(form.dueDate).toISOString(),
      });
    }

    setOpen(false);
    setEditTask(null);
    resetForm();
    load();
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setForm({
      ...task,
      dueDate: task.dueDate.split("T")[0],
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteTodo(id);
    load();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          Todo Management
        </h2>

        <button
          onClick={() => {
            resetForm();
            setEditTask(null);
            setOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-md hover:scale-105 transition"
        >
          + Add Todo
        </button>
      </div>

      {/* TABLE */}
      <TodoTable
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={setViewTask}
      />

      {/* VIEW MODAL */}
      {viewTask && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8">
            <h3 className="text-xl font-bold mb-4 text-indigo-700">
              Task Details
            </h3>

            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {viewTask.taskId}</p>
              <p><strong>Title:</strong> {viewTask.title}</p>
              <p><strong>Description:</strong> {viewTask.description}</p>
              <p><strong>Assigned To:</strong> {viewTask.assignedTo}</p>
              <p><strong>Status:</strong> {viewTask.status}</p>
              <p><strong>Due Date:</strong> {viewTask.dueDate}</p>
              <p><strong>Created At:</strong> {viewTask.createdAt}</p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewTask(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8">
            <h3 className="text-xl font-bold mb-6 text-indigo-700">
              {editTask ? "Edit Todo" : "Add New Todo"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Title"
                className="w-full border p-2 rounded-lg"
                required
              />

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                className="w-full border p-2 rounded-lg"
                required
              />

              <input
                type="number"
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleChange}
                placeholder="Assigned To (User Id)"
                className="w-full border p-2 rounded-lg"
                required
              />

              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg"
                required
              />

              {/* STATUS DROPDOWN */}
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg"
              >
                <option value="Pending">Pending</option>
                <option value="InProgress">InProgress</option>
                <option value="Completed">Completed</option>
              </select>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:scale-105 transition"
                >
                  {editTask ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}