// import { useEffect, useState, useRef } from "react";
// import {
//   getLeads,
//   updateLeadStatus,
//   assignLead as assignLeadApi
// } from "../api/facebook.leads.api";

// export default function useFacebookLeads() {
//   const [leads, setLeads] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [filters, setFilters] = useState({
//     pageId: "",
//     formId: "",
//     status: ""
//   });

//   const filtersRef = useRef(filters);
//   const lastCountRef = useRef(0);

//   useEffect(() => {
//     filtersRef.current = filters;
//   }, [filters]);

//   const loadLeads = async (override = {}, silent = false) => {
//     if (!silent) setLoading(true);

//     const finalFilters = {
//       ...filtersRef.current,
//       ...override
//     };

//     const data = await getLeads(finalFilters);

//     if (data.length !== lastCountRef.current) {
//       lastCountRef.current = data.length;
//       setLeads(data);
//     }

//     if (!silent) setLoading(false);
//   };

//   // AUTO REFRESH
//   useEffect(() => {
//     loadLeads({}, true);

//     const interval = setInterval(() => {
//       loadLeads({}, true);
//     }, 5000);

//     return () => clearInterval(interval);
//   }, []);

// const reload = (override = {}) => {
//   const newFilters = {
//     ...filtersRef.current,
//     ...override
//   };

//   setFilters(newFilters);

//   // 🔥 always reload leads, even if pageId is empty
//   loadLeads(newFilters);
// };


//   const changeStatus = async (leadId, newStatus) => {
//     await updateLeadStatus(leadId, newStatus);
//     await loadLeads();
//   };

// const assignLead = async (leadId, userId, userName, remark) => {
//   await assignLeadApi(leadId, {
//     userId: userId ?? null,
//     userName: userName ?? null,
//     remark: remark ?? ""
//   });

//   await loadLeads({}, true);
// };



//   return {
//     leads,
//     loading,
//     filters,
//     setFilters,
//     reload,
//     changeStatus,
//     assignLead
//   };
// }


import { useEffect, useState, useRef, useCallback } from "react";
import { useBrand } from "../context/BrandContext";
import { appCache } from "../utils/cache";
import {
  getLeads,
  updateLeadStatus,
  assignLead as assignLeadApi,
  assignLeadsByFormToDepartment as assignByFormApi,
  assignLeadsByFormToDepartments as assignByFormMultiApi,
  removeDepartmentFromForm as removeDeptFromFormApi,
  getLeadDepartments as getLeadDepartmentsApi,
  assignLeadDepartments as assignLeadDepartmentsApi,
  removeLeadDepartment as removeLeadDepartmentApi,
  getLeadUsers as getLeadUsersApi,
  assignLeadUsers as assignLeadUsersApi,
  removeLeadUser as removeLeadUserApi,
  countFormLeads as countFormLeadsApi,
} from "../api/facebook.leads.api";
 
const EMPTY_FILTERS = { pageId: "", formId: "", status: "", departmentId: "" };
const leadsCacheKey = (slug) => `ph_leads_${slug}`;

