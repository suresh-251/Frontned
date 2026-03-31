import { useEffect, useState, useCallback } from "react";
import { useBrand } from "../context/BrandContext";
import { useAuth } from "../../auth/AuthContext";
import { getMembers, MemberRole, getMemberUserId, normalizeMemberRole } from "../api/members.api";

/**
 * Hook that returns the current user's brand membership info and
 * a helper to check whether a given module is accessible.
 *
 * Owner / Admin    → every module is allowed.
 * Assigned member  → only modules where canRead === true in their permissions.
 * NOT a member     → nothing is visible (fail-closed).
 * API error        → fail-open so the app still works during outages.
 */
export default function useMemberRole() {
  const { activeBrand } = useBrand();
  const { user } = useAuth();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const currentUserId = String(
    user?.sub || user?.id || user?.userId || user?.uid || ""
  );

  useEffect(() => {
    if (!activeBrand?.slug || !currentUserId) {
      setMember(null);
      setLoading(false);
      setApiError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setApiError(false);

    getMembers()
      .then((members) => {
        if (cancelled) return;
        const me = (Array.isArray(members) ? members : []).find(
          (m) => getMemberUserId(m) === currentUserId
        );
        setMember(me ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setMember(null);
          setApiError(true); // mark as API error so we fail-open
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeBrand?.slug, currentUserId]);

  const role = normalizeMemberRole(member?.role);
  const isOwner = role === MemberRole.Owner;
  const isOwnerOrAdmin =
    isOwner || role === MemberRole.Admin;

  /**
   * Check if the current user can access a given module key.
   *
   * While loading → show all (no flicker).
   * API error    → show all (fail-open so app isn't broken).
   * Not a member → hide everything (fail-closed).
   * Owner/Admin  → show all.
   * Other roles  → only if canRead is true for that module.
   */
  const canAccess = useCallback(
    (moduleKey) => {
      // Still loading — don't flash-hide items
      if (loading) return true;

      // API failed — fail-open so the app stays usable
      if (apiError) return true;

      // User is not assigned as a member → hide all module-gated items
      if (!member) return false;

      // Owner or Admin → full access
      if (isOwnerOrAdmin) return true;

      // Check individual permission
      const perms = Array.isArray(member.permissions) ? member.permissions : [];
      const modulePerm = perms.find((p) => p?.module === moduleKey);
      return !!modulePerm?.canRead;
    },
    [loading, apiError, member, isOwnerOrAdmin]
  );

  return {
    member,
    loading,
    isOwner,
    isOwnerOrAdmin,
    canAccess,
    isMember: !!member,
  };
}
