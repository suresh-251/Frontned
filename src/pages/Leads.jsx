import { useEffect, useState } from "react";
import useFacebookLeads from "../hooks/useFacebookLeads";
import { getAvailablePages } from "../api/facebook.pages.api";
import { getLeadForms } from "../api/facebook.leads.api";
import useUsers from "../hooks/useUsers";
import * as XLSX from "xlsx";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

export default function Leads() {
  const {
    leads,
    loading,
    filters,
    reload,
    changeStatus,
    assignLead
  } = useFacebookLeads();

  const [pages, setPages] = useState([]);
  const [forms, setForms] = useState([]);
  const users = useUsers();

  const [remarkMap, setRemarkMap] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Export options
  const [exportFriendlyLabels, setExportFriendlyLabels] = useState(true);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");

  /* 🔥 LOAD ALL LEADS ON FIRST RENDER */
  useEffect(() => {
    reload({});
  }, []);

  /* LOAD PAGES */
  useEffect(() => {
    getAvailablePages().then(setPages);
  }, []);

  /* LOAD FORMS (ONLY WHEN PAGE SELECTED) */
  useEffect(() => {
    if (!filters.pageId) {
      setForms([]);
      return;
    }
    getLeadForms(filters.pageId).then(setForms);
  }, [filters.pageId]);

  /* SELECT LEADS */
  const toggleLeadSelection = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const selectAllVisible = (checked) => {
    setSelectedLeadIds(checked ? leads.map(l => l.id) : []);
  };

  /* =========================
     EXPORT TO EXCEL
     ========================= */
  const exportToExcel = (mode) => {
    if (!leads || leads.length === 0) {
      alert("No leads to export");
      return;
    }

    let exportLeads =
      mode === "selected"
        ? leads.filter(l => selectedLeadIds.includes(l.id))
        : leads;

    if (exportFromDate) {
      exportLeads = exportLeads.filter(
        l => new Date(l.createdAt) >= new Date(exportFromDate)
      );
    }

    if (exportToDate) {
      exportLeads = exportLeads.filter(
        l => new Date(l.createdAt) <= new Date(exportToDate)
      );
    }

    if (!exportLeads.length) {
      alert("No leads match criteria");
      return;
    }

    const rows = exportLeads.map(l => {
      const row = {
        Name: l.name || "",
        Email: l.email || "",
        Phone: l.phone || "",
        Status: l.status || "",
        AssignedTo: l.assignedToUserName || "",
        CreatedAt: new Date(l.createdAt).toLocaleString()
      };

      if (l.fields) {
        Object.entries(l.fields).forEach(([key, value]) => {
          const label = exportFriendlyLabels
            ? key
                .replace(/_/g, " ")
                .replace(/\b\w/g, c => c.toUpperCase())
            : key;
          row[label] = value;
        });
      }

      return row;
    });

    // 🧹 remove empty columns
    const usedColumns = {};
    rows.forEach(r => {
      Object.entries(r).forEach(([k, v]) => {
        if (v !== "" && v != null) usedColumns[k] = true;
      });
    });

    const cleanedRows = rows.map(r => {
      const obj = {};
      Object.keys(usedColumns).forEach(k => (obj[k] = r[k]));
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    XLSX.writeFile(
      workbook,
      mode === "selected"
        ? "facebook-leads-selected.xlsx"
        : "facebook-leads-all.xlsx"
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <div className="flex items-center gap-2 mt-2">
            <select
              value={filters.pageId}
              onChange={e => reload({ pageId: e.target.value, formId: "" })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Pages</option>
              {pages.map(p => (
                <option key={p.pageId} value={p.pageId}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={filters.formId}
              disabled={!filters.pageId}
              onChange={e => reload({ formId: e.target.value })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Forms</option>
              {forms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!filters.pageId && (
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">Showing leads from all pages</p>
        </div>
      )}

      {/* Export Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => exportToExcel("all")}
                variant="primary"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                Export Full Table
              </Button>

              <Button
                onClick={() => exportToExcel("selected")}
                variant="secondary"
                disabled={selectedLeadIds.length === 0}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Export Selected
              </Button>

              <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportFriendlyLabels}
                  onChange={e => setExportFriendlyLabels(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>Friendly field names</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={exportFromDate}
                onChange={e => setExportFromDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={exportToDate}
                onChange={e => setExportToDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading leads...</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No leads found</h3>
            <p className="mt-2 text-sm text-gray-500">Get started by creating a lead form on Facebook.</p>
          </div>
        </Card>
      )}

      {/* Leads Table */}
      {!loading && leads.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === leads.length}
                      onChange={e => selectAllVisible(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remark
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l.id)}
                        onChange={() => toggleLeadSelection(l.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {l.name ? l.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {l.name || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{l.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{l.phone || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={l.status}
                        onChange={e => changeStatus(l.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={l.assignedToUserId ?? ""}
                        onChange={e => {
                          const userId = Number(e.target.value);
                          const user = users.find(u => u.id === userId);
                          assignLead(l.id, user ?? null, remarkMap[l.id]);
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        placeholder="Add remark..."
                        value={remarkMap[l.id] ?? ""}
                        onChange={e =>
                          setRemarkMap(prev => ({
                            ...prev,
                            [l.id]: e.target.value
                          }))
                        }
                        className="w-32 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLead(l)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Details Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Lead Details</h3>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {selectedLead.fields && Object.keys(selectedLead.fields).length > 0 ? (
                  Object.entries(selectedLead.fields).map(([k, v]) => (
                    <div key={k} className="flex items-start border-b border-gray-200 pb-3">
                      <div className="w-1/3">
                        <p className="text-sm font-semibold text-gray-700">
                          {k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}:
                        </p>
                      </div>
                      <div className="w-2/3">
                        <p className="text-sm text-gray-900">{v}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No additional form data</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setSelectedLead(null)} variant="secondary">
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
