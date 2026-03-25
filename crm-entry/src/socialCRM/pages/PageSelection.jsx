import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { selectPage } from "../api/facebook.pages.api";
import { activateInstagramAccount } from "../api/instagram.accounts.api";
import { selectLinkedInOrg } from "../api/linkedin.orgs.api";
import {
  connectFacebook,
  connectInstagramViaFacebook,
  connectLinkedIn,
  getPlatformResources,
} from "../api/auth.api";

const FLOW_META = {
  facebook: {
    title: "Select Facebook Page",
    subtitle: "Choose one Facebook page for this brand. Only the selected page will stay connected.",
    emptyText: "No Facebook pages found. Connect your Facebook account first.",
    connectText: "Connect Facebook",
    connectAction: connectFacebook,
    idKey: "id",
  },
  instagram: {
    title: "Select Instagram Account",
    subtitle: "Choose one Instagram business account for this brand.",
    emptyText: "No Instagram accounts found. Connect your Instagram account first.",
    connectText: "Connect Instagram (via Facebook)",
    connectAction: connectInstagramViaFacebook,
    idKey: "id",
  },
  linkedin: {
    title: "Select LinkedIn Account",
    subtitle: "Choose one LinkedIn profile/page for this brand.",
    emptyText: "No LinkedIn accounts found. Connect your LinkedIn account first.",
    connectText: "Connect LinkedIn",
    connectAction: connectLinkedIn,
    idKey: "id",
  },
};

const PLATFORM_BADGE = {
  facebook: { bg: "bg-blue-600", letter: "F" },
  instagram: { bg: "bg-gradient-to-tr from-purple-500 to-pink-500", letter: "I" },
  linkedin: { bg: "bg-sky-600", letter: "L" },
};

export default function PageSelection() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get("returnUrl");
  const platform = (params.get("platform") || "facebook").toLowerCase();
  const flow = FLOW_META[platform] || FLOW_META.facebook;
  const badge = PLATFORM_BADGE[platform] || PLATFORM_BADGE.facebook;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [tokenError, setTokenError] = useState(false);
  const [connectedUserName, setConnectedUserName] = useState("-");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setTokenError(false);
      setConnectedUserName("-");

      try {
        const data = await getPlatformResources(platform);
        if (data?.userName) setConnectedUserName(data.userName);

        const items = (data?.resources || []).map((r) => ({
          id: r.id,
          name: r.name || r.id,
          profilePicture: r.profilePicture || null,
          isActive: r.isActive || false,
        }));

        // Always require explicit selection — no auto-proceed
        setResources(items);
        setSelectedId(items[0]?.id || "");
      } catch (err) {
        if (err?.code === "social_token_expired" || err?.message?.includes("reconnect")) {
          setTokenError(true);
        }
        toast.error("Failed to load connected accounts.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [platform, navigate, returnUrl]);

  const hasResources = resources.length > 0;

  const handleContinue = async () => {
    if (!selectedId) {
      toast.error("Please select an account to continue.");
      return;
    }

    setSaving(true);
    try {
      if (platform === "facebook") {
        await selectPage(selectedId);
        toast.success("Facebook page selected. Syncing leads, analytics and inbox...");
      } else if (platform === "instagram") {
        await activateInstagramAccount(selectedId);
        toast.success("Instagram account selected.");
      } else if (platform === "linkedin") {
        await selectLinkedInOrg(selectedId);
        toast.success("LinkedIn account selected.");
      }

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
        <h1 className="text-2xl font-bold text-gray-900">{flow.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{flow.subtitle}</p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Connected User: <span className="font-semibold text-slate-800">{connectedUserName || "-"}</span>
        </div>

        {platform === "facebook" && tokenError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-2 text-sm font-medium text-red-800">
              Your Facebook session has expired. Reconnect to load all pages.
            </p>
            <button
              onClick={connectFacebook}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Reconnect Facebook
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading accounts...
          </div>
        ) : !hasResources ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <div className={`mx-auto h-16 w-16 rounded-full ${badge.bg} text-white flex items-center justify-center text-2xl font-bold mb-3`}>
              {badge.letter}
            </div>
            <p className="text-sm text-amber-800">{flow.emptyText}</p>
            <button
              onClick={() => flow.connectAction()}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {flow.connectText}
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {resources.map((r) => {
              const isSelected = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {/* Profile picture or fallback */}
                  <div className="relative flex-shrink-0">
                    {r.profilePicture ? (
                      <img
                        src={r.profilePicture}
                        alt={r.name}
                        className="h-12 w-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-full ${badge.bg} text-white flex items-center justify-center text-lg font-bold`}>
                        {r.name?.charAt(0)?.toUpperCase() || badge.letter}
                      </div>
                    )}
                    {/* Checkmark overlay when selected */}
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Account info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                      {r.isActive && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Currently Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{r.id}</p>
                  </div>

                  {/* Selection indicator */}
                  <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 ${
                    isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}>
                    {isSelected && (
                      <svg className="h-full w-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(returnUrl || "/crm/socialmedia/dashboard", { replace: true })}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={loading || saving || !hasResources || !selectedId}
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
