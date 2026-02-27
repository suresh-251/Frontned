import { useState, useEffect, useRef } from "react";
import useFacebookDashboard from "../hooks/useFacebookDashboard";
import api from "../api/apiClient";
import { connectPlatform } from "../api/auth.api";
import { getInstagramDisplayName } from "../utils/instagramDisplayName";
import { useNavigate } from "react-router-dom";
import {
  FiEdit,
  FiUsers,
  FiFileText,
  FiSettings,
} from "react-icons/fi";

export default function Dashboard() {
  const stats = useFacebookDashboard();
  const navigate = useNavigate();

  const [showChannels, setShowChannels] = useState(false);
  const [showAddAccounts, setShowAddAccounts] = useState(false);

  const [fbPages, setFbPages] = useState([]);
  const [igAccounts, setIgAccounts] = useState([]);
  const [linkedInPages, setLinkedInPages] = useState([]);
  const [linkedInProfile, setLinkedInProfile] = useState(null);

  const channelRef = useRef(null);
  const addRef = useRef(null);

  /* ================= LOAD CONNECTED ACCOUNTS (ORIGINAL LOGIC SAFE) ================= */
  useEffect(() => {
    api.get("/facebook/pages").then(res => setFbPages(res.data)).catch(() => {});
    api.get("/instagram/accounts").then(res => setIgAccounts(res.data)).catch(() => {});
    api.get("/linkedin/orgs").then(res => setLinkedInPages(res.data)).catch(() => {});
    api.get("/linkedin/read/profile")
      .then(res =>
        setLinkedInProfile({
          id: res.data.sub,
          name: res.data.name,
        })
      )
      .catch(() => {});
  }, []);

  /* ================= CLOSE DROPDOWN ================= */
  useEffect(() => {
    const handleClick = (e) => {
      if (channelRef.current && !channelRef.current.contains(e.target))
        setShowChannels(false);
      if (addRef.current && !addRef.current.contains(e.target))
        setShowAddAccounts(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!stats) return null;

  const leadStats = [
    { label: "New", value: stats.newLeads, color: "bg-blue-500" },
    { label: "Contacted", value: stats.contactedLeads, color: "bg-yellow-500" },
    { label: "Qualified", value: stats.qualifiedLeads, color: "bg-green-500" },
    { label: "Lost", value: stats.lostLeads, color: "bg-red-500" },
  ];

  return (
    <div className="h-[calc(100vh-70px)] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-6 py-4 overflow-hidden">

      <div className="max-w-7xl mx-auto h-full flex flex-col gap-5">

        {/* ===== HEADER ===== */}
         <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
  Dashboard
</h1>
<p className="text-gray-600 flex items-center gap-2 text-sm leading-tight">
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  Real-time overview of your social media performance
</p>

        {/* ===== TOP SECTION ===== */}
        <div className="flex items-center gap-6 relative">

          {/* CONNECTED CHANNELS BUTTON */}
          <div className="relative" ref={channelRef}>
            <button
              onClick={() => {
                setShowChannels(!showChannels);
                setShowAddAccounts(false);
              }}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition font-semibold"
            >
              Connected Channels
            </button>

            {showChannels && (
              <div className="absolute top-12 left-0 w-80 bg-white rounded-xl shadow-2xl border p-4 z-50 max-h-80 overflow-auto">

                <h4 className="font-semibold mb-3 text-gray-700">
                  Connected Accounts
                </h4>

                {/* Facebook */}
                {fbPages.length > 0 && (
                  <>
                    <p className="text-blue-600 text-xs font-bold mb-1">FACEBOOK</p>
                    {fbPages.map(p => (
                      <div key={p.pageId} className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                        {p.name}
                      </div>
                    ))}
                  </>
                )}

                {/* Instagram */}
                {igAccounts.length > 0 && (
                  <>
                    <p className="text-pink-600 text-xs font-bold mt-3 mb-1">INSTAGRAM</p>
                    {igAccounts.map(a => (
                      <div key={a.instagramBusinessId} className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                        {getInstagramDisplayName(a)}
                      </div>
                    ))}
                  </>
                )}

                {/* LinkedIn Profile */}
                {linkedInProfile && (
                  <>
                    <p className="text-blue-800 text-xs font-bold mt-3 mb-1">LINKEDIN PROFILE</p>
                    <div className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                      {linkedInProfile.name}
                    </div>
                  </>
                )}

                {/* LinkedIn Pages */}
                {linkedInPages.length > 0 && (
                  <>
                    <p className="text-indigo-600 text-xs font-bold mt-3 mb-1">LINKEDIN PAGES</p>
                    {linkedInPages.map(p => (
                      <div key={p.id} className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
                        {p.name}
                      </div>
                    ))}
                  </>
                )}

              </div>
            )}
          </div>

          {/* ADD BUTTON */}
          <div className="relative" ref={addRef}>
            <button
              onClick={() => {
                setShowAddAccounts(!showAddAccounts);
                setShowChannels(false);
              }}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-2xl shadow-md hover:scale-110 transition"
            >
              +
            </button>

            {showAddAccounts && (
              <div className="absolute top-12 left-0 w-72 bg-white rounded-xl shadow-2xl border p-4 z-50">
                <h4 className="font-semibold mb-3">Add Account</h4>

                <button
                  onClick={() => connectPlatform("facebook")}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg mb-2"
                >
                  Connect Facebook
                </button>

                <button
                  onClick={() => connectPlatform("facebook")}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg mb-2"
                >
                  Connect Instagram
                </button>

                <button
                  onClick={() => connectPlatform("linkedin")}
                  className="w-full py-2 bg-blue-800 text-white rounded-lg"
                >
                  Connect LinkedIn
                </button>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* SPECIAL TOTAL LEADS CARD */}
          <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg shadow-md 
                transform transition duration-300 hover:scale-105 hover:shadow-xl hover:from-indigo-500 hover:to-pink-500">
  <div className="flex items-center justify-between">
    <p className="text-xs uppercase tracking-wide opacity-80">Total Leads</p>
    <span className="w-6 h-6 flex items-center justify-center rounded-md bg-white/30 text-xs font-semibold animate-pulse">
      🚀
    </span>
  </div>
  <p className="text-2xl font-bold mt-1">{stats.totalLeads}</p>

  {/* Decorative animated accent */}
  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/20 rounded-full blur-md animate-bounce"></div>
</div>

        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 grid grid-cols-3 gap-5">

          {/* LEAD STATUS */}
          <div className="col-span-2 bg-white rounded-xl shadow p-5 flex flex-col justify-center">
            <h2 className="text-lg font-semibold mb-4">Lead Status</h2>

            <div className="space-y-4">
              {leadStats.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full`}
                      style={{
                        width:
                          stats.totalLeads > 0
                            ? `${(item.value / stats.totalLeads) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

            <div className="grid grid-cols-2 gap-4">

              <ActionCard icon={<FiEdit size={18} />} label="Create Post" onClick={() => navigate("/crm/socialmedia/post/create")} />
              <ActionCard icon={<FiUsers size={18} />} label="View Leads" onClick={() => navigate("/crm/socialmedia/leads")} />
              <ActionCard icon={<FiFileText size={18} />} label="Manage Forms" onClick={() => navigate("/crm/socialmedia/leads/forms")} />
              <ActionCard icon={<FiSettings size={18} />} label="Settings" onClick={() => navigate("/crm/socialmedia/facebook/pages/subscriptions")} />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== ACTION CARD ===== */
function ActionCard({ icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg p-4 flex flex-col items-center justify-center shadow-md hover:shadow-xl hover:-translate-y-1 transition"
    >
      <div className="mb-2">{icon}</div>
      <p className="text-sm font-medium text-center">{label}</p>
    </div>
  );
}