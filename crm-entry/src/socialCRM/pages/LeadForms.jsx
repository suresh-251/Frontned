import { useEffect, useState } from "react";
import {
  getLeadForms,
  syncLeadsByForm
} from "../api/facebook.leads.api";

import PageSelector from "../components/facebook/PageSelector";
import LeadFormCard from "../components/facebook/LeadFormCard";
import { useFacebookPage } from "../context/FacebookPageContext";

export default function LeadForms() {
  const { activePage } = useFacebookPage();
  // localPage tracks a page the user just selected in this session;
  // it takes effect immediately even before the shared context syncs.
  const [localPage, setLocalPage] = useState(null);
  const currentPage = activePage || localPage;

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When the user picks a page in the selector, capture it locally so the
  // render conditions work right away (context may still be null for this
  // render cycle because PageSelector uses its own hook instance).
  const handlePageChange = (newPage) => {
    if (newPage?.pageId) {
      setLocalPage(newPage);
      setForms([]);
      setLoading(true);
      setError("");
    }
  };

  // Load / auto-refresh forms whenever the effective page changes.
  useEffect(() => {
    if (!currentPage) {
      setForms([]);
      return;
    }

    let cancelled = false;

    const doLoad = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError("");
        const data = await getLeadForms();
        if (!cancelled) setForms(data);
      } catch {
        if (!cancelled) setError("Failed to load lead forms. Please try again.");
      } finally {
        if (!silent && !cancelled) setLoading(false);
      }
    };

    doLoad(false);

    const interval = setInterval(() => doLoad(true), 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentPage?.pageId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Lead Forms</h1>
              <p className="text-gray-600 mt-1">Manage your Facebook lead generation forms</p>
            </div>
          </div>
        </div>

        {/* Page Selector Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-shadow">
          <PageSelector onChange={handlePageChange} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Forms</h3>
              <p className="text-gray-600 font-medium">
                {currentPage ? `Fetching forms for ${currentPage.name}...` : 'Please wait...'}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-1">Error Loading Forms</h3>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* No Page Selected */}
        {!currentPage && !loading && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Page Selected</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Please select a Facebook page from the dropdown above to view and manage your lead forms
            </p>
          </div>
        )}

        {/* Forms Grid */}
        {currentPage && !loading && (
          <>
            {/* Stats Bar */}
            {forms.length > 0 && (
              <div className="mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Page DP */}
                      {forms[0]?.pageProfilePictureUrl ? (
                        <img
                          src={forms[0].pageProfilePictureUrl}
                          alt={forms[0].pageName || currentPage?.name}
                          className="w-14 h-14 rounded-full border-2 border-white/30 object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-1">
                          {forms[0]?.pageName || currentPage?.name || 'Facebook Page'}
                        </p>
                        <p className="text-4xl font-bold">{forms.length}</p>
                        <p className="text-blue-100 text-sm mt-1">Lead generation form{forms.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Forms Found</h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    No lead forms are available for this page. Create a lead form on Facebook to get started.
                  </p>
                </div>
              ) : (
                forms.map(form => (
                  <LeadFormCard
                    key={form.id}
                    form={form}
                    onSync={syncLeadsByForm}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
