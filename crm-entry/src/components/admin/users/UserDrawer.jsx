import { useEffect, useState } from "react";

import {
  getAdminUserById,
} from "../../../api/admin/users.api";

import ProfileTab from "./tabs/ProfileTab";
import RolesTab from "./tabs/RolesTab";
import UserSecurityTab from "./tabs/UserSecurityTab";
import UserAuditLogsTab from "./tabs/UserAuditLogsTab";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "roles", label: "Roles" },
  { key: "security", label: "Security" },
  { key: "audit", label: "Audit Logs" },
];

export default function UserDrawer({
  open,
  userId,
  onClose,
  onUserUpdated,
}) {
  const [activeTab, setActiveTab] = useState("profile");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =======================
     FETCH USER DETAILS
     ======================= */
  const loadUser = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const userData = await getAdminUserById(userId);

      // DEBUG (remove later)
      console.log("Fetched userData:", userData);

      setUser(userData);
    } catch (err) {
      console.error("User load error:", err);
      setError("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      loadUser();
    }
  }, [open, userId]);

  /* =======================
     RESET TAB ON USER CHANGE
     ======================= */
  useEffect(() => {
    if (open) setActiveTab("profile");
  }, [userId, open]);

  /* =======================
     CLEAR USER WHEN CLOSED
     ======================= */
  useEffect(() => {
    if (!open) {
      setUser(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* DRAWER */}
      <div className="ml-auto w-[480px] bg-white h-full shadow-xl relative z-50 flex flex-col">

        {/* HEADER */}
        <div className="border-b px-4 py-3 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {user?.username || user?.name || "User"}
            </h3>

            <p className="text-xs text-slate-500">
              {user?.email || ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* TABS */}
        <div className="border-b flex text-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* LOADING */}
          {loading && (
            <div className="text-sm text-slate-500">
              Loading user…
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          {/* USER DATA */}
          {!loading && user && (
            <>
              {activeTab === "profile" && (
                <ProfileTab
                  user={user}
                  onUpdated={async () => {
                    await loadUser();
                    onUserUpdated?.();
                  }}
                />
              )}

              {activeTab === "roles" && (
                <RolesTab
                  userId={userId}
                  onUpdated={async () => {
                    await loadUser();
                    onUserUpdated?.();
                  }}
                />
              )}

              {activeTab === "security" && (
                <UserSecurityTab userId={userId} />
              )}

              {activeTab === "audit" && (
                <UserAuditLogsTab userId={userId} />
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
