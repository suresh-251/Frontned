import { useState } from "react";

export default function LeadFormCard({
  form,
  onSync
}) {
  const [syncing, setSyncing] = useState(false);
  const [showFields, setShowFields] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(form.id);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'N/A';
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 30) return `${diffDays}d ago`;
      return '';
    } catch {
      return '';
    }
  };

  const pageImg = form.pageProfilePictureUrl;
  const questions = form.questions || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center gap-3">
          {pageImg ? (
            <img
              src={pageImg}
              alt={form.pageName || 'Page'}
              className="w-10 h-10 rounded-full border-2 border-white/30 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">
              {form.name || 'Untitled Form'}
            </h3>
            {form.pageName && (
              <p className="text-blue-200 text-xs truncate">{form.pageName}</p>
            )}
          </div>
          {form.leadsCount != null && (
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
              {form.leadsCount} leads
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Created Date */}
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(form.createdTime)}</span>
          {getRelativeTime(form.createdTime) && (
            <span className="text-gray-400">· {getRelativeTime(form.createdTime)}</span>
          )}
        </div>

        {/* Form Fields Toggle */}
        {questions.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowFields(!showFields)}
              className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors w-full"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showFields ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {questions.length} form field{questions.length !== 1 ? "s" : ""}
            </button>
            {showFields && (
              <div className="mt-2 space-y-1 pl-5">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                    <span className="font-medium text-gray-700">{q.label || q.key}</span>
                    <span className="text-gray-400">({q.type})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sync Leads</span>
              </>
            )}
          </button>
          {form.formLink && (
            <a
              href={form.formLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-200 transition-colors"
              title="Open form on Facebook"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
