import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import useFacebookLeads from "../../socialCRM/hooks/useFacebookLeads";
import * as XLSX from "xlsx";

export default function HRLeads() {
  const { user } = useAuth();
  const { leads, loading, reload, assignLead } = useFacebookLeads();

  const [remarkMap, setRemarkMap] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  useEffect(() => {
    reload({});
  }, []);

  // ✅ SHOW ONLY ASSIGNED LEADS
  const assignedLeads = leads.filter(
    (l) =>
      l.assignedToUserId !== null &&
      l.assignedToUserId !== undefined &&
      l.assignedToUserId !== "" &&
      l.assignedToUserName
  );

  const toggleLeadSelection = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllVisible = (checked) => {
    setSelectedLeadIds(checked ? assignedLeads.map((l) => l.id) : []);
  };

  const exportToExcel = (mode) => {
    if (!assignedLeads.length) return alert("No leads to export");

    let exportLeads =
      mode === "selected"
        ? assignedLeads.filter((l) => selectedLeadIds.includes(l.id))
        : assignedLeads;

    if (!exportLeads.length) return alert("No leads match criteria");

    const rows = exportLeads.map((l) => ({
      Name: l.name || "",
      Email: l.email || "",
      Phone: l.phone || "",
      Status: l.status || "",
      AssignedTo: l.assignedToUserName || "",
      CreatedAt: new Date(l.createdAt).toLocaleString(),
      ...(l.fields || {}),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(
      workbook,
      mode === "selected" ? "hr-leads-selected.xlsx" : "hr-leads-all.xlsx"
    );
  };

  const statusColors = {
    New: "bg-blue-100 text-blue-700",
    Contacted: "bg-yellow-100 text-yellow-700",
    Qualified: "bg-green-100 text-green-700",
    Lost: "bg-red-100 text-red-700",
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-6">

        {/* ===== HEADER ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-slate-800">
            Leads Management
          </h1>

          <div className="flex gap-3">
            <button
              onClick={() => exportToExcel("all")}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 transition"
            >
              Export All
            </button>

            <button
              onClick={() => exportToExcel("selected")}
              disabled={selectedLeadIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow disabled:opacity-40 hover:bg-indigo-700 transition"
            >
              Export Selected ({selectedLeadIds.length})
            </button>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-x-auto">

          {loading && (
            <div className="p-10 text-center text-slate-500">
              Loading leads...
            </div>
          )}

          {!loading && assignedLeads.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              No assigned leads found
            </div>
          )}

          {!loading && assignedLeads.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                <tr className="text-xs uppercase text-slate-600 tracking-wider">
                  <th className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === assignedLeads.length}
                      onChange={(e) => selectAllVisible(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                  </th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Phone</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Assigned To</th>
                  <th className="px-6 py-4 text-left">Created At</th>
                  <th className="px-6 py-4 text-left">Remark</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {assignedLeads.map((l, index) => (
                  <tr
                    key={l.id}
                    className={`border-b border-slate-100 transition hover:bg-indigo-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l.id)}
                        onChange={() => toggleLeadSelection(l.id)}
                        className="w-4 h-4 accent-indigo-600"
                      />
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {l.name || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {l.phone || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {l.email || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusColors[l.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {l.assignedToUserName}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={remarkMap[l.id] ?? l.remark ?? ""}
                        onChange={(e) =>
                          setRemarkMap((prev) => ({
                            ...prev,
                            [l.id]: e.target.value,
                          }))
                        }
                        onBlur={() =>
                          assignLead(
                            l.id,
                            l.assignedToUserId,
                            l.assignedToUserName,
                            remarkMap[l.id]
                          )
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        placeholder="Add remark..."
                      />
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedLead(l)}
                        className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSelectedLead(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border border-slate-200 p-8 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-6 text-slate-800">
              Lead Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {selectedLead.fields &&
                Object.entries(selectedLead.fields).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-500 uppercase">
                      {k.replace(/_/g, " ")}
                    </p>
                    <p className="font-medium text-slate-800">
                      {v || "-"}
                    </p>
                  </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
