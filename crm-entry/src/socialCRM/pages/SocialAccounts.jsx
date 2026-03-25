import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  connectFacebook,
  connectInstagramDirect,
  connectInstagramViaFacebook,
  connectLinkedIn,
  disconnectPlatform,
  getAccountsSummary,
  getAccountHealth,
} from "../api/auth.api";

const PLATFORM_ROWS = [
  { id: "facebook", label: "Facebook", color: "blue", icon: "F" },
  { id: "instagram", label: "Instagram", color: "pink", icon: "I" },
  { id: "linkedin", label: "LinkedIn", color: "sky", icon: "L" },
];

const BORDER_COLORS = {
  facebook: "border-l-blue-500",
  instagram: "border-l-pink-500",
  linkedin: "border-l-sky-500",
};

const BADGE_COLORS = {
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-tr from-purple-500 to-pink-500",
  linkedin: "bg-sky-600",
};

export default function SocialAccounts() {
  const [loading, setLoading] = useState(true);
  const [summaryByPlatform, setSummaryByPlatform] = useState({});
  const [healthByPlatform, setHealthByPlatform] = useState({});
  const [busyKey, setBusyKey] = useState(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [summary, health] = await Promise.all([
          getAccountsSummary().catch(() => []),
          getAccountHealth().catch(() => []),
        ]);

        const sMap = {};
        (Array.isArray(summary) ? summary : []).forEach((row) => {
          if (!row?.platform) return;
          sMap[row.platform.toLowerCase()] = row;
        });
        setSummaryByPlatform(sMap);

        const hMap = {};
        (Array.isArray(health) ? health : []).forEach((row) => {
          if (!row?.platform) return;
          hMap[row.platform.toLowerCase()] = row;
        });
        setHealthByPlatform(hMap);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDisconnect = async (platform) => {
    setBusyKey(`disconnect:${platform}`);
    try {
      await disconnectPlatform(platform);
      toast.success(`${platform} disconnected.`);
      setSummaryByPlatform((prev) => ({
        ...prev,
        [platform]: {
          platform,
          connected: false,
          userName: null,
          status: "not_connected",
          activePage: null,
          resourceCount: 0,
        },
      }));
      setHealthByPlatform((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], connected: false, status: "not_connected" },
      }));
    } catch (err) {
      toast.error(err?.message || "Failed to disconnect account.");
    } finally {
      setBusyKey(null);
      setConfirmDisconnect(null);
    }
  };

  const getHealthStatus = (platform) => {
    const h = healthByPlatform[platform];
    const s = summaryByPlatform[platform];
    if (!s?.connected && !h?.connected) return { label: "Not connected", color: "text-slate-400" };
    const status = h?.status || s?.status;
    if (status === "expired") return { label: "Token expired", color: "text-red-600", bg: "bg-red-50" };
    if (status === "expiring_soon") {
      const days = h?.daysUntilExpiry ?? "?";
      return { label: `Expiring in ${days} days`, color: "text-amber-600", bg: "bg-amber-50" };
    }
    if (status === "healthy") {
      const days = h?.daysUntilExpiry;
      return { label: days ? `Healthy - expires in ${days} days` : "Healthy", color: "text-green-600", bg: "bg-green-50" };
    }
    return { label: "Connected", color: "text-green-600" };
  };

  const connectedUser = (platform) => summaryByPlatform[platform]?.userName || "-";
  const activeResource = (platform) => summaryByPlatform[platform]?.activePage?.name || "-";
  const activeAvatar = (platform) => summaryByPlatform[platform]?.activePage?.profilePicture || null;
  const isConnected = (platform) => !!summaryByPlatform[platform]?.connected;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Manage Social Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect and disconnect platform sessions here. Connection is separate from Brand Management.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Loading account sessions...</p>
        ) : (
          <div className="mt-6 space-y-4">
            {PLATFORM_ROWS.map((p) => {
              const platform = p.id;
              const connected = isConnected(platform);
              const disconnectBusy = busyKey === `disconnect:${platform}`;
              const health = getHealthStatus(platform);

              return (
                <div
                  key={platform}
                  className={`rounded-xl border border-slate-200 border-l-4 ${BORDER_COLORS[platform]} p-4`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0">
                        {activeAvatar(platform) ? (
                          <img
                            src={activeAvatar(platform)}
                            alt={`${p.label} account`}
                            className="h-14 w-14 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className={`h-14 w-14 rounded-full ${BADGE_COLORS[platform]} text-white flex items-center justify-center text-xl font-bold`}>
                            {p.icon}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-800">{p.label}</h2>
                        <span className={`inline-block mt-0.5 text-xs font-medium ${health.color} ${health.bg ? `${health.bg} rounded px-1.5 py-0.5` : ""}`}>
                          {health.label}
                        </span>
                        {connected && (
                          <>
                            <p className="mt-2 text-xs text-slate-500">
                              Connected User: <span className="font-medium text-slate-700">{connectedUser(platform)}</span>
                            </p>
                            <p className="text-xs text-slate-500">
                              Active Account: <span className="font-medium text-slate-700">{activeResource(platform)}</span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {connected ? (
                        <button
                          type="button"
                          disabled={disconnectBusy}
                          onClick={() => setConfirmDisconnect(platform)}
                          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <>
                          {platform === "facebook" && (
                            <button
                              type="button"
                              onClick={() => connectFacebook()}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Connect Facebook
                            </button>
                          )}
                          {platform === "instagram" && (
                            <>
                              <button
                                type="button"
                                onClick={() => connectInstagramViaFacebook()}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Login via Facebook
                              </button>
                              <button
                                type="button"
                                onClick={() => connectInstagramDirect()}
                                className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                              >
                                Login via Instagram
                              </button>
                            </>
                          )}
                          {platform === "linkedin" && (
                            <button
                              type="button"
                              onClick={() => connectLinkedIn()}
                              className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                            >
                              Connect LinkedIn
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Dialog */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Disconnect {confirmDisconnect.charAt(0).toUpperCase() + confirmDisconnect.slice(1)}?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This will remove all stored pages, leads, analytics, inbox data, and post history for this platform.
              <span className="font-semibold text-red-600"> This cannot be undone.</span>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDisconnect(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyKey === `disconnect:${confirmDisconnect}`}
                onClick={() => handleDisconnect(confirmDisconnect)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyKey === `disconnect:${confirmDisconnect}` ? "Disconnecting..." : "Confirm Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
