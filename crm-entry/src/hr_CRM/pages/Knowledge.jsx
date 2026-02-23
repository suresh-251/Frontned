import { useEffect, useState } from "react";
import {
  getKnowledgeList,
  createKnowledge,
  deleteKnowledge,
} from "../api/api.knowledge";

export default function Knowledge() {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    branchId: "",
    recordType: "",
    code: "",
    title: "",
    category: "",
    subCategory: "",
    summary: "",
    approvalStatus: "",
    approvedBy: "",
    visibility: "",
    status: "",
    createdBy: "",
  });

  // =============================
  // Fetch Knowledge Records
  // =============================
  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const data = await getKnowledgeList();
      setKnowledgeList(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch knowledge records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  // =============================
  // Handle Input Change
  // =============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =============================
  // Handle Submit
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createKnowledge({
        ...formData,
        branchId: Number(formData.branchId),
        createdBy: Number(formData.createdBy),
      });

      setFormData({
        branchId: "",
        recordType: "",
        code: "",
        title: "",
        category: "",
        subCategory: "",
        summary: "",
        approvalStatus: "",
        approvedBy: "",
        visibility: "",
        status: "",
        createdBy: "",
      });

      fetchKnowledge();
    } catch (err) {
      console.error(err);
      alert("Failed to create knowledge record");
    }
  };

  // =============================
  // Handle Delete
  // =============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete?")) return;

    try {
      await deleteKnowledge(id);
      fetchKnowledge();
    } catch (err) {
      console.error(err);
      alert("Failed to delete record");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Knowledge Management</h2>

      {/* ================= FORM ================= */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 bg-white p-4 rounded shadow mb-6"
      >
        <input
          type="number"
          name="branchId"
          placeholder="Branch ID"
          value={formData.branchId}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />

        <input
          type="number"
          name="createdBy"
          placeholder="Created By (User ID)"
          value={formData.createdBy}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="recordType"
          placeholder="Record Type"
          value={formData.recordType}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="code"
          placeholder="Code"
          value={formData.code}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="subCategory"
          placeholder="Sub Category"
          value={formData.subCategory}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="approvalStatus"
          placeholder="Approval Status"
          value={formData.approvalStatus}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="approvedBy"
          placeholder="Approved By"
          value={formData.approvedBy}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="visibility"
          placeholder="Visibility"
          value={formData.visibility}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="status"
          placeholder="Status"
          value={formData.status}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <textarea
          name="summary"
          placeholder="Summary"
          value={formData.summary}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
        />

        <button
          type="submit"
          className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Add Knowledge
        </button>
      </form>

      {/* ================= TABLE ================= */}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Approval</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {knowledgeList.length === 0 && !loading ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No records found
                </td>
              </tr>
            ) : (
              knowledgeList.map((item) => (
                <tr key={item.id}>
                  <td className="p-2 border">{item.title}</td>
                  <td className="p-2 border">{item.category}</td>
                  <td className="p-2 border">{item.status}</td>
                  <td className="p-2 border">{item.approvalStatus}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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
  );
}