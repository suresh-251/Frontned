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

const loadForms = async (silent = false) => {
  if (!activePage) {
    setForms([]);
    return;
  }

  try {
    if (!silent) setLoading(true);
    const data = await getLeadForms(activePage.pageId);
    setForms(data);
  } catch {
    setError("Failed to load lead forms");
  } finally {
    if (!silent) setLoading(false);
  }
};


  // 🔁 AUTO refresh forms (every 30 sec)
  useEffect(() => {
    loadForms(true);

    const interval = setInterval(() => {
      loadForms(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [activePage?.pageId]);

  /* ============================
     ENABLE / DISABLE FORM
     ============================ */
  const toggleForm = async (form) => {
    if (!activePage) return;

    try {
      if (form.isEnabled) {
        await disableForm(activePage.pageId, form.id);
      } else {
        await enableForm(activePage.pageId, form.id);
      }

      // 🔘 manual refresh after toggle
      await loadForms();
    } catch {
      setError("Failed to update form state");
    }
  };

  return (
    <div className="card">
      <h2>Facebook Lead Forms</h2>

      <PageSelector />

      <hr />

      {loading && <p>Loading forms...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!activePage && <p>Please select a Facebook page</p>}

      {forms.map(form => (
// {/* Manual sync stays */}
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
