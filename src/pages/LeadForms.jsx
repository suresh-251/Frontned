import { useEffect, useState } from "react";
import {
  getLeadForms,
  syncLeadsByForm
} from "../api/facebook.leads.api";
import {
  enableForm,
  disableForm
} from "../api/facebook.forms.api";

import PageSelector from "../components/facebook/PageSelector";
import LeadFormCard from "../components/facebook/LeadFormCard";
import { useFacebookPage } from "../context/FacebookPageContext";


export default function LeadForms() {
const { activePage } = useFacebookPage();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     LOAD FORMS FOR ACTIVE PAGE
     ========================= */
  const loadForms = async () => {
    if (!activePage) {
      setForms([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getLeadForms();
      setForms(data);
    } catch {
      setError("Failed to load lead forms");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Reload when active page changes
  useEffect(() => {
    loadForms();
  }, [activePage?.pageId]);

  /* =========================
     ENABLE / DISABLE FORM
     ========================= */
  const toggleForm = async (form) => {
    if (!activePage) return;

    try {
      if (form.isEnabled) {
        await disableForm(activePage.pageId, form.id);
      } else {
        await enableForm(activePage.pageId, form.id);
      }
      loadForms();
    } catch {
      setError("Failed to update form state");
    }
  };

  return (
    <div className="card">
      <h2>Facebook Lead Forms</h2>

      {/* ✅ PAGE SELECTOR */}
      <PageSelector />

      <hr />

      {loading && <p>Loading forms...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !activePage && (
        <p>Please select a Facebook page</p>
      )}

      {!loading && activePage && forms.length === 0 && (
        <p>No lead forms found for this page</p>
      )}

      {forms.map(form => (
        <LeadFormCard
          key={form.id}
          form={form}
          onToggle={toggleForm}
          onSync={syncLeadsByForm}
        />
      ))}
    </div>
  );
}
