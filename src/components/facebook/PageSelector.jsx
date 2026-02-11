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

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span className="text-sm">Loading pages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!pages.length) {
    return (
      <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-yellow-700">No Facebook pages found</p>
      </div>
    );
  }

  const handleChange = async (e) => {
    const pageId = e.target.value;
    if (!pageId) return;

    await setActivePage(pageId);

    // Optional callback (used by pages)
    if (onChange) {
      const page = pages.find(p => p.pageId === pageId);
      onChange(page);
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-semibold text-gray-700">
          Active Facebook Page
        </label>
      )}

      <div className="relative">
        <select
          value={activePage?.pageId || ""}
          onChange={handleChange}
          className="block w-full md:w-96 px-4 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
        >
          <option value="">Select a Facebook Page</option>

          {pages.map(p => (
            <option key={p.pageId} value={p.pageId}>
              {p.name} {p.isActive ? "✓" : ""}
            </option>
          ))}
        </select>
        
        {/* Dropdown Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {activePage && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Page selected: {activePage.name}</span>
        </div>
      )}
    </div>
  );
}
