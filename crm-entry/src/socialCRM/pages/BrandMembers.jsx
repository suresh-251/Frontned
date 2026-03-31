import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useBrand } from "../context/BrandContext";
import { getAuthDetails } from "../../hr_CRM/configs/auth.utils";
import {
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
  updateMemberPermissions,
  getAvailableUsers,
  MemberRole,
  RoleLabels,
  RoleDescriptions,
  ModuleLabels,
  AllModules,
  getMemberUserId,
  normalizeMemberRole,
} from "../api/members.api";

const ROLE_COLORS = {
  0: "bg-purple-100 text-purple-800 border-purple-200", // Owner
  1: "bg-blue-100 text-blue-800 border-blue-200",       // Admin
  2: "bg-green-100 text-green-800 border-green-200",    // Manager
  3: "bg-orange-100 text-orange-800 border-orange-200", // Editor
  4: "bg-cyan-100 text-cyan-800 border-cyan-200",       // Analyst
  5: "bg-slate-100 text-slate-700 border-slate-200",    // Contributor
};

const ROLE_OPTIONS = Object.keys(RoleLabels)
  .map((k) => Number(k))
  .filter((n) => !Number.isNaN(n))
  .sort((a, b) => a - b);
const PERMISSION_CONTROL_KEY = "permission_control";

function initials(name) {
  if (!name) return "??";
  return name.split(" ").map((w) => w?.[0] || "").join("").toUpperCase().slice(0, 2) || "??";
}

function getMemberName(member) {
  return (
    member?.userName ||
    member?.name ||
    member?.fullName ||
    member?.user?.name ||
    member?.user?.userName ||
    (member?.userEmail ? String(member.userEmail).split("@")[0] : null) ||
    `User ${member?.userId ?? member?.id ?? "Unknown"}`
  );
}

function getMemberEmail(member) {
  return member?.userEmail || member?.email || member?.user?.email || "-";
}

function getUserId(user) {
  const id = user?.id ?? user?.userId;
  return id == null ? null : Number(id);
}

function isRole(member, expectedRole) {
  return normalizeMemberRole(member?.role) === expectedRole;
}

function getUserName(user) {
  return user?.name || user?.userName || user?.fullName || user?.email || `User ${getUserId(user) ?? ""}`.trim();
}

function getUserEmail(user) {
  return user?.email || user?.userEmail || "";
}

function normalizePermissionList(permissions) {
  return Array.isArray(permissions) ? permissions : [];
}

function hasPermissionControlAccess(member) {
  if (!member) return false;
  if (isRole(member, MemberRole.Owner) || isRole(member, MemberRole.Admin)) return true;

  return normalizePermissionList(member.permissions).some((permission) =>
    permission?.module === PERMISSION_CONTROL_KEY &&
    (permission?.canRead || permission?.canWrite || permission?.canUpdate || permission?.canDelete)
  );
}

function ensurePermissionControlPermission(permissions, enabled) {
  const list = normalizePermissionList(permissions).filter((permission) => permission?.module !== PERMISSION_CONTROL_KEY);
  if (!enabled) return list;

  return [
    ...list,
    {
      module: PERMISSION_CONTROL_KEY,
      canRead: true,
      canWrite: false,
      canUpdate: true,
      canDelete: false,
    },
  ];
}

function PermissionCheckbox({ checked, onChange, disabled, label }) {
  return (
    <label className={`flex items-center justify-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
        ${checked 
          ? "bg-blue-600 border-blue-600" 
          : "bg-white border-slate-300 hover:border-blue-400"
        }
        ${disabled ? "bg-slate-100 border-slate-200" : ""}
      `}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="sr-only">{label}</span>
    </label>
  );
}

