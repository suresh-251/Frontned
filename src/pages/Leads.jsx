import { useEffect, useState } from "react";
import useFacebookLeads from "../hooks/useFacebookLeads";
import { getAvailablePages } from "../api/facebook.pages.api";
import { getLeadForms } from "../api/facebook.leads.api";
import useUsers from "../hooks/useUsers";
import * as XLSX from "xlsx";

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
    <div className="card">
      <h2>Leads</h2>

      {/* FILTER BAR */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <select
          value={filters.pageId}
          onChange={e =>
            reload({ pageId: e.target.value, formId: "" })
          }
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
        >
          <option value="">All Forms</option>
          {forms.map(f => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {!filters.pageId && (
        <p style={{ opacity: 0.6, marginBottom: 8 }}>
          Showing leads from all pages
        </p>
      )}

      {/* EXPORT OPTIONS */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => exportToExcel("all")}>
          Export Full Table
        </button>

        <button
          onClick={() => exportToExcel("selected")}
          disabled={selectedLeadIds.length === 0}
        >
          Export Selected
        </button>

        <label>
          <input
            type="checkbox"
            checked={exportFriendlyLabels}
            onChange={e => setExportFriendlyLabels(e.target.checked)}
          /> Friendly field names
        </label>

        <label>
          From:
          <input
            type="date"
            value={exportFromDate}
            onChange={e => setExportFromDate(e.target.value)}
          />
        </label>

        <label>
          To:
          <input
            type="date"
            value={exportToDate}
            onChange={e => setExportToDate(e.target.value)}
          />
        </label>
      </div>

      {/* TABLE */}
      {loading && <p>Loading leads...</p>}
      {!loading && leads.length === 0 && <p>No leads found</p>}

      {!loading && leads.length > 0 && (
        <table width="100%">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedLeadIds.length === leads.length}
                  onChange={e => selectAllVisible(e.target.checked)}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Remark</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(l.id)}
                    onChange={() => toggleLeadSelection(l.id)}
                  />
                </td>
                <td>{l.name || "-"}</td>
                <td>{l.email || "-"}</td>
                <td>{l.phone || "-"}</td>
                <td>
                  <select
                    value={l.status}
                    onChange={e =>
                      changeStatus(l.id, e.target.value)
                    }
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Lost">Lost</option>
                  </select>
                </td>
                <td>
                  <select
                    value={l.assignedToUserId ?? ""}
                    onChange={e => {
                      const userId = Number(e.target.value);
                      const user = users.find(u => u.id === userId);
                      assignLead(l.id, user ?? null, remarkMap[l.id]);
                    }}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Remark"
                    value={remarkMap[l.id] ?? ""}
                    onChange={e =>
                      setRemarkMap(prev => ({
                        ...prev,
                        [l.id]: e.target.value
                      }))
                    }
                    style={{ width: 140 }}
                  />
                </td>
                <td>
                  <button onClick={() => setSelectedLead(l)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* DETAILS MODAL */}
      {selectedLead && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              minWidth: 400,
              maxHeight: "80vh",
              overflowY: "auto"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Lead Details</h3>

            {selectedLead.fields &&
            Object.keys(selectedLead.fields).length > 0 ? (
              Object.entries(selectedLead.fields).map(([k, v]) => (
                <div key={k}>
                  <strong>{k.replace(/_/g, " ")}:</strong> {v}
                </div>
              ))
            ) : (
              <p style={{ opacity: 0.6 }}>No additional form data</p>
            )}

            <br />
            <button onClick={() => setSelectedLead(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
