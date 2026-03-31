import api from "./apiClient";
import { secureStorage } from "../../utils/secureStorage";
import { getUsers as getAdminUsers } from "../../api/admin/users.api";

/** Get the active brand slug */
const getSlug = () => secureStorage.get("brandSlug");

const ROLE_NAME_TO_VALUE = {
  owner: 0,
  admin: 1,
  manager: 2,
  editor: 3,
  analyst: 4,
  contributor: 5,
};

export const normalizeMemberRole = (role) => {
  if (typeof role === "number" && Number.isFinite(role)) return role;

  const numericRole = Number(role);
  if (Number.isFinite(numericRole)) return numericRole;

  const normalized = String(role || "").trim().toLowerCase();
  return ROLE_NAME_TO_VALUE[normalized] ?? MemberRole.Contributor;
};

export const getMemberUserId = (member) => {
  const raw =
    member?.userId ??
    member?.userID ??
    member?.accountUserId ??
    member?.memberUserId ??
    member?.user?.id ??
    member?.user?.userId ??
    member?.id;

  return raw == null ? null : String(raw);
};

const normalizeMember = (member) => ({
  ...member,
  role: normalizeMemberRole(member?.role),
  userId: getMemberUserId(member),
  joinedAt:
    member?.joinedAt ??
    member?.createdAt ??
    member?.createdOn ??
    member?.created_date ??
    null,
});

/** Get all members of the active brand, enriching with user names from admin API */
export const getMembers = async () => {
  const slug = getSlug();
  if (!slug) throw new Error("No active brand");
  const res = await api.get(`/brands/${slug}/members`);
  const members = Array.isArray(res.data) ? res.data.map(normalizeMember) : [];
  
  // If any member is missing userName, try to fetch from admin users API
  const membersNeedingNames = members.filter(m => !m.userName);
  if (membersNeedingNames.length > 0) {
    try {
      const allUsers = await getAdminUsers();
      const usersArray = Array.isArray(allUsers?.users) 
        ? allUsers.users 
        : Array.isArray(allUsers?.items) 
          ? allUsers.items 
          : Array.isArray(allUsers) 
            ? allUsers 
            : [];
      const userMap = new Map(
        usersArray.map((u) => [String(u.id ?? u.userId), u])
      );
      
      return members.map(m => {
        if (m.userName) return m;
        const user = userMap.get(m.userId);
        return {
          ...m,
          userName: user?.name || user?.userName || user?.username || `User ${m.userId}`,
          userEmail: m.userEmail || user?.email || null,
        };
      });
    } catch (err) {
      console.warn("Could not fetch user names from admin API:", err);
    }
  }
  
  return members;
};

/** Get a specific member by ID */
export const getMember = async (memberId) => {
  const slug = getSlug();
  if (!slug) throw new Error("No active brand");
  const res = await api.get(`/brands/${slug}/members/${memberId}`);
  return normalizeMember(res.data);
};

/** Add a new member to the brand */
export const addMember = async ({ userId, role = 2 }) => {
  const slug = getSlug();
  if (!slug) throw new Error("No active brand");
  const res = await api.post(`/brands/${slug}/members`, { userId, role });
  return res.data;
};

/** Remove a member from the brand */
export const removeMember = async (memberId) => {
  const slug = getSlug();
  if (!slug) throw new Error("No active brand");
  await api.delete(`/brands/${slug}/members/${memberId}`);
};

/** Update a member's role */
export const updateMemberRole = async (memberId, role) => {
  const slug = getSlug();
  if (!slug) throw new Error("No active brand");
  const res = await api.put(`/brands/${slug}/members/${memberId}/role`, { role });
  return res.data;
};

/** Update a member's permissions */
export const updateMemberPermissions = async (memberId, permissions) => {
  const slug = getSlug();
  if (!slug) throw new Error("No active brand");
  const res = await api.put(`/brands/${slug}/members/${memberId}/permissions`, { permissions });
  return res.data;
};

/** Get available users that can be added as members */
export const getAvailableUsers = async () => {
  const slug = getSlug();
  if (!slug) throw new Error("No active brand");
  
  try {
    // First try the brand-specific endpoint
    const res = await api.get(`/brands/${slug}/members/available-users`);
    return res.data;
  } catch (err) {
    // Fallback to getting all users and filtering
    const members = await getMembers();
    const memberUserIds = new Set(members.map((m) => String(m.userId)));
    const allUsers = await getAdminUsers();
    const users = Array.isArray(allUsers?.users)
      ? allUsers.users
      : Array.isArray(allUsers?.items)
        ? allUsers.items
        : Array.isArray(allUsers)
          ? allUsers
          : [];

    return users.filter((u) => !memberUserIds.has(String(u.userId ?? u.id)));
  }
};

/** Get available modules */
export const getModules = async () => {
  const slug = getSlug();
  if (!slug) throw new Error("No active brand");
  const res = await api.get(`/brands/${slug}/members/modules`);
  return res.data;
};

/** Role enum values - Industry standard roles like Zoho/Hootsuite */
export const MemberRole = {
  Owner: 0,
  Admin: 1,
  Manager: 2,
  Editor: 3,
  Analyst: 4,
  Contributor: 5,
};

/** Role labels */
export const RoleLabels = {
  0: "Owner",
  1: "Admin",
  2: "Manager",
  3: "Editor",
  4: "Analyst",
  5: "Contributor",
};

/** Role descriptions for UI */
export const RoleDescriptions = {
  0: "Full control over brand, members, and all settings",
  1: "Manage members, accounts, and all content",
  2: "Manage team workflow and approve content",
  3: "Create, edit, and schedule posts",
  4: "View analytics and generate reports",
  5: "Draft content for review",
};

/** Module labels */
export const ModuleLabels = {
  posts: "Posts",
  leads: "Leads",
  analytics: "Analytics",
  inbox: "Inbox",
  social_accounts: "Social Accounts",
  brand_settings: "Brand Settings",
  members: "Members",
};

/** All modules in display order */
export const AllModules = [
  "posts",
  "leads",
  "analytics",
  "inbox",
  "social_accounts",
  "brand_settings",
  "members",
];
