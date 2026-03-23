import { useState } from "react";
import useActiveFacebookPage from "../../hooks/useActiveFacebookPage";

export default function PageSelector({
  showLabel = true,
  onChange
}) {
  const {
    pages,
    activePage,
    loading,
    error,
    setActivePage
  } = useActiveFacebookPage();

  const [isChanging, setIsChanging] = useState(false);

  const handleChange = async (e) => {
    const pageId = e.target.value;
    if (!pageId) return;

    setIsChanging(true);
    try {
      await setActivePage(pageId);

      // Optional callback (used by pages)
      if (onChange) {
        const page = pages.find(p => p.pageId === pageId);
        onChange(page);
      }
    } catch (error) {
      console.error('Error setting active page:', error);
    } finally {
      setIsChanging(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-700 font-medium">Loading Facebook pages...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-red-800 font-semibold">Error Loading Pages</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No Pages State
  if (!pages.length) {
    return (
      <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-yellow-800 font-semibold">No Pages Available</p>
          <p className="text-yellow-600 text-sm">No Facebook pages found. Please connect your Facebook account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Facebook Page
        </label>
      )}

      <div className="relative">
        {/* Custom Select Wrapper */}
        <div className="relative">
          <select
            value={activePage?.pageId || ""}
            onChange={handleChange}
            disabled={isChanging}
            className="w-full appearance-none bg-white border-2 border-gray-300 rounded-xl px-4 py-3.5 pr-12 text-gray-800 font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              {isChanging ? 'Switching page...' : 'Select a Facebook page'}
            </option>

            {pages.map(p => (
              <option key={p.pageId} value={p.pageId}>
                {p.name} {p.pageId === activePage?.pageId ? '✓' : ''}
              </option>
            ))}
          </select>

          {/* Custom Dropdown Icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {isChanging ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        {/* Selected Page Info Card */}
        {activePage && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              {/* Page Profile Picture */}
              {activePage.profilePictureUrl ? (
                <img
                  src={activePage.profilePictureUrl}
                  alt={activePage.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-lg border border-blue-200"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
              )}

              {/* Page Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-gray-900 font-bold text-lg truncate">
                    {activePage.name}
                  </h4>
                  <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 text-xs font-semibold">Active</span>
                  </div>
                </div>
                <p className="text-sm text-green-600 font-medium">
                  Connected
                </p>
              </div>

              {/* Checkmark */}
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">All forms and data will be shown for this page</span>
              </div>
            </div>
          </div>
        )}

        {/* Available Pages Count */}
        {pages.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{pages.length} page{pages.length !== 1 ? 's' : ''} available</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
