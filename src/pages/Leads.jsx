import { useEffect, useState } from "react";
import useFacebookLeads from "../hooks/useFacebookLeads";
import { getAvailablePages } from "../api/facebook.pages.api";
import { getLeadForms } from "../api/facebook.leads.api";

export default function Leads() {
  const {
    leads,
    loading,
    filters,
    reload,
    changeStatus
  } = useFacebookLeads();

  const [pages, setPages] = useState([]);
  const [forms, setForms] = useState([]);

  /* LOAD PAGES */
  useEffect(() => {
    getAvailablePages().then(setPages);
  }, []);

  /* LOAD FORMS WHEN PAGE CHANGES */
  useEffect(() => {
    if (!filters.pageId) {
      setForms([]);
      return;
    }

    getLeadForms().then(setForms);
  }, [filters.pageId]);

  return (
    <div className="card">
      <h2>Leads</h2>

      {/* FILTER BAR */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {/* PAGE FILTER */}
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

        {/* FORM FILTER */}
        <select
          value={filters.formId}
          disabled={!filters.pageId}
          onChange={e =>
            reload({ formId: e.target.value })
          }
        >
          <option value="">All Forms</option>
          {forms.map(f => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        {/* STATUS FILTER */}
        <select
          value={filters.status}
          onChange={e =>
            reload({ status: e.target.value })
          }
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* TABLE */}
      {loading && <p>Loading leads...</p>}

      {!loading && leads.length === 0 && (
        <p>No leads found</p>
      )}

      {!loading && leads.length > 0 && (
        <table width="100%">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id}>
                <td>{l.name || "-"}</td>
                <td>{l.email || "-"}</td>
                <td>{l.phone || "-"}</td>
                <td>{l.status}</td>
                <td>
                  <select
                    value={l.status}
                    onChange={e =>
                      changeStatus(l.id, e.target.value)
                    }
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
