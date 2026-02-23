// src/components/LeadsTable.jsx
export default function LeadsTable({
  leads,
  loading,
  remarkMap,
  setRemarkMap,
  setSelectedLead,
  viewOnly = false,
  columns = ["assignedTo", "createdAt", "remark", "actions"]
}) {
  if (loading) return <p>Loading leads...</p>;
  if (!leads.length) return <p>No leads found</p>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.includes("assignedTo") && <th className="px-4 py-2">Assigned To</th>}
            {columns.includes("createdAt") && <th className="px-4 py-2">Created At</th>}
            {columns.includes("remark") && <th className="px-4 py-2">Remark</th>}
            {columns.includes("actions") && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50">
              {columns.includes("assignedTo") && (
                <td className="px-4 py-2">{l.assignedToUserName || "Unassigned"}</td>
              )}
              {columns.includes("createdAt") && (
                <td className="px-4 py-2">{new Date(l.createdAt).toLocaleString()}</td>
              )}
              {columns.includes("remark") && (
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={remarkMap[l.id] ?? l.remark ?? ""}
                    onChange={(e) =>
                      setRemarkMap((prev) => ({ ...prev, [l.id]: e.target.value }))
                    }
                    disabled={viewOnly}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
              )}
              {columns.includes("actions") && (
  <td className="px-4 py-2">
    <button
      onClick={() => setSelectedLead(l)}
      className="px-3 py-1 bg-blue-50 text-blue-600 rounded"
    >
      View Details
    </button>
  </td>
)}

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
