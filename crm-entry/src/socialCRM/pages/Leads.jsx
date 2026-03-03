import { useEffect, useState } from "react";
import useFacebookLeads from "../hooks/useFacebookLeads";
import { getAvailablePages } from "../api/facebook.pages.api";
import { getLeadForms } from "../api/facebook.leads.api";
import useUsers from "../hooks/useUsers";
import * as XLSX from "xlsx";
import * as signalR from "@microsoft/signalr";
 

import { BASE_URL } from "../api/apiClient";
 
const HUB_URL = BASE_URL.replace("/api", "") + "/hubs/leads";
 

 
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
 
  const [exportFriendlyLabels, setExportFriendlyLabels] = useState(true);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
 
  /* =========================
     INITIAL LOAD
     ========================= */
  useEffect(() => {
    reload({});
  }, []);
 
  /* =========================
     SIGNALR REAL-TIME
     ========================= */
useEffect(() => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () =>
        localStorage.getItem("accessToken")
    })
    .withAutomaticReconnect()
    .build();
 
  connection.on("LeadUpdated", (data) => {
    console.log("🔥 LeadUpdated event:", data);
 
    // 🔥 only silent reload (no loading spinner)
    reload({});
  });
 
  connection.start()
    .then(() => console.log("✅ Connected to LeadsHub"))
    .catch(err => console.error("SignalR connection failed:", err));
 
  return () => {
    connection.stop();
  };
}, []);
 
  /* =========================
     LOAD PAGES
     ========================= */
  useEffect(() => {
    getAvailablePages().then(setPages);
  }, []);
 
  /* =========================
     LOAD FORMS
     ========================= */
  useEffect(() => {
    if (!filters.pageId) {
      setForms([]);
      return;
    }
    getLeadForms(filters.pageId).then(setForms);
  }, [filters.pageId]);
 
  /* =========================
     REST OF YOUR COMPONENT
     (No need to change table logic)
     ========================= */
 
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
        CreatedAt: l.metaCreatedAt
  ? new Date(l.metaCreatedAt).toLocaleString()
  : l.syncedAt
  ? new Date(l.syncedAt).toLocaleString()
  : ""
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage and track your Facebook leads</p>
        </div>
 
        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Page Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📄 Filter by Page
              </label>
              <select
                value={filters.pageId}
                onChange={e => reload({ pageId: e.target.value, formId: "" })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Pages</option>
                {pages.map(p => (
                  <option key={p.pageId} value={p.pageId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
 
            {/* Form Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Filter by Form
              </label>
              <select
                value={filters.formId}
                disabled={!filters.pageId}
                onChange={e => reload({ formId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
 
          {!filters.pageId && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Showing leads from all pages</span>
            </div>
          )}
        </div>
 
        {/* Export Options Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Options
          </h3>
         
          <div className="flex flex-wrap gap-4 items-end">
            {/* Export Buttons */}
            <button
              onClick={() => exportToExcel("all")}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Full Table
            </button>
 
            <button
              onClick={() => exportToExcel("selected")}
              disabled={selectedLeadIds.length === 0}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Export Selected ({selectedLeadIds.length})
            </button>
 
            {/* Friendly Names Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={exportFriendlyLabels}
                onChange={e => setExportFriendlyLabels(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Friendly field names</span>
            </label>
 
            {/* Date Filters */}
            <div className="flex gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From:</label>
                <input
                  type="date"
                  value={exportFromDate}
                  onChange={e => setExportFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To:</label>
                <input
                  type="date"
                  value={exportToDate}
                  onChange={e => setExportToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
 
        {/* Leads Table Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading leads...</p>
              </div>
            </div>
          )}
 
          {!loading && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium text-lg">No leads found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
 
          {!loading && leads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.length === leads.length}
                        onChange={e => selectAllVisible(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                   
                    {/* ✅ CREATED AT HEADER */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Created At
                    </th>
 
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Remark</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(l.id)}
                          onChange={() => toggleLeadSelection(l.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {l.name || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {l.email || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {l.phone || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={l.status}
                          onChange={e => changeStatus(l.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer ${
                            l.status === "New"
                              ? "bg-blue-100 text-blue-700"
                              : l.status === "Contacted"
                              ? "bg-yellow-100 text-yellow-700"
                              : l.status === "Qualified"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>
<td className="px-6 py-4">
  <select
    value={l.assignedToUserId ?? ""}
    onChange={e => {
      const value = e.target.value;
 
      // If Unassigned selected
        if (!value) {
          assignLead(l.id, null, null, remarkMap[l.id]);
          return;
        }
 
      const userId = Number(value);
        const user = users.find(u => u.userId === userId);
 
      // Directly pass userId instead of whole object (cleaner)
  assignLead(
    l.id,
    user?.userId,
    user?.name,
    remarkMap[l.id]
  );
    }}
    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    <option value="">Unassigned</option>
    {users.map(u => (
      <option key={u.userId} value={u.userId}>
        {u.name}
      </option>
    ))}
  </select>
</td>
 
                      {/* ✅ CREATED AT CELL */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                          {l.metaCreatedAt
                            ? new Date(l.metaCreatedAt).toLocaleString()
                            : l.syncedAt
                            ? new Date(l.syncedAt).toLocaleString()
                            : "-"}
                        </td>
 
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Add remark..."
                            value={remarkMap[l.id] ?? l.remark ?? ""}
                          onChange={e =>
                            setRemarkMap(prev => ({
                              ...prev,
                              [l.id]: e.target.value
                            }))
                          }  onBlur={() =>
    assignLead(
      l.id,
      l.assignedToUserId,
      l.assignedToUserName,
      remarkMap[l.id]
    )
  }
                          className="w-40 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedLead(l)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
 
      {/* Details Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Lead Details
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
 
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {selectedLead.fields && Object.keys(selectedLead.fields).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedLead.fields).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        {k.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">{v || "-"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No additional form data available</p>
                </div>
              )}
            </div>
 
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
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