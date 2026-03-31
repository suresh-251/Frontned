import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  connectFacebook,
  connectInstagramViaFacebook,
  connectLinkedIn,
  disconnectPlatform,
  getAccountsSummary,
} from "../api/auth.api";
import { getBrandAccounts } from "../api/brand.api";
import { useBrand } from "../context/BrandContext";

// Platform configurations
const PLATFORM_ROWS = [
  { id: "facebook", label: "Facebook Page", platform: "facebook", type: "page" },
  { id: "twitter", label: "X Profile", platform: "twitter", type: "profile" },
  { id: "linkedin-profile", label: "LinkedIn Profile", platform: "linkedin", type: "profile" },
  { id: "linkedin-org", label: "LinkedIn Company Page", platform: "linkedin", type: "page" },
  { id: "instagram", label: "Instagram Profile", platform: "instagram", type: "profile" },
  { id: "google", label: "Google Business Profile", platform: "google", type: "page" },
];

// Platform icons as SVG components
const PlatformIcon = ({ platform, className = "w-6 h-6" }) => {
  switch (platform) {
    case "facebook":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case "twitter":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case "linkedin":
    case "linkedin-profile":
    case "linkedin-org":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    case "instagram":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
        </svg>
      );
    case "google":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      );
    default:
      return <div className={`${className} rounded-full bg-slate-400`} />;
  }
};

// Platform colors
const PLATFORM_COLORS = {
  facebook: { bg: "bg-blue-600", text: "text-blue-600", hover: "hover:bg-blue-50" },
  twitter: { bg: "bg-black", text: "text-black", hover: "hover:bg-slate-50" },
  linkedin: { bg: "bg-sky-600", text: "text-sky-600", hover: "hover:bg-sky-50" },
  "linkedin-profile": { bg: "bg-sky-600", text: "text-sky-600", hover: "hover:bg-sky-50" },
  "linkedin-org": { bg: "bg-sky-700", text: "text-sky-700", hover: "hover:bg-sky-50" },
  instagram: { bg: "bg-gradient-to-tr from-purple-600 to-pink-500", text: "text-pink-600", hover: "hover:bg-pink-50" },
  google: { bg: "bg-white", text: "text-slate-700", hover: "hover:bg-slate-50" },
};

// Meta/Facebook style permissions per platform
const PLATFORM_PERMISSIONS = {
  facebook: [
    { key: "manage_posts", label: "Manage Posts", enabled: true },
    { key: "read_content", label: "Read User Content", enabled: true },
    { key: "read_insights", label: "Read Insights", enabled: true },
    { key: "manage_ads", label: "Manage Ads", enabled: false },
    { key: "leads_retrieval", label: "Leads Retrieval", enabled: true },
    { key: "manage_engagement", label: "Manage Engagement", enabled: true },
    { key: "manage_metadata", label: "Manage Metadata", enabled: true },
    { key: "messaging", label: "Messaging", enabled: true },
    { key: "read_engagement", label: "Read Engagement", enabled: true },
  ],
  twitter: [
    { key: "post_tweets", label: "Post Tweets", enabled: true },
    { key: "read_tweets", label: "Read Tweets", enabled: true },
    { key: "manage_followers", label: "Manage Followers", enabled: false },
    { key: "direct_messages", label: "Direct Messages", enabled: true },
    { key: "view_analytics", label: "View Analytics", enabled: true },
  ],
  "linkedin-profile": [
    { key: "publishing", label: "Publishing", enabled: true },
    { key: "basic_info", label: "Basic Info", enabled: true },
    { key: "read_connections", label: "Read Connections", enabled: false },
    { key: "messaging", label: "Messaging", enabled: true },
  ],
  "linkedin-org": [
    { key: "publishing", label: "Publishing", enabled: true },
    { key: "basic_info", label: "Basic Info", enabled: true },
    { key: "admin_access", label: "Admin Access", enabled: true },
    { key: "analytics", label: "Analytics", enabled: true },
    { key: "manage_followers", label: "Manage Followers", enabled: false },
  ],
  instagram: [
    { key: "publishing", label: "Publishing", enabled: true },
    { key: "basic_info", label: "Basic Info", enabled: true },
    { key: "read_insights", label: "Read Insights", enabled: true },
    { key: "manage_comments", label: "Manage Comments", enabled: true },
    { key: "messaging", label: "Messaging", enabled: false },
    { key: "read_engagement", label: "Read Engagement", enabled: true },
  ],
  google: [
    { key: "manage_posts", label: "Manage Posts", enabled: true },
    { key: "manage_reviews", label: "Manage Reviews", enabled: true },
    { key: "read_insights", label: "Read Insights", enabled: true },
    { key: "manage_info", label: "Manage Info", enabled: true },
    { key: "respond_reviews", label: "Respond to Reviews", enabled: true },
  ],
};

export default function SocialAccounts() {
  const { activeBrand } = useBrand();
  const [loading, setLoading] = useState(true);
  const [summaryByPlatform, setSummaryByPlatform] = useState({});
  const [brandAccounts, setBrandAccounts] = useState([]);
  const [busyKey, setBusyKey] = useState(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [summary, accounts] = await Promise.all([
          getAccountsSummary().catch(() => []),
          activeBrand?.slug ? getBrandAccounts(activeBrand.slug).catch(() => ({ accounts: [] })) : { accounts: [] },
        ]);

        const sMap = {};
        (Array.isArray(summary) ? summary : []).forEach((row) => {
          if (!row?.platform) return;
          sMap[row.platform.toLowerCase()] = row;
        });
        setSummaryByPlatform(sMap);
        
        setBrandAccounts(accounts?.accounts || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeBrand?.slug]);

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
      setBrandAccounts((prev) => prev.filter(a => a.platform?.toLowerCase() !== platform));
    } catch (err) {
      toast.error(err?.message || "Failed to disconnect account.");
    } finally {
      setBusyKey(null);
      setConfirmDisconnect(null);
    }
  };

  const isConnected = (platform) => !!summaryByPlatform[platform]?.connected;

  const getConnectedInfo = (rowId) => {
    const p = PLATFORM_ROWS.find(r => r.id === rowId);
    const basePlatform = p?.platform || rowId;
    const summary = summaryByPlatform[basePlatform];
    
    if (rowId === "linkedin-profile") {
      const profile = brandAccounts.find(a => 
        a.platform?.toLowerCase() === "linkedin" && a.accountType === "profile"
      );
      return {
        name: profile?.displayName || summary?.userName || null,
        avatar: profile?.profilePictureUrl || summary?.activePage?.profilePicture || null,
      };
    }
    if (rowId === "linkedin-org") {
      const org = brandAccounts.find(a => 
        a.platform?.toLowerCase() === "linkedin" && a.accountType === "organization"
      );
      return {
        name: org?.displayName || null,
        avatar: org?.profilePictureUrl || null,
      };
    }
    
    return {
      name: summary?.activePage?.name || summary?.userName || null,
      avatar: summary?.activePage?.profilePicture || null,
    };
  };

  const isRowConnected = (rowId) => {
    const p = PLATFORM_ROWS.find(r => r.id === rowId);
    const basePlatform = p?.platform || rowId;
    
    if (rowId === "linkedin-profile") {
      return isConnected(basePlatform) && brandAccounts.some(a => 
        a.platform?.toLowerCase() === "linkedin" && a.accountType === "profile"
      );
    }
    if (rowId === "linkedin-org") {
      return isConnected(basePlatform) && brandAccounts.some(a => 
        a.platform?.toLowerCase() === "linkedin" && a.accountType === "organization"
      );
    }
    
    return isConnected(basePlatform);
  };

  const getPermissions = (rowId) => {
    return PLATFORM_PERMISSIONS[rowId] || PLATFORM_PERMISSIONS[PLATFORM_ROWS.find(r => r.id === rowId)?.platform] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-8 py-6">
        <h1 className="text-xl font-semibold text-slate-900">Social Channels</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage connected social media channels for {activeBrand?.name || "your brand"}
        </p>
      </div>

      {/* Platform List */}
      <div className="divide-y divide-slate-100">
        {PLATFORM_ROWS.map((p) => {
          const rowId = p.id;
          const basePlatform = p.platform;
          const connected = isRowConnected(rowId);
          const connectedInfo = getConnectedInfo(rowId);
          const permissions = getPermissions(rowId);
          const disconnectBusy = busyKey === `disconnect:${basePlatform}`;
          const isHovered = hoveredRow === rowId;
          const colors = PLATFORM_COLORS[rowId] || PLATFORM_COLORS[basePlatform];

          return (
            <div
              key={rowId}
              className="flex items-center justify-between px-8 py-5 hover:bg-slate-50/50 transition-colors"
              onMouseEnter={() => setHoveredRow(rowId)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Left: Platform Icon, Name, and Connect/Connected Info */}
              <div className="flex items-center gap-4">
                {/* Platform Icon - Always colored */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.text}`}>
                  <PlatformIcon platform={basePlatform} className="w-7 h-7" />
                </div>

                {/* Platform Name */}
                <span className="font-medium text-slate-800 w-44">{p.label}</span>

                {/* Connect Button or Connected Info */}
                {connected && connectedInfo.name ? (
                  <div className="flex items-center gap-3">
                    {/* Channel Avatar */}
                    {connectedInfo.avatar ? (
                      <img
                        src={connectedInfo.avatar}
                        alt={connectedInfo.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-full ${colors.bg} text-white flex items-center justify-center text-sm font-semibold`}>
                        {connectedInfo.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Connected As + Disconnect */}
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700">
                        Connected as <span className="font-medium">{connectedInfo.name}</span>
                      </span>
                      <button
                        type="button"
                        disabled={disconnectBusy}
                        onClick={() => setConfirmDisconnect(basePlatform)}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline text-left disabled:opacity-50"
                      >
                        {disconnectBusy ? "Disconnecting..." : "Disconnect"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (basePlatform === "facebook") connectFacebook();
                      else if (basePlatform === "instagram") connectInstagramViaFacebook();
                      else if (basePlatform === "linkedin") connectLinkedIn();
                    }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${colors.text} border border-current hover:bg-slate-50`}
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Right: Permissions with exclamation icon */}
              {connected && (
                <div 
                  className="flex items-center gap-2 transition-all duration-300 ease-out"
                >
                  {/* Exclamation icon */}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium uppercase tracking-wide">Permissions</span>
                  </div>
                  
                  {/* Permission badges */}
                  <div className={`flex items-center gap-1.5 transition-all duration-300 ${isHovered ? "flex-wrap max-w-md" : ""}`}>
                    {(isHovered ? permissions : permissions.slice(0, 2)).map((perm) => (
                      <span
                        key={perm.key}
                        className={`
                          inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap
                          ${perm.enabled 
                            ? "text-green-700" 
                            : "text-red-600"
                          }
                        `}
                      >
                        {perm.enabled ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        {perm.label}
                      </span>
                    ))}
                    {!isHovered && permissions.length > 2 && (
                      <span className="text-slate-400 text-xs cursor-pointer hover:text-slate-600">
                        +{permissions.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disconnect Confirmation Dialog */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
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
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyKey === `disconnect:${confirmDisconnect}`}
                onClick={() => handleDisconnect(confirmDisconnect)}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60 transition-colors"
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