function PermissionMatrix({ permissions, onChange, disabled }) {
  const getPermission = (module) => {
    return permissions.find((p) => p.module === module) || {
      module,
      canRead: false,
      canWrite: false,
      canUpdate: false,
      canDelete: false,
    };
  };

  const updatePermission = (module, field, value) => {
    const existing = permissions.filter((p) => p.module !== module);
    const current = getPermission(module);
    existing.push({ ...current, [field]: value });
    onChange(existing);
  };

  const toggleAll = (module, checked) => {
    const existing = permissions.filter((p) => p.module !== module);
    existing.push({
      module,
      canRead: checked,
      canWrite: checked,
      canUpdate: checked,
      canDelete: checked,
    });
    onChange(existing);
  };

  const isAllChecked = (module) => {
    const p = getPermission(module);
    return p.canRead && p.canWrite && p.canUpdate && p.canDelete;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-y border-slate-200">
            <th className="text-left py-3 px-4 font-semibold text-slate-700">Module</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-700 w-20">Read</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-700 w-20">Write</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-700 w-20">Update</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-700 w-20">Delete</th>
            <th className="text-center py-3 px-3 font-semibold text-slate-700 w-20">All</th>
          </tr>
        </thead>
        <tbody>
          {AllModules.map((module) => {
            const p = getPermission(module);
            return (
              <tr key={module} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="py-3 px-4 font-medium text-slate-800">{ModuleLabels[module]}</td>
                <td className="py-3 px-3 text-center">
                  <PermissionCheckbox
                    checked={p.canRead}
                    onChange={(v) => updatePermission(module, "canRead", v)}
                    disabled={disabled}
                    label={`${ModuleLabels[module]} Read`}
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <PermissionCheckbox
                    checked={p.canWrite}
                    onChange={(v) => updatePermission(module, "canWrite", v)}
                    disabled={disabled}
                    label={`${ModuleLabels[module]} Write`}
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <PermissionCheckbox
                    checked={p.canUpdate}
                    onChange={(v) => updatePermission(module, "canUpdate", v)}
                    disabled={disabled}
                    label={`${ModuleLabels[module]} Update`}
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <PermissionCheckbox
                    checked={p.canDelete}
                    onChange={(v) => updatePermission(module, "canDelete", v)}
                    disabled={disabled}
                    label={`${ModuleLabels[module]} Delete`}
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <PermissionCheckbox
                    checked={isAllChecked(module)}
                    onChange={(v) => toggleAll(module, v)}
                    disabled={disabled}
                    label={`${ModuleLabels[module]} All`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AddMemberModal({ onClose, onAdd }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState(MemberRole.Contributor);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAvailableUsers()
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load available users:", err);
        setError(err.message || "Failed to load users");
        toast.error(err.message || "Failed to load users");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleAdd = async () => {
    const selectedUserId = getUserId(selectedUser);
    if (!selectedUser || selectedUserId == null) return;
    setAdding(true);
    try {
      await onAdd({ userId: selectedUserId, role });
      toast.success(`${getUserName(selectedUser)} added to brand`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Add Team Member</h2>
          <p className="text-sm text-slate-500 mt-1">Select a user and assign their role</p>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User List */}
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading users...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {users.length === 0 ? "No users available to add" : "No matching users"}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-auto">
              {filteredUsers.map((user) => (
                <div
                  key={getUserId(user)}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3
                    ${getUserId(selectedUser) === getUserId(user)
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {initials(getUserName(user))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{getUserName(user)}</div>
                    <div className="text-xs text-slate-500 truncate">{getUserEmail(user)}</div>
                  </div>
                  {getUserId(selectedUser) === getUserId(user) && (
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Role Selection */}
          {selectedUser && (
            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Assign Role</label>
              <div className="space-y-2">
                {Object.entries(MemberRole)
                  .filter(([key]) => key !== 'Owner') // Can't assign Owner role
                  .map(([key, value]) => (
                    <div
                      key={key}
                      onClick={() => setRole(value)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all
                        ${role === value
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${role === value ? "text-blue-700" : "text-slate-700"}`}>
                          {RoleLabels[value]}
                        </span>
                        {role === value && (
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{RoleDescriptions[value]}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedUser || adding}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {adding ? "Adding..." : "Add Member"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberPermissionsModal({ member, canManage, onClose, onSave }) {
  const [permissions, setPermissions] = useState(normalizePermissionList(member.permissions));
  const [saving, setSaving] = useState(false);
  const permissionControlEnabled = permissions.some((permission) => permission?.module === PERMISSION_CONTROL_KEY);
  const modulePermissions = permissions.filter((permission) => permission?.module !== PERMISSION_CONTROL_KEY);

  const handleSave = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      await onSave(member.id, permissions);
      toast.success("Permissions updated");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const isFullAccess = isRole(member, MemberRole.Owner) || isRole(member, MemberRole.Admin);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {initials(member.userName)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{getMemberName(member)}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[normalizeMemberRole(member.role)]}`}>
                  {RoleLabels[normalizeMemberRole(member.role)]}
                </span>
                <span className="text-xs text-slate-500">{getMemberEmail(member)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {!canManage ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold">Permissions are restricted</p>
              <p className="mt-1 text-amber-700">
                Only Owners, Admins, or members with permission-control access can update member permissions.
              </p>
            </div>
          ) : isFullAccess ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold">Full Access</p>
              <p className="mt-1 text-blue-700">
                {isRole(member, MemberRole.Owner) ? "Owners" : "Admins"} automatically have full access to all modules.
                Permissions cannot be customized.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Permission Control Access</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Allow this member to open the permission manager and update permissions for other team members.
                    </p>
                  </div>
                  <PermissionCheckbox
                    checked={permissionControlEnabled}
                    onChange={(checked) => setPermissions((prev) => ensurePermissionControlPermission(prev, checked))}
                    disabled={!canManage}
                    label="Permission Control Access"
                  />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-700 mb-3">Module Permissions</h3>
              <PermissionMatrix
                permissions={modulePermissions}
                onChange={(nextPermissions) => setPermissions(ensurePermissionControlPermission(nextPermissions, permissionControlEnabled))}
                disabled={isFullAccess || !canManage}
              />
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          {!isFullAccess && canManage && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`py-2.5 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all ${isFullAccess || !canManage ? "flex-1" : "px-6"}`}
          >
            {isFullAccess || !canManage ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoveMemberModal({ member, onClose, onConfirm }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onConfirm(member.id);
      toast.success(`${getMemberName(member)} removed from brand`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to remove member");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Member</h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to remove <strong>{getMemberName(member)}</strong> from this brand?
          They will lose all access immediately.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrandMembers() {
  const { activeBrand } = useBrand();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);

  // Get current logged-in user's ID — try multiple sources for robustness
  const authDetails = getAuthDetails();
  const currentUserId = (() => {
    const raw = authDetails?.userId ?? authDetails?.id ?? authDetails?.sub;
    return raw != null ? String(raw) : null;
  })();
  
  // Debug log to understand the ID comparison
  useEffect(() => {
    if (members.length > 0 && currentUserId) {
      console.log("🔍 Member Debug:", {
        currentUserId,
        currentUserIdType: typeof currentUserId,
        members: members.map(m => ({ id: m.id, userId: m.userId, userIdType: typeof m.userId, normalizedUserId: getMemberUserId(m), role: m.role, normalizedRole: normalizeMemberRole(m.role), userName: m.userName })),
        authDetails,
      });
    }
  }, [members, currentUserId, authDetails]);

  // Find current user in members list
  const currentUserMember = members.find(
    (m) => currentUserId && getMemberUserId(m) === currentUserId
  );
  
  // Check ownership: user is in members list as Owner, OR user is the brand creator, OR is admin
  const isOwnerFromMember = isRole(currentUserMember, MemberRole.Owner);
  const brandOwnerId =
    activeBrand?.createdBy ??
    activeBrand?.userId ??
    activeBrand?.ownerId ??
    activeBrand?.createdByUserId;
  const isOwnerFromBrand = currentUserId && brandOwnerId != null && String(brandOwnerId) === currentUserId;
  const isMasterAdmin = authDetails?.isAdmin === true;
  const isOwner = isOwnerFromMember || isOwnerFromBrand || isMasterAdmin;
  
  const isAdmin = isRole(currentUserMember, MemberRole.Admin);
  const isOwnerOrAdmin = isOwner || isAdmin;
  const canManagePermissions = isOwner;

  const loadMembers = async () => {
    if (!activeBrand?.slug) {
      setLoading(false);
      setError("No active brand selected");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load members:", err);
      setError(err.message || "Failed to load members");
      toast.error(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [activeBrand?.slug]);

  const handleAddMember = async ({ userId, role }) => {
    await addMember({ userId, role });
    await loadMembers();
  };

  const handleUpdatePermissions = async (memberId, permissions) => {
    await updateMemberPermissions(memberId, permissions);
    await loadMembers();
  };

  const handleRemoveMember = async (memberId) => {
    await removeMember(memberId);
    await loadMembers();
  };

  const handleRoleChange = async (member, newRole) => {
    if (!isOwner) {
      toast.error("Only the brand owner can change member roles.");
      return;
    }
    try {
      await updateMemberRole(member.id, newRole);
      toast.success(`Role updated to ${RoleLabels[newRole]}`);
      await loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update role");
    }
  };

  // Handle no active brand
  if (!activeBrand?.slug) {
    return (
      <div className="min-h-screen bg-white px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="border border-slate-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No Brand Selected</h3>
            <p className="text-sm text-slate-400">Please select or create a brand first to manage team members.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-8 py-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Team Members</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage who has access to <span className="font-medium">{activeBrand?.name}</span>
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      <div className="px-8 py-6 max-w-6xl mx-auto space-y-6">
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          isOwner
            ? "border-blue-200 bg-blue-50 text-blue-800"
            : isOwnerOrAdmin
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
        }`}>
          {isOwner ? (
            <p>
              You are the brand owner. You can add or remove members, reassign roles, and control who sees which modules.
            </p>
          ) : isOwnerOrAdmin ? (
            <p>
              You have admin access to all modules. Role changes, member management, and permission control are restricted to the brand owner.
            </p>
          ) : (
            <p>
              You can view the team list. Only the brand owner can change roles, manage members, and update permissions.
            </p>
          )}
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button
              onClick={loadMembers}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Members List */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 p-12 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading members...</p>
          </div>
        ) : !error && members.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No Members Yet</h3>
            <p className="text-sm text-slate-400 mb-4">Add team members to collaborate on this brand</p>
            {isOwner && (
              <button
                onClick={() => setShowAdd(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                Add First Member
              </button>
            )}
          </div>
        ) : !error && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div className="col-span-4">Member</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-3">Joined</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div key={member.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors">
                  {/* Member Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {initials(getMemberName(member))}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">{getMemberName(member)}</div>
                      <div className="text-xs text-slate-500 truncate">{getMemberEmail(member)}</div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-2">
                    <select
                      value={normalizeMemberRole(member.role)}
                      onChange={(e) => handleRoleChange(member, parseInt(e.target.value, 10))}
                      disabled={!isOwner || isRole(member, MemberRole.Owner)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border appearance-none pr-6 ${
                        !isOwner || isRole(member, MemberRole.Owner) ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                      } ${ROLE_COLORS[normalizeMemberRole(member.role)] || ROLE_COLORS[5]}`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 4px center', backgroundRepeat: 'no-repeat', backgroundSize: '14px' }}
                    >
                      {ROLE_OPTIONS.map((roleValue) => (
                        <option key={roleValue} value={roleValue}>
                          {RoleLabels[roleValue]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Joined */}
                  <div className="col-span-3 text-sm text-slate-500">
                    {new Date(member.joinedAt || member.createdAt || Date.now()).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => canManagePermissions && setEditMember(member)}
                      disabled={!canManagePermissions}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="View/Edit permissions"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Permissions
                    </button>
                    {!isRole(member, MemberRole.Owner) && isOwner && (
                      <button
                        onClick={() => setRemovingMember(member)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-200"
                        title="Remove member"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
          <p className="font-semibold mb-1">About Roles & Permissions</p>
          <ul className="text-slate-600 text-xs space-y-1 list-disc list-inside">
            <li><strong>Owner</strong> — Full control. Can add/remove members, change roles, and manage all permissions. Controls who sees which modules.</li>
            <li><strong>Admin</strong> — Full access to all modules automatically, but cannot manage members or permissions.</li>
            <li><strong>Other roles</strong> — Only see modules the owner has granted them access to. Modules not assigned will be hidden from the sidebar.</li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddMemberModal onClose={() => setShowAdd(false)} onAdd={handleAddMember} />
      )}
      {editMember && (
        <MemberPermissionsModal
          member={editMember}
          canManage={canManagePermissions}
          onClose={() => setEditMember(null)}
          onSave={handleUpdatePermissions}
        />
      )}
      {removingMember && (
        <RemoveMemberModal
          member={removingMember}
          onClose={() => setRemovingMember(null)}
          onConfirm={handleRemoveMember}
        />
      )}
    </div>
  );
}
