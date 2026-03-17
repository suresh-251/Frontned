import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getConnectedPages,
  selectPage,
  subscribePage,
  unsubscribePage,
} from "../api/facebook.pages.api";
import {
  activateInstagramAccount,
  getInstagramAccounts,
} from "../api/instagram.accounts.api";

export default function PageSelection() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get("returnUrl");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fbPages, setFbPages] = useState([]);
  const [igAccounts, setIgAccounts] = useState([]);
  const [selectedFbPage, setSelectedFbPage] = useState("");
  const [selectedIgAccount, setSelectedIgAccount] = useState("");
  const [subscribingPageId, setSubscribingPageId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pages, accounts] = await Promise.all([
          getConnectedPages(),
          getInstagramAccounts().catch(() => []),
        ]);

        const facebook = Array.isArray(pages) ? pages : [];
        const instagram = Array.isArray(accounts) ? accounts : [];

        setFbPages(facebook);
        setIgAccounts(instagram);

        const activeFb = facebook.find((p) => p.isActive)?.pageId ?? facebook[0]?.pageId ?? "";
        const activeIg = instagram.find((a) => a.isActive)?.instagramBusinessId ?? instagram[0]?.instagramBusinessId ?? "";
        setSelectedFbPage(activeFb);
        setSelectedIgAccount(activeIg);
      } catch {
        toast.error("Failed to load connected accounts.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const hasAnythingToSelect = useMemo(
    () => fbPages.length > 0 || igAccounts.length > 0,
    [fbPages, igAccounts]
  );

  const handleToggleSubscription = async (page) => {
    setSubscribingPageId(page.pageId);
    try {
      if (page.isSubscribed) {
        await unsubscribePage(page.pageId);
        toast.success(`Unsubscribed "${page.name}" from Graph API.`);
      } else {
        await subscribePage(page.pageId);
        toast.success(`Subscribed "${page.name}" to Graph API.`);
      }
      // Refresh pages to reflect new subscription state
      const updated = await getConnectedPages();
      setFbPages(Array.isArray(updated) ? updated : []);
    } catch {
      toast.error("Subscription update failed. Please try again.");
    } finally {
      setSubscribingPageId(null);
    }
  };

  const handleContinue = async () => {
    if (!hasAnythingToSelect) {
      toast.error("No connected page/account found. Connect Meta account first.");
      return;
    }

    setSaving(true);
    try {
      if (selectedFbPage) {
        await selectPage(selectedFbPage);

        // Auto-subscribe selected page if not already subscribed
        const page = fbPages.find((p) => p.pageId === selectedFbPage);
        if (page && !page.isSubscribed) {
          await subscribePage(selectedFbPage);
        }
      }
      if (selectedIgAccount) {
        await activateInstagramAccount(selectedIgAccount);
      }

      toast.success("Selection saved.");
      navigate(returnUrl || "/crm/socialmedia/dashboard", { replace: true });
    } catch {
      toast.error("Could not save selection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Select Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose the Facebook page and Instagram account to use in this brand.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-gray-500">Loading connected accounts...</p>
        ) : !hasAnythingToSelect ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No Facebook page or Instagram account found. Reconnect Meta and grant page permissions.
          </div>
        ) : (
          <>
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-gray-700">Facebook Pages</h2>
              <div className="mt-2 space-y-2">
                {fbPages.length === 0 && (
                  <p className="text-sm text-gray-400">No connected Facebook page found.</p>
                )}
                {fbPages.map((p) => (
                  <div
                    key={p.pageId}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      selectedFbPage === p.pageId
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <label className="flex flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="fb-page"
                        value={p.pageId}
                        checked={selectedFbPage === p.pageId}
                        onChange={(e) => setSelectedFbPage(e.target.value)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{p.name}</p>
                          {p.isSubscribed ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Subscribed
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Not subscribed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{p.pageId}</p>
                      </div>
                    </label>
                    <button
                      type="button"
                      disabled={subscribingPageId === p.pageId}
                      onClick={() => handleToggleSubscription(p)}
                      className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        p.isSubscribed
                          ? "border border-red-200 text-red-600 hover:bg-red-50"
                          : "border border-blue-200 text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {subscribingPageId === p.pageId
                        ? "..."
                        : p.isSubscribed
                        ? "Unsubscribe"
                        : "Subscribe"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-semibold text-gray-700">Instagram Accounts</h2>
              <div className="mt-2 space-y-2">
                {igAccounts.length === 0 && (
                  <p className="text-sm text-gray-400">No connected Instagram account found.</p>
                )}
                {igAccounts.map((a) => (
                  <label
                    key={a.instagramBusinessId}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="ig-account"
                      value={a.instagramBusinessId}
                      checked={selectedIgAccount === a.instagramBusinessId}
                      onChange={(e) => setSelectedIgAccount(e.target.value)}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {a.name || a.instagramBusinessId}
                      </p>
                      <p className="text-xs text-gray-400">{a.instagramBusinessId}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/crm/socialmedia/dashboard", { replace: true })}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={loading || saving || !hasAnythingToSelect}
            onClick={handleContinue}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
