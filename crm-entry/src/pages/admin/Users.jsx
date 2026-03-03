import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";

import CreateUser from "../../components/admin/users/CreateUser";
import UsersTable from "../../components/admin/users/UsersTable";
import UserDrawer from "../../components/admin/users/UserDrawer";

import { getAdminUsers } from "../../api/admin/users.api";
import {
  lockUser,
  unlockUser,
  updateUserStatus,
} from "../../api/users/users.api";

import { getDomains } from "../../api/admin/domains.api";
import { getAdminRoles } from "../../api/admin/roles.api";

import useTableFilters from "../../hooks/useTableFilters";

export default function Users() {
  const { permissions, user } = useAuth();

  /* STATE */
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  /* FILTERS */
  const [search, setSearch] = useState("");
  const [domainCode, setDomainCode] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [status, setStatus] = useState("");

  /* PAGINATION */
  const [page, setPage] = useState(1);
  const pageSize = 25;

  /* FETCH USERS */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getAdminUsers({ page, pageSize });
      setUsers(res?.users ?? res ?? []);
    } catch (err) {
      console.error("Users fetch error:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* FETCH DOMAINS + ROLES */
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [domainsData, rolesData] = await Promise.all([
          getDomains(),
          getAdminRoles(),
        ]);

        setDomains(Array.isArray(domainsData) ? domainsData : []);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (err) {
        console.error("Reference data error:", err);
        setDomains([]);
        setRoles([]);
      }
    };

    loadReferenceData();
  }, []);

  /* FILTER USERS */
  const filteredUsers = useTableFilters(users, {
    search,
    domainCode,
    roleCode,
    status,
  });

  /* LOCK */
  const handleLock = async (userId) => {
    const reason = window.prompt(
      "Reason for locking this user?",
      "Violation of policy"
    );
    if (!reason) return;

    await lockUser(userId, reason);
    loadUsers();
  };

  /* UNLOCK */
  const handleUnlock = async (userId) => {
    if (!window.confirm("Unlock this user?")) return;
    await unlockUser(userId);
    loadUsers();
  };

  /* STATUS CHANGE (PATCH API) */
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const formattedStatus =
        newStatus.charAt(0) + newStatus.slice(1).toLowerCase();

      await updateUserStatus(userId, formattedStatus);
      loadUsers();
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const canLock =
    permissions?.includes("USER_LOCK") ||
    permissions?.includes("CRM_FULL_ACCESS");

  const canCreate =
    permissions?.includes("USER_CREATE") ||
    permissions?.includes("CRM_FULL_ACCESS");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Users Management
              </h2>
              <p className="text-sm text-gray-600">
                Manage users, roles, domains and access control
              </p>
            </div>

            {canCreate && (
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Create User
              </button>
            )}
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <select
              value={domainCode}
              onChange={(e) => setDomainCode(e.target.value)}
              className="border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="">All Domains</option>
              {domains.map((d) => (
                <option key={d.domainId} value={d.domainCode}>
                  {d.domainName}
                </option>
              ))}
            </select>

            <select
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value)}
              className="border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.roleCode} value={r.roleCode}>
                  {r.roleName}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">✅ Active</option>
              <option value="INACTIVE">🟡 Inactive</option>
              <option value="LOCKED">🔒 Locked</option>
              <option value="EXITED">🚫 Exited</option>
            </select>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <UsersTable
            users={filteredUsers}
            permissions={permissions}
            currentUserId={Number(user?.sub)}
            onLock={canLock ? handleLock : undefined}
            onUnlock={canLock ? handleUnlock : undefined}
            onStatusChange={handleStatusChange}
            onSelectUser={(id) => {
              setSelectedUserId(id);
              setDrawerOpen(true);
            }}
          />
        </div>

        {/* USER DRAWER */}
        <UserDrawer
          open={drawerOpen}
          userId={selectedUserId}
          onClose={() => setDrawerOpen(false)}
          onUserUpdated={loadUsers}
        />

        {/* CREATE USER */}
        {createOpen && (
          <CreateUser
            onSuccess={() => {
              setCreateOpen(false);
              loadUsers();
            }}
            onClose={() => setCreateOpen(false)}
          />
        )}
      </div>
    </div>
  );
}