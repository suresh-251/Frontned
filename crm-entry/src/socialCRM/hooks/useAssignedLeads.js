/**
 * useAssignedLeads — Brand-free hook for HR, Sales, and other department users.
 *
 * Calls GET  /api/leads/assigned        — returns leads assigned to the JWT user + optional dept
 * Calls PUT  /api/leads/{id}/assign     — assign a lead to another user (manager action)
 * Calls PUT  /api/leads/{id}/status     — update CRM status (assigned user only)
 * Calls PUT  /api/leads/{id}/remark     — save internal remark (assigned user only)
 *
 * These routes are in BrandScopeMiddleware's _allowedPrefixes, so NO brand is required.
 */
import { useCallback, useRef, useState } from "react";
import {
  getAssignedLeads,
  updateAssignedLeadStatus,
  saveAssignedLeadRemark,
  assignDeptLead,
} from "../api/facebook.leads.api";

export default function useAssignedLeads() {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(false);
  const filtersRef            = useRef({});

  /* ── LOAD ── */
  const loadLeads = useCallback(async (filters = {}, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAssignedLeads(filters);
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("useAssignedLeads: failed to load leads", err);
      setLeads([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  /**
   * reload({ departmentId?, status? })
   * Merges override into current filters and re-fetches.
   * Pass {} to reload with the same filters.
   */
  const reload = useCallback((override = {}, silent = false) => {
    filtersRef.current = { ...filtersRef.current, ...override };
    loadLeads(filtersRef.current, silent);
  }, [loadLeads]);

  /**
   * Assign a lead to a user (manager action — brand-free).
   * Uses PUT /api/leads/{id}/assign
   */
  const assignLead = async (leadId, userId, userName, remark) => {
    await assignDeptLead(leadId, { userId, userName, remark: remark ?? "" });

    // Optimistic update
    setLeads(prev =>
      prev.map(l =>
        l.id === leadId
          ? { ...l, assignedToUserId: userId ?? null, assignedToUserName: userName ?? null }
          : l
      )
    );
  };

  /**
   * Update CRM status for an assigned lead (brand-free).
   * Uses PUT /api/leads/{id}/status
   */
  const changeStatus = async (leadId, newStatus) => {
    await updateAssignedLeadStatus(leadId, newStatus);
    setLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    );
  };

  /**
   * Save an internal remark on an assigned lead (brand-free).
   * Uses PUT /api/leads/{id}/remark
   */
  const saveRemark = async (leadId, remark) => {
    await saveAssignedLeadRemark(leadId, remark);
    setLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, remark } : l)
    );
  };

  return { leads, loading, reload, assignLead, changeStatus, saveRemark };
}
