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
import Card from "../components/common/Card";

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
    setError("");
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facebook Lead Forms</h1>
          <p className="text-gray-600 mt-1">Manage and sync your Facebook lead generation forms</p>
        </div>
      </div>

      {/* Page Selector Card */}
      <Card className="p-6">
        <PageSelector />
      </Card>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading forms...</p>
          </div>
        </Card>
      )}

      {/* No Page Selected */}
      {!loading && !activePage && (
        <Card className="p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No page selected</h3>
            <p className="mt-2 text-sm text-gray-500">Please select a Facebook page to view lead forms</p>
          </div>
        </Card>
      )}

      {/* Forms List */}
      {!loading && activePage && forms.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No forms found</h3>
            <p className="mt-2 text-sm text-gray-500">Create a lead form on Facebook to get started.</p>
          </div>
        </Card>
      )}

      {!loading && forms.length > 0 && (
        <div className="space-y-4">
          {forms.map(form => (
            <LeadFormCard
              key={form.id}
              form={form}
              onToggle={toggleForm}
              onSync={syncLeadsByForm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
