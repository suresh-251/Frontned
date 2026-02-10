import { useEffect, useState } from "react";
import {
  getAvailablePages,
  subscribePage,
  unsubscribePage
} from "../api/facebook.pages.api";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

export default function PageSubscriptions() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingPageId, setTogglingPageId] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await getAvailablePages();
    setPages(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (pageId, currentlySubscribed) => {
    setTogglingPageId(pageId);
    try {
      if (currentlySubscribed) {
        await unsubscribePage(pageId);
      } else {
        await subscribePage(pageId);
      }
      // Reload the pages to get updated subscription status
      await load();
    } catch (error) {
      console.error("Toggle failed:", error);
    } finally {
      setTogglingPageId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Page Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage which Facebook pages can receive leads</p>
        </div>
        <Button onClick={load} variant="secondary" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading pages...</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && pages.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No pages found</h3>
            <p className="mt-2 text-sm text-gray-500">Connect your Facebook account to manage pages.</p>
          </div>
        </Card>
      )}

      {/* Pages Grid */}
      {!loading && pages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map(p => (
            <Card key={p.pageId} className="p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start gap-4">
                {/* Facebook Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>

                {/* Page Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">ID: {p.pageId}</p>
                </div>
              </div>

              {/* Actions - Toggle Switch */}
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {p.isSubscribed ? "Subscribed" : "Not Subscribed"}
                </span>
                <button
                  onClick={() => handleToggle(p.pageId, p.isSubscribed)}
                  disabled={togglingPageId === p.pageId}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    p.isSubscribed
                      ? "bg-green-600"
                      : "bg-gray-300"
                  } ${togglingPageId === p.pageId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      p.isSubscribed ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
