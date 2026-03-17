import { useEffect, useState } from "react";
import { useBrand } from "../context/BrandContext";
import api from "../api/apiClient";
import { connectPlatform } from "../api/auth.api";

const subscribePage   = (pageId) => api.post(`/facebook/pages/${pageId}/subscribe`);
const unsubscribePage = (pageId) => api.post(`/facebook/pages/${pageId}/unsubscribe`);

export default function PageSubscriptions() {
  const { activeBrand } = useBrand();

  const [pages, setPages]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [processing, setProcessing]     = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await api.get(activeBrand?.slug ? `/brands/${activeBrand.slug}/accounts` : "/facebook/pages");
      const all = activeBrand?.slug ? (res.data.accounts ?? []) : (res.data ?? []);
      setPages(all.filter(a => (a.platform ?? "Facebook").toLowerCase() === "facebook"));
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPages(); }, [activeBrand?.slug]);

  const toggleSubscription = async (pageId, isSubscribed) => {
    setProcessing(pageId);
    try {
      if (isSubscribed) {
        await unsubscribePage(pageId);
        notify("success", "Unsubscribed — webhook leads will stop syncing for this page");
      } else {
        await subscribePage(pageId);
        notify("success", "Subscribed — leads will now sync automatically in real time");
      }
      setPages(prev => prev.map(p =>
        (p.pageId ?? p.pageIdentifier) === pageId ? { ...p, isSubscribed: !isSubscribed } : p
      ));
    } catch {
      notify("error", `Failed to ${isSubscribed ? "unsubscribe" : "subscribe"}`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">Page Subscriptions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enable webhook subscriptions to automatically receive leads from your Facebook pages in real time.
            {activeBrand && <> Active brand: <span className="font-semibold text-slate-700">{activeBrand.name}</span></>}
          </p>
        </div>

        {notification && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <span>{notification.type === "success" ? "✅" : "⚠️"}</span>
            {notification.message}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading Facebook pages…</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No Facebook Pages Found</h3>
            <p className="text-sm text-slate-400 mb-4">Connect a Facebook account first to manage webhook subscriptions</p>
            <button
              onClick={() => connectPlatform("facebook")}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
            >
              Connect Facebook
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700">
                {pages.length} Facebook Page{pages.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-blue-500">
                {pages.filter(p => p.isSubscribed).length} subscribed
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {pages.map(page => {
                const pageId       = page.pageId ?? page.pageIdentifier;
                const name         = page.name ?? page.displayName ?? pageId;
                const isSubscribed = page.isSubscribed ?? false;
                const isProcessing = processing === pageId;

                return (
                  <div key={pageId} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{name}</p>
                          <p className="text-xs text-slate-400 font-mono truncate">{pageId}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          isSubscribed
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isSubscribed ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                          {isSubscribed ? "Active" : "Inactive"}
                        </span>

                        <button
                          onClick={() => toggleSubscription(pageId, isSubscribed)}
                          disabled={isProcessing}
                          title={isSubscribed ? "Click to unsubscribe" : "Click to enable lead gen webhook"}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSubscribed ? "bg-green-500" : "bg-slate-300"
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            isSubscribed ? "translate-x-6" : "translate-x-1"
                          }`}>
                            {isProcessing
                              ? <svg className="animate-spin h-3 w-3 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <span className="text-xs">{isSubscribed ? "✓" : ""}</span>
                            }
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800">
          <p className="font-bold mb-1">💡 How Lead Gen Webhooks Work</p>
          <p className="leading-relaxed text-blue-700">
            When <strong>Active</strong>, your Facebook page is subscribed to Meta&apos;s <strong>leadgen</strong> webhook field.
            Any lead submitted via your page&apos;s lead ad forms is delivered to your CRM instantly — no manual sync needed.
            Toggle off to pause lead collection without disconnecting the page.
          </p>
        </div>

      </div>
    </div>
  );
}