export default function useFacebookLeads() {
  const { activeBrand } = useBrand();
  const slug = activeBrand?.slug ?? null;

  // Initialize synchronously from cache so first render already has data
  const initCache = slug ? appCache.getStale(leadsCacheKey(slug)) : null;
  const [leads, setLeads] = useState(() => initCache?.data ?? []);
  // Show loading skeleton on first render when there's no cached data
  const [loading, setLoading] = useState(!initCache && !!slug);
  // Tracks which brand slug the currently displayed leads belong to
  const [dataSlug, setDataSlug] = useState(slug);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const filtersRef = useRef(EMPTY_FILTERS);
  const leadsRef   = useRef(leads);
  const slugRef    = useRef(slug);

  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { leadsRef.current   = leads;   }, [leads]);
  useEffect(() => { slugRef.current    = slug;    }, [slug]);

  /* =========================
     CORE LOAD FUNCTION
     ========================= */
  const loadLeads = useCallback(async (override = {}, silent = false) => {
    // Capture slug at request start — discard response if brand changes mid-flight
    const requestSlug = slugRef.current;
    if (!requestSlug) return;
    if (!silent) setLoading(true);

    try {
      const finalFilters = { ...filtersRef.current, ...override };
      const data = await getLeads(finalFilters);

      if (slugRef.current !== requestSlug) return; // brand changed while in flight

      // Fast shallow comparison: skip re-render if data hasn't meaningfully changed
      const prev = leadsRef.current;
      const changed =
        data.length !== prev.length ||
        data.some((d, i) => d.id !== prev[i]?.id || d.status !== prev[i]?.status || d.remark !== prev[i]?.remark);
      if (changed) {
        setLeads(data);
        appCache.set(leadsCacheKey(requestSlug), data);
      }
    } catch (err) {
      if (slugRef.current === requestSlug) console.error("Failed to load leads:", err);
    } finally {
      if (!silent && slugRef.current === requestSlug) setLoading(false);
    }
  }, []);

  /* =========================
     BRAND-SWITCH / INITIAL LOAD
     ========================= */
  const prevSlugRef = useRef(slug);
  useEffect(() => {
    const isSwitch = prevSlugRef.current !== slug;
    prevSlugRef.current = slug;

    if (!slug) return;

    const cached = appCache.getStale(leadsCacheKey(slug));

    if (isSwitch) {
      setFilters(EMPTY_FILTERS);
      filtersRef.current = EMPTY_FILTERS;
      setLeads(cached?.data ?? []);
    } else if (cached) {
      setLeads(cached.data ?? []);
    }
    setDataSlug(slug);

    // Show loading skeleton when no cached data
    if (!cached) setLoading(true);

    // Always fetch fresh data; show cached data silently while it loads
    loadLeads({}, !!cached);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
 
  /* =========================
     RELOAD (USED BY SIGNALR)
     ========================= */
  const reload = (override = {}, silent = false) => {
    const newFilters = {
      ...filtersRef.current,
      ...override
    };
 
    setFilters(newFilters);
 
    loadLeads(newFilters, silent);
  };
 
  /* =========================
     UPDATE STATUS
     ========================= */
  const changeStatus = async (leadId, newStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
 
      // 🔥 Optimistic update (no full reload needed)
      setLeads(prev =>
        prev.map(l =>
          l.id === leadId ? { ...l, status: newStatus } : l
        )
      );
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };
 
  /* =========================
     ASSIGN LEAD
     ========================= */
  const assignLead = async (leadId, userId, userName, remark) => {
    try {
      await assignLeadApi(leadId, {
        userId: userId ?? null,
        userName: userName ?? null,
        remark: remark ?? ""
      });
 
      // 🔥 Optimistic update
      setLeads(prev =>
        prev.map(l =>
          l.id === leadId
            ? {
                ...l,
                assignedToUserId: userId ?? null,
                assignedToUserName: userName ?? null,
                remark: remark ?? ""
              }
            : l
        )
      );
    } catch (err) {
      console.error("Assign failed:", err);
    }
  };
 
  /* =========================
     ASSIGN LEADS BY FORM TO DEPARTMENT (legacy)
     ========================= */
  const assignByFormToDepartment = async (formId, departmentId, departmentName) => {
    try {
      await assignByFormApi(formId, departmentId, departmentName);
      await loadLeads({}, true);
    } catch (err) {
      console.error("Assign by form to department failed:", err);
      throw err;
    }
  };

  /* =========================
     ASSIGN LEADS BY FORM TO MULTIPLE DEPARTMENTS (with optional time range)
     ========================= */
  const assignByFormToDepartments = async (formId, departments, startDate = null, endDate = null) => {
    try {
      const result = await assignByFormMultiApi(formId, departments, startDate, endDate);
      await loadLeads({}, true);
      return result; // { message, added }
    } catch (err) {
      console.error("Assign by form to departments failed:", err);
      throw err;
    }
  };

  const countFormLeads = async (formId, startDate = null, endDate = null) => {
    try {
      return await countFormLeadsApi(formId, startDate, endDate);
    } catch {
      return null;
    }
  };

  /* =========================
     REMOVE DEPARTMENT FROM ALL LEADS IN A FORM
     ========================= */
  const removeDepartmentFromForm = async (formId, departmentId) => {
    try {
      await removeDeptFromFormApi(formId, departmentId);
      await loadLeads({}, true);
    } catch (err) {
      console.error("Remove department from form failed:", err);
      throw err;
    }
  };

  /* =========================
     PER-LEAD DEPARTMENT CRUD
     ========================= */
  const getLeadDepartments = async (leadId) => {
    return await getLeadDepartmentsApi(leadId);
  };

  const assignLeadDepartments = async (leadId, departments) => {
    await assignLeadDepartmentsApi(leadId, departments);
    await loadLeads({}, true);
  };

  const removeLeadDepartment = async (leadId, departmentId) => {
    await removeLeadDepartmentApi(leadId, departmentId);
    await loadLeads({}, true);
  };

  /* =========================
     PER-LEAD USER CRUD
     ========================= */
  const getLeadUsers = async (leadId) => {
    return await getLeadUsersApi(leadId);
  };

  const assignLeadUsers = async (leadId, users) => {
    await assignLeadUsersApi(leadId, users);
    await loadLeads({}, true);
  };

  const removeLeadUser = async (leadId, userId) => {
    await removeLeadUserApi(leadId, userId);
    await loadLeads({}, true);
  };

  return {
    leads,
    loading,
    dataSlug,
    filters,
    setFilters,
    reload,
    changeStatus,
    assignLead,
    // form → department(s)
    assignByFormToDepartment,
    assignByFormToDepartments,
    removeDepartmentFromForm,
    countFormLeads,
    // per-lead departments
    getLeadDepartments,
    assignLeadDepartments,
    removeLeadDepartment,
    // per-lead users
    getLeadUsers,
    assignLeadUsers,
    removeLeadUser,
  };
}
 