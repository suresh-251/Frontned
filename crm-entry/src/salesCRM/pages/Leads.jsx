import "../styles/Leads.css";
import "react-datepicker/dist/react-datepicker.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, History } from "lucide-react";
import * as XLSX from "xlsx";
import leadsAPI from "../api/leads.api";
import activitiesAPI from "../api/activities.api";
import { getLeads as getSocialLeads } from "../../socialCRM/api/facebook.leads.api";
import LeadDetailsModal from "../components/LeadDetailsModal.jsx";
import { ALL_COLUMNS, CLEARED_FILTERS, DEFAULT_FILTERS, INITIAL_STATS, STAT_CARDS, STATUS_LIST, STATUS_META } from "./leads/constants";
import {
  AddLeadDropdown,
  AssigneeCell,
  IChevR,
  CreateLeadModal,
  EditModal,
  FilterModal,
  FollowUpCell,
  IChevD,
  IChevU,
  IEdit,
  IFilter,
  IKanban,
  IRows,
  ISearch,
  ISettings,
  IX,
  ImportModal,
  KanbanBoard,
  LeadsPerformanceChart,
  ManageColumnsPanel,
  ScoreBar,
  StatCard,
  StatusCell,
} from "./leads/components";
import { fmtDate, formatLeadSource, formatStatus, getInitials, getLeadAvatarColor, leadToUpdatePayload, normalizeLeads, sanitizeStatus } from "./leads/utils";

const VISIBLE_COLUMNS_STORAGE_KEY = "crm_visible_columns";
const SEARCH_FIELD_OPTIONS = [
  { value: "all", label: "All Details" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
];

const normalizeFollowUpDateTime = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.includes("T")) {
    return raw.length === 16 ? `${raw}:00` : raw;
  }
  return `${raw}T00:00:00`;
};

const isRealDate = (date) => date && !Number.isNaN(date.getTime()) && date.getUTCFullYear() > 1900;

function SortIcon({ sortBy, sortDir, col }) {
  return <span className="sort-ico">{sortBy === col ? (sortDir === "asc" ? <IChevU s={9} /> : <IChevD s={9} />) : <span className="sort-both"><IChevU s={8} /><IChevD s={8} /></span>}</span>;
}

function formatFilterChipDate(value) {
  if (!value) return "";
  const raw = String(value).trim();
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw.split(" ")[0];
  const parsed = new Date(raw.includes("T") ? raw : `${dateOnly}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateOnly || raw;
  const hasTime = raw.includes("T") && !raw.endsWith("T00:00:00") && !raw.endsWith("T00:00");
  return parsed.toLocaleDateString("en-US", hasTime ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" });
}

function sameFilterDay(a, b) {
  if (!a || !b) return false;
  const left = String(a).split("T")[0].split(" ")[0];
  const right = String(b).split("T")[0].split(" ")[0];
  return left && left === right;
}

function normalizeFilterText(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function collectLocationValues(input, bucket = [], seen = new WeakSet()) {
  if (input == null) return bucket;
  if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
    bucket.push(String(input));
    return bucket;
  }
  if (typeof input !== "object") return bucket;
  if (seen.has(input)) return bucket;
  seen.add(input);

  if (Array.isArray(input)) {
    input.forEach((item) => collectLocationValues(item, bucket, seen));
    return bucket;
  }

  Object.entries(input).forEach(([key, value]) => {
    if (!/(address|street|city|state|country|zip|postal|location)/i.test(key)) return;
    if (value == null) return;
    if (typeof value === "object") collectLocationValues(value, bucket, seen);
    else bucket.push(String(value));
  });

  return bucket;
}

function buildLocationText(lead) {
  const explicitParts = [
    lead.address,
    lead.street,
    lead.city,
    lead.state,
    lead.country,
    lead.zipCode,
    lead.zip,
    lead.postalCode,
  ];

  const dynamicParts = collectLocationValues(lead);

  return normalizeFilterText([...explicitParts, ...dynamicParts].join(" "));
}

function getSalesUserLabel(user) {
  return user?.name?.trim() || user?.username || user?.email || `User ${user?.userId || user?.id || ""}`;
}

function buildTodayFollowUpStats(items = []) {
  const list = Array.isArray(items) ? items : [];
  const countByType = (matcher) => list.filter((item) => matcher(String(item?.type || item?.activityType || item?.activityTypeName || ""))).length;
  return {
    callsToMakeDueToday: countByType((type) => type.toLowerCase().includes("call")),
    emailsToSendDueToday: countByType((type) => type.toLowerCase().includes("email")),
    meetingsToScheduleDueToday: countByType((type) => type.toLowerCase().includes("meeting")),
  };
}

function countFreshLeadsCreatedToday(items = []) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return (Array.isArray(items) ? items : []).filter((lead) => {
    const raw = String(lead?.createdAt || lead?.createdDate || "").trim();
    if (!raw) return false;
    const createdKey = raw.includes("T") ? raw.split("T")[0] : raw.split(" ")[0];
    return createdKey === todayKey;
  }).length;
}

function formatSocialLeadDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DeletedLeadsPanel({ leads }) {
  const [open, setOpen] = useState(false);
  if (!leads.length) return null;

  return (
    <div className="table-card-shell sales-leads-history-shell" style={{ marginTop: 18, marginInline: "auto", width: "fit-content", maxWidth: "100%" }}>
      <div className="table-card sales-leads-history-card" style={{ width: "fit-content", maxWidth: "100%" }}>
        <button onClick={() => setOpen((current) => !current)} style={{ width: "fit-content", maxWidth: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "8px", border: "none", background: "transparent", cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 700, color: "#111827" }}><History size={12} />Deleted Leads History</span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 11, fontWeight: 700 }}>{leads.length} deleted<IChevD s={12} style={{ transform: open ? "rotate(180deg)" : "none" }} /></span>
        </button>
        {open && <div className="table-scroll sales-leads-history-scroll" style={{ width: "fit-content", maxWidth: "100%", borderTop: "1px solid #eef2f7" }}><table className="table sales-leads-history-table"><thead><tr className="thead-row"><th className="th">No.</th><th className="th">Name</th><th className="th">Company</th><th className="th">Source</th><th className="th">Status</th><th className="th">Created</th></tr></thead><tbody>{leads.map((lead, index) => <tr key={lead.id} className="row sales-leads-history-row"><td className="td"><span className="cell-txt">{index + 1}</span></td><td className="td"><span className="cell-txt">{lead.name}</span></td><td className="td"><span className="cell-txt">{lead.company}</span></td><td className="td"><span className="cell-txt">{formatLeadSource(lead.source)}</span></td><td className="td"><span className="cell-txt">{formatStatus(lead.status)}</span></td><td className="td"><span className="date-txt">{fmtDate(lead.createdDate)}</span></td></tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}

export default function Leads() {
  const [leadDataSource, setLeadDataSource] = useState("sales");
  const [leads, setLeads] = useState([]);
  const [socialLeads, setSocialLeads] = useState([]);
  const [deletedLeads, setDeletedLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [socialLoading, setSocialLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("createdDate");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const raw = localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const allowed = new Set(ALL_COLUMNS.map((column) => column.key));
      if (Array.isArray(parsed) && parsed.length) {
        const migrated = parsed
          .map((key) => (key === "id" ? "serial" : key === "email" || key === "phone" ? "contact" : key))
          .filter((key, index, array) => array.indexOf(key) === index)
          .filter((key) => allowed.has(key));

        if (!migrated.includes("contact")) {
          const insertionIndex = Math.max(0, migrated.indexOf("company") + 1);
          migrated.splice(insertionIndex, 0, "contact");
        }

        return migrated;
      }
    } catch {
      return ALL_COLUMNS.map((column) => column.key);
    }
    return ALL_COLUMNS.map((column) => column.key);
  });
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [page, setPage] = useState(1);
  const [wrapText, setWrapText] = useState(false);
  const [showColPanel, setShowColPanel] = useState(false);
  const [detailsLead, setDetailsLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [savingLead, setSavingLead] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [createLeadType, setCreateLeadType] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [kanbanGroupBy, setKanbanGroupBy] = useState("status");
  const [showChart, setShowChart] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(STATUS_LIST[0]);
  const [showBulkStatusPicker, setShowBulkStatusPicker] = useState(false);
  const [followUpBuckets, setFollowUpBuckets] = useState({});
  const [todayFollowUpItems, setTodayFollowUpItems] = useState([]);

  const salesUserOptions = useMemo(() => {
    const names = salesUsers.map((user) => getSalesUserLabel(user)).filter(Boolean);
    return Array.from(new Set(names));
  }, [salesUsers]);

  const applyAssigneeNames = useCallback((items, users) => {
    const userMap = new Map((users || []).map((user) => [
      Number(user.id || user.userId || 0),
      getSalesUserLabel(user)
    ]).filter(([id]) => id > 0));

    return items.map((lead) => ({
      ...lead,
      assignee: userMap.get(Number(lead.assignedToUserId || 0)) || lead.assignee || "Unassigned",
    }));
  }, []);

  const mergeLead = useCallback((updatedLead) => {
    const nextLead = updatedLead.status
      ? { ...updatedLead, avatarBg: updatedLead.avatarBg || getLeadAvatarColor(updatedLead.status) }
      : updatedLead;
    setLeads((current) => current.map((lead) => (lead.id === nextLead.id ? { ...lead, ...nextLead } : lead)));
    setDetailsLead((current) => (current && current.id === nextLead.id ? { ...current, ...nextLead } : current));
    setEditLead((current) => (current && current.id === nextLead.id ? { ...current, ...nextLead } : current));
  }, []);

  const fetchLeadDetail = useCallback(async (id) => {
    try {
      const existing = leads.find((lead) => lead.id === id);
      const data = await leadsAPI.getById(id);
      const [normalized] = normalizeLeads([data]);
      const merged = { ...existing, ...normalized };
      setDetailsLead(merged);
      return merged;
    } catch (error) {
      console.error("Failed to load lead details", error);
      return null;
    }
  }, [leads]);

  const fetchLeadForEdit = useCallback(async (id) => {
    try {
      const existing = leads.find((lead) => lead.id === id);
      const data = await leadsAPI.getById(id);
      const [normalized] = normalizeLeads([data]);
      return { ...existing, ...normalized };
    } catch (error) {
      console.error("Failed to load lead for edit", error);
      return null;
    }
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(visibleCols));
  }, [visibleCols]);

  const refreshTodayFollowUpItems = useCallback(async () => {
    try {
      const data = await activitiesAPI.getFollowUpsToday();
      setTodayFollowUpItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to refresh today's follow-up stats", error);
      setTodayFollowUpItems([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let resolvedUsers = [];

    const loadUsers = async () => {
      try {
        const users = await leadsAPI.getSalesUsers();
        if (!active) return [];
        resolvedUsers = users;
        setSalesUsers(users);
        setLeads((current) => applyAssigneeNames(current, users));
        setDeletedLeads((current) => applyAssigneeNames(current, users));
        return users;
      } catch (error) {
        if (active) {
          console.error("Failed to fetch sales users", error);
          setSalesUsers([]);
        }
        return [];
      }
    };

    const loadLeads = async () => {
      setLoading(true);
      try {
        const data = await leadsAPI.getAll();
        if (!active) return;
        const normalized = normalizeLeads(data);
        setLeads(resolvedUsers.length ? applyAssigneeNames(normalized, resolvedUsers) : normalized);
      } catch (error) {
        if (active) {
          console.error("Failed to fetch leads", error);
          setLeads([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadFollowUps = async () => {
      try {
        const [allResult, overdueResult, todayResult] = await Promise.allSettled([
          activitiesAPI.getFollowUps(),
          activitiesAPI.getFollowUpsOverdue(),
          activitiesAPI.getFollowUpsToday(),
        ]);
        if (!active) return;

        const bucketMap = {};
        const rank = { overdue: 4, today: 3, tomorrow: 2, upcoming: 1 };
        const assignBucket = (item, bucket) => {
          const leadId = Number(item?.leadId || 0);
          if (!leadId) return;
          const dueDate = item?.dueDate || "";
          const next = { bucket, dueDate, subject: item?.subject || "", type: item?.type || "" };
          const current = bucketMap[leadId];
          const currentRank = current ? rank[current.bucket] || 0 : 0;
          const nextRank = rank[bucket] || 0;
          if (!current || nextRank > currentRank) {
            bucketMap[leadId] = next;
            return;
          }
          if (nextRank === currentRank && dueDate && (!current?.dueDate || new Date(dueDate) < new Date(current.dueDate))) {
            bucketMap[leadId] = next;
          }
        };

        const allFollowUps = allResult.status === "fulfilled" ? allResult.value : [];
        const overdueFollowUps = overdueResult.status === "fulfilled" ? overdueResult.value : [];
        const todayFollowUps = todayResult.status === "fulfilled" ? todayResult.value : [];
        setTodayFollowUpItems(Array.isArray(todayFollowUps) ? todayFollowUps : []);
        const now = new Date();
        const startOfTomorrow = new Date(now);
        startOfTomorrow.setHours(24, 0, 0, 0);
        const endOfTomorrow = new Date(startOfTomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        allFollowUps.forEach((item) => {
          const dueDate = item?.dueDate ? new Date(item.dueDate) : null;
          const status = String(item?.status || "").toLowerCase();
          const isDone = item?.isCompleted || status === "completed";
          if (!dueDate || Number.isNaN(dueDate.getTime()) || isDone) return;
          if (dueDate >= startOfTomorrow && dueDate <= endOfTomorrow) {
            assignBucket(item, "tomorrow");
            return;
          }
          if (dueDate > endOfTomorrow) assignBucket(item, "upcoming");
        });
        overdueFollowUps.forEach((item) => assignBucket(item, "overdue"));
        todayFollowUps.forEach((item) => assignBucket(item, "today"));

        setFollowUpBuckets(bucketMap);
      } catch (error) {
        if (active) {
          console.error("Failed to fetch follow-up buckets", error);
          setFollowUpBuckets({});
          setTodayFollowUpItems([]);
        }
      }
    };

    loadUsers();
    loadLeads();
    loadFollowUps();
    leadsAPI.getDeleted()
      .then((data) => { if (active) { const normalized = normalizeLeads(data); setDeletedLeads(resolvedUsers.length ? applyAssigneeNames(normalized, resolvedUsers) : normalized); } })
      .catch((error) => { if (active) { console.error("Failed to fetch deleted leads", error); setDeletedLeads([]); } });
    Promise.allSettled([leadsAPI.getDashboard(), activitiesAPI.getFollowUpsToday()])
      .then(([dashboardResult, todayResult]) => {
        if (!active) return;
        const dashboardStats = dashboardResult.status === "fulfilled" ? dashboardResult.value : INITIAL_STATS;
        const todayStats = todayResult.status === "fulfilled" ? (Array.isArray(todayResult.value) ? todayResult.value : []) : [];
        setStats(dashboardStats);
        setTodayFollowUpItems(todayStats);
        if (dashboardResult.status === "rejected") {
          console.error("Failed to fetch dashboard stats", dashboardResult.reason);
        }
        if (todayResult.status === "rejected") {
          console.error("Failed to fetch today's follow-up stats", todayResult.reason);
        }
      })
      .catch((error) => { if (active) { console.error("Failed to fetch lead stats", error); setStats(INITIAL_STATS); } });

    return () => { active = false; };
  }, [applyAssigneeNames]);

  useEffect(() => {
    if (leadDataSource !== "social") return undefined;

    let active = true;

    const loadSocialLeads = async () => {
      setSocialLoading(true);
      try {
        const items = await getSocialLeads();
        if (!active) return;
        setSocialLeads(Array.isArray(items) ? items : []);
      } catch (error) {
        if (active) {
          console.error("Failed to fetch social leads", error);
          setSocialLeads([]);
        }
      } finally {
        if (active) setSocialLoading(false);
      }
    };

    loadSocialLeads();
    return () => { active = false; };
  }, [leadDataSource]);

  useEffect(() => {
    setStats((current) => ({
      ...current,
      totalNewLeadsDueToday: countFreshLeadsCreatedToday(leads),
      ...buildTodayFollowUpStats(todayFollowUpItems),
    }));
  }, [leads, todayFollowUpItems]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "All") count++;
    if (filters.source !== "All") count++;
    if (filters.assignee !== "All") count++;
    if (filters.followUp !== "All") count++;
    if (filters.createdDateFrom || filters.createdDateTo) count++;
    if (filters.followUpDateFrom || filters.followUpDateTo) count++;
    if (filters.lastContactedDays) count++;
    if (filters.respondedTo !== "All") count++;
    if (filters.address) count++;
    if (filters.city) count++;
    if (filters.state) count++;
    if (filters.country) count++;
    if (filters.zip) count++;
    return count;
  }, [filters]);

  const activeCols = useMemo(() => ALL_COLUMNS.filter((column) => column.always || visibleCols.includes(column.key)), [visibleCols]);
  const activeSearchFieldLabel = useMemo(() => SEARCH_FIELD_OPTIONS.find((option) => option.value === searchField)?.label || "All Details", [searchField]);

  const updateLead = useCallback(async (id, field, value) => {
    const existing = leads.find((lead) => lead.id === id);
    if (!existing) return;
    const normalizedValue = field === "status" ? sanitizeStatus(value) : value;
    let nextLead = { ...existing, [field]: normalizedValue };
    if (field === "status") nextLead = { ...nextLead, avatarBg: getLeadAvatarColor(normalizedValue) };
    if (field === "followUpDate") nextLead = { ...nextLead, nextFollowUpAt: normalizeFollowUpDateTime(value) };
    if (field === "assignee") {
      const selectedUser = salesUsers.find((user) => getSalesUserLabel(user) === value);
      nextLead = {
        ...nextLead,
        assignee: value,
        assignedToUserId: Number(selectedUser?.id || selectedUser?.userId || 0),
      };
    }
    mergeLead(nextLead);
    try {
      if (field === "status") {
        await leadsAPI.bulkUpdateStatus([id], normalizedValue);
      }
      else if (field === "followUpDate") await leadsAPI.update(id, { nextFollowUpAt: normalizeFollowUpDateTime(value) });
      else if (field === "source") await leadsAPI.update(id, { ...leadToUpdatePayload(nextLead), source: value });
      else if (field === "assignee") {
        const userId = Number(nextLead.assignedToUserId || 0);
        await leadsAPI.assignLead(id, userId, value, "");
      }
      else await leadsAPI.update(id, { [field]: value });
    } catch (error) {
      console.error("Failed to update lead", error);
      mergeLead(existing);
    }
  }, [leads, mergeLead, salesUsers]);

  const handleSaveLead = async (id, form) => {
    setSavingLead(true);
    try {
      const selectedUser = salesUsers.find((user) => Number(user.id || user.userId) === Number(form.assignedToUserId));
      const updated = await leadsAPI.update(id, form);
      if (Number(form.assignedToUserId) > 0) {
        await leadsAPI.assignLead(id, Number(form.assignedToUserId), selectedUser ? getSalesUserLabel(selectedUser) : "", "");
      }
      const [normalized] = normalizeLeads([updated?.id ? updated : { ...editLead, ...form, id }]);
      mergeLead({ ...normalized, assignedToUserId: Number(form.assignedToUserId || 0), assignee: selectedUser ? getSalesUserLabel(selectedUser) : "Unassigned" });
      setEditLead(null);
    } catch (error) {
      console.error("Failed to update lead", error);
    } finally {
      setSavingLead(false);
    }
  };

  const handleDeleteLead = async (id) => {
    setDeletingLead(true);
    try {
      await leadsAPI.delete(id);
      const removed = leads.find((lead) => lead.id === id);
      if (removed) setDeletedLeads((current) => [{ ...removed, isDeleted: true }, ...current]);
      setLeads((current) => current.filter((lead) => lead.id !== id));
      setDetailsLead((current) => (current?.id === id ? null : current));
      setEditLead((current) => (current?.id === id ? null : current));
    } catch (error) {
      console.error("Failed to delete lead", error);
    } finally {
      setDeletingLead(false);
    }
  };

  const handleExportSelected = () => {
    const selectedLeads = leads.filter((lead) => selected.has(lead.id));
    if (!selectedLeads.length) return;

    const columns = [
      ["Lead ID", "id"],
      ["Lead Name", "name"],
      ["Company", "company"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["Status", "status"],
      ["Follow-Up", "followUpDate"],
      ["Assignee", "assignee"],
      ["Source", "source"],
      ["Score", "score"],
      ["Deposits", "deposits"],
      ["Comments", "comments"],
      ["Created Date", "createdDate"],
    ];

    const rows = selectedLeads.map((lead) => Object.fromEntries(columns.map(([label, key]) => {
      const value = key === "status"
        ? formatStatus(lead[key])
        : key === "source"
          ? formatLeadSource(lead[key])
          : key === "createdDate" || key === "followUpDate"
            ? (lead[key] ? fmtDate(lead[key]) : "")
            : lead[key];
      return [label, value ?? ""];
    })));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `sales-crm-leads-${todayStr()}.xlsx`);
  };

  const enrichedLeads = useMemo(() => leads.map((lead) => {
    const followUpInfo = followUpBuckets[lead.id];
    return {
      ...lead,
      followUpBucket: followUpInfo?.bucket || "none",
      followUpBucketDueDate: followUpInfo?.dueDate || "",
    };
  }), [followUpBuckets, leads]);

  const filtered = useMemo(() => enrichedLeads.filter((lead) => {
    const query = search.trim().toLowerCase();
    const locationText = buildLocationText(lead);
    const cityText = normalizeFilterText(lead.city);
    const stateText = normalizeFilterText(lead.state);
    const countryText = normalizeFilterText(lead.country);
    const zipText = normalizeFilterText(lead.zipCode || lead.zip || lead.postalCode);
    if (query) {
      const targets = {
        all: normalizeFilterText([lead.id, lead.name, lead.email, lead.phone, locationText].join(" ")),
        name: normalizeFilterText(lead.name),
        email: normalizeFilterText(lead.email),
        phone: normalizeFilterText(lead.phone),
        address: locationText,
      };
      if (!targets[searchField]?.includes(normalizeFilterText(query))) return false;
    }
    if (filters.status !== "All" && lead.status !== filters.status) return false;
    if (filters.source !== "All" && lead.source !== filters.source) return false;
    if (filters.assignee !== "All" && lead.assignee !== filters.assignee) return false;
    if (filters.followUp !== "All" && String(lead.followUpBucket || "").toLowerCase() !== String(filters.followUp).toLowerCase()) return false;
    if (filters.createdDateFrom || filters.createdDateTo) {
      const leadCreatedAt = lead.createdAt ? new Date(lead.createdAt) : lead.createdDate ? new Date(`${lead.createdDate}T00:00:00`) : null;
      if (filters.createdDateFrom && leadCreatedAt && leadCreatedAt < new Date(filters.createdDateFrom)) return false;
      if (filters.createdDateTo && leadCreatedAt && leadCreatedAt > new Date(filters.createdDateTo)) return false;
      if ((filters.createdDateFrom || filters.createdDateTo) && !leadCreatedAt) return false;
    }
    if (filters.followUpDateFrom || filters.followUpDateTo) {
      const rawFollowUp = lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt) : lead.followUpDate ? new Date(lead.followUpDate) : null;
      const leadFollowUpAt = isRealDate(rawFollowUp) ? rawFollowUp : null;
      if (filters.followUpDateFrom && leadFollowUpAt && leadFollowUpAt < new Date(filters.followUpDateFrom)) return false;
      if (filters.followUpDateTo && leadFollowUpAt && leadFollowUpAt > new Date(filters.followUpDateTo)) return false;
      if ((filters.followUpDateFrom || filters.followUpDateTo) && !leadFollowUpAt) return false;
    }
    if (filters.address && !locationText.includes(normalizeFilterText(filters.address))) return false;
    if (filters.city && !(cityText || locationText).includes(normalizeFilterText(filters.city))) return false;
    if (filters.state && !(stateText || locationText).includes(normalizeFilterText(filters.state))) return false;
    if (filters.country && !(countryText || locationText).includes(normalizeFilterText(filters.country))) return false;
    if (filters.zip && !(zipText || locationText).includes(normalizeFilterText(filters.zip))) return false;
    return true;
  }).sort((a, b) => {
    const av = sortBy === "score" ? a.score : a[sortBy] ?? "";
    const bv = sortBy === "score" ? b.score : b[sortBy] ?? "";
    const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === "desc" ? -cmp : cmp;
  }), [enrichedLeads, filters, search, searchField, sortBy, sortDir]);

  const filteredSocialLeads = useMemo(() => {
    const query = normalizeFilterText(search);
    return socialLeads.filter((lead) => {
      if (!query) return true;
      const searchable = normalizeFilterText([
        lead.id,
        lead.name,
        lead.email,
        lead.phone,
        lead.platform,
        lead.status,
        lead.assignedToUserName,
        lead.formName,
        lead.pageName,
      ].join(" "));
      return searchable.includes(query);
    });
  }, [search, socialLeads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => setPage(1), [search, searchField, filters, rowsPerPage]);

  const allOnPageSel = paginated.length > 0 && paginated.every((lead) => selected.has(lead.id));
  const toggleAll = () => setSelected((current) => {
    const next = new Set(current);
    if (allOnPageSel) paginated.forEach((lead) => next.delete(lead.id));
    else paginated.forEach((lead) => next.add(lead.id));
    return next;
  });
  const toggleOne = (id) => setSelected((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleClearFilters = useCallback(() => setFilters({ ...CLEARED_FILTERS, followUp: "All" }), []);
  const hasActiveFilters = Boolean(search) || activeFilterCount > 0;
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await leadsAPI.bulkDelete(ids);
      const removed = leads.filter((lead) => selected.has(lead.id)).map((lead) => ({ ...lead, isDeleted: true }));
      setDeletedLeads((current) => [...removed, ...current]);
      setLeads((current) => current.filter((lead) => !selected.has(lead.id)));
      setSelected(new Set());
      setDetailsLead((current) => (current && selected.has(current.id) ? null : current));
      setEditLead((current) => (current && selected.has(current.id) ? null : current));
    } catch (error) {
      console.error("Failed to delete selected leads", error);
    }
  };

  const handleBulkStatusChange = async () => {
    const ids = Array.from(selected);
    if (!ids.length || !bulkStatus) return;
    const previousLeads = leads;
    const previousDetails = detailsLead;
    const previousEdit = editLead;

    const applyStatus = (items) => items.map((lead) => (
      selected.has(lead.id)
        ? {
            ...lead,
            status: bulkStatus,
          }
        : lead
    ));

    setLeads((current) => applyStatus(current));
    setDetailsLead((current) => (current && selected.has(current.id) ? { ...current, status: bulkStatus } : current));
    setEditLead((current) => (current && selected.has(current.id) ? { ...current, status: bulkStatus } : current));

    try {
      await leadsAPI.bulkUpdateStatus(ids, bulkStatus);
      setSelected(new Set());
      setShowBulkStatusPicker(false);
    } catch (error) {
      console.error("Failed to bulk update status", error);
      setLeads(previousLeads);
      setDetailsLead(previousDetails);
      setEditLead(previousEdit);
    }
  };
  const handleAddLeadType = (leadType) => (leadType.key === "import" ? setShowImport(true) : setCreateLeadType(leadType));

  const handleCreateLead = async (newLead) => {
    try {
      const created = await leadsAPI.create(newLead);
      const [normalized] = normalizeLeads([created]);
      setLeads((current) => [normalized, ...current]);
    } catch (error) {
      console.error("Failed to create lead", error);
    }
  };

  const handleImportLeads = async (newLeads) => {
    const createdResults = await Promise.allSettled(newLeads.map((lead) => leadsAPI.create(lead)));
    const successful = createdResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    if (!successful.length) {
      throw new Error("Failed to import leads to database");
    }

    const normalized = normalizeLeads(successful);
    setLeads((current) => [...normalized, ...current]);

    const failedCount = createdResults.length - successful.length;
    if (failedCount > 0) {
      throw new Error(`${failedCount} lead(s) could not be imported.`);
    }
  };

  const handleDealConverted = useCallback(() => {
    if (!detailsLead?.id) return;
    mergeLead({ ...detailsLead, status: "Converted" });
  }, [detailsLead, mergeLead]);

  return (
    <div className="page sales-leads-page">
      {leadDataSource === "sales" && <div className="stat-grid">{STAT_CARDS.map(({ label, key, detailKey, detailLabel, helper, icon, alert, c }, index) => <StatCard key={label} label={label} value={stats[key] ?? 0} detailValue={stats[detailKey] ?? 0} detailLabel={detailLabel} helper={helper} icon={icon} alert={alert} c={c} delay={`${index * 0.07}s`} />)}</div>}

      <div className="toolbar" style={{ gap: 10, marginBottom: 10, justifyContent: "center" }}>
        <div className="toolbar-mid" style={{ gap: 8, rowGap: 8, width: "fit-content", maxWidth: "100%", justifyContent: "center" }}>
          {leadDataSource === "sales" && <>
            <button className={`btn-ghost ${activeFilterCount > 0 ? "btn-ghost--active" : ""}`} onClick={() => setShowFilter(true)} style={{ minHeight: 30, padding: "4px 10px", fontSize: 13 }}><IFilter s={12} />&ensp;Filter{activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}</button>
            <div className="toolbar-divider" style={{ margin: "0 2px", height: 20 }} />
          </>}
          <div className="unified-search" style={{ minHeight: 30, padding: "1px 2px" }}>{leadDataSource === "sales" && <><select className="search-field-select" style={{ minWidth: 100, padding: "0 6px 0 8px", height: 26 }} value={searchField} onChange={(event) => setSearchField(event.target.value)}>{SEARCH_FIELD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><div className="unified-divider" style={{ margin: "0 4px", height: 18 }} /></>}<div className="search-wrap"><span className="search-ico"><ISearch s={14} c="#9ca3af" /></span><input type="text" className="search-inp unified-inp" style={{ width: leadDataSource === "social" ? 260 : 220, padding: "5px 28px 5px 34px", fontSize: 13.5 }} placeholder={leadDataSource === "social" ? "Search social leads..." : `Search by ${activeSearchFieldLabel.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
          {leadDataSource === "sales" && <>
            <div className="toolbar-divider" style={{ margin: "0 2px", height: 20 }} />
            <button className={`icon-btn-outline ${showChart ? "icon-btn-outline--on" : ""}`} onClick={() => setShowChart(!showChart)} style={{ width: 32, height: 32 }}><BarChart3 size={14} /></button>
            <div className="toolbar-divider" style={{ margin: "0 2px", height: 20 }} />
            <button className="btn-ghost" onClick={() => setShowImport(true)} style={{ minHeight: 30, padding: "4px 10px", fontSize: 13 }}>Import</button>
            <div className="toolbar-divider" style={{ margin: "0 2px", height: 20 }} />
            <AddLeadDropdown onSelectType={handleAddLeadType} />
          </>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", height: 30, border: "1.5px solid var(--cborder)", borderRadius: 8, overflow: "hidden", background: "var(--cs)", boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)" }}>
          {[{ key: "sales", label: "Sales Leads" }, { key: "social", label: "Social Leads" }].map((option, index, array) => <button key={option.key} onClick={() => setLeadDataSource(option.key)} style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 112, padding: "0 10px", border: "none", borderRight: index < array.length - 1 ? "1px solid var(--cborder)" : "none", background: leadDataSource === option.key ? "color-mix(in srgb, var(--ci) 12%, var(--cs))" : "#ffffff", color: leadDataSource === option.key ? "var(--ci)" : "var(--ct2)", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap" }}>{option.label}</button>)}
        </div>
        {leadDataSource === "sales" ? <div style={{ display: "flex", height: 30, border: "1.5px solid var(--cborder)", borderRadius: 8, overflow: "hidden", background: "var(--cs)", boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)" }}>{[{ k: "list", l: "List", I: IRows }, { k: "kanban", l: "Kanban", I: IKanban }].map(({ k, l, I }) => <button key={k} onClick={() => setViewMode(k)} style={{ display: "flex", alignItems: "center", gap: 4, height: "100%", padding: "0 10px", border: "none", borderRight: k === "list" ? "1px solid var(--cborder)" : "none", background: viewMode === k ? "color-mix(in srgb, var(--ci) 12%, var(--cs))" : "transparent", color: viewMode === k ? "var(--ci)" : "var(--cm)", fontSize: 13, whiteSpace: "nowrap" }}><I s={12} />{l}</button>)}</div> : null}
      </div>

      {leadDataSource === "sales" && hasActiveFilters && <div className="chips-bar sales-leads-filter-chips">{search && <span className="chip sales-leads-filter-chip">{activeSearchFieldLabel}: &ldquo;{search}&rdquo;<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setSearch("")}><IX s={9} c="#4f46e5" /></button></span>}{filters.status !== "All" && <span className="chip sales-leads-filter-chip"><span className="chip-dot sales-leads-filter-chip-dot" style={{ background: STATUS_META[filters.status]?.color || "#4f46e5" }} />Status: {formatStatus(filters.status)}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, status: "All" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.source !== "All" && <span className="chip sales-leads-filter-chip">Source: {formatLeadSource(filters.source)}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, source: "All" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.assignee !== "All" && <span className="chip sales-leads-filter-chip">Assignee: {filters.assignee}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, assignee: "All" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.followUp !== "All" && <span className="chip sales-leads-filter-chip">Follow-up bucket: {filters.followUp}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, followUp: "All" }))}><IX s={9} c="#4f46e5" /></button></span>}{sameFilterDay(filters.createdDateFrom, filters.createdDateTo) ? <span className="chip sales-leads-filter-chip">Created Date: {formatFilterChipDate(filters.createdDateFrom)}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, createdDateFrom: "", createdDateTo: "" }))}><IX s={9} c="#4f46e5" /></button></span> : <>{filters.createdDateFrom && <span className="chip sales-leads-filter-chip">Created from: {formatFilterChipDate(filters.createdDateFrom)}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, createdDateFrom: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.createdDateTo && <span className="chip sales-leads-filter-chip">Created to: {formatFilterChipDate(filters.createdDateTo)}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, createdDateTo: "" }))}><IX s={9} c="#4f46e5" /></button></span>}</>}{sameFilterDay(filters.followUpDateFrom, filters.followUpDateTo) ? <span className="chip sales-leads-filter-chip">Follow-up: {formatFilterChipDate(filters.followUpDateFrom)}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, followUpDateFrom: "", followUpDateTo: "" }))}><IX s={9} c="#4f46e5" /></button></span> : <>{filters.followUpDateFrom && <span className="chip sales-leads-filter-chip">Follow-up from: {formatFilterChipDate(filters.followUpDateFrom)}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, followUpDateFrom: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.followUpDateTo && <span className="chip sales-leads-filter-chip">Follow-up to: {formatFilterChipDate(filters.followUpDateTo)}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, followUpDateTo: "" }))}><IX s={9} c="#4f46e5" /></button></span>}</>}{filters.address && <span className="chip sales-leads-filter-chip">Address: {filters.address}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, address: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.city && <span className="chip sales-leads-filter-chip">City: {filters.city}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, city: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.state && <span className="chip sales-leads-filter-chip">State: {filters.state}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, state: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.country && <span className="chip sales-leads-filter-chip">Country: {filters.country}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, country: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.zip && <span className="chip sales-leads-filter-chip">Zip: {filters.zip}<button className="chip-x sales-leads-filter-chip-remove" onClick={() => setFilters((current) => ({ ...current, zip: "" }))}><IX s={9} c="#4f46e5" /></button></span>}<button className="chip-clearall sales-leads-filter-clearall" onClick={() => { setSearch(""); handleClearFilters(); }}>Clear all</button></div>}

      {leadDataSource === "sales" && selected.size > 0 && <div className="bulk-bar sales-leads-bulk-bar"><span className="bulk-cnt sales-leads-bulk-count">{selected.size} selected</span>{showBulkStatusPicker ? <><div style={{ display: "inline-flex", alignItems: "stretch", border: "1.5px solid var(--cborder)", borderRadius: 10, overflow: "hidden", background: "var(--cs)" }}><select className="bulk-select sales-leads-bulk-select" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} style={{ border: "none", borderRight: "1.5px solid var(--cborder)", borderRadius: 0, minWidth: 170, background: "transparent" }}>{STATUS_LIST.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select><button className="bulk-btn sales-leads-bulk-button" onClick={handleBulkStatusChange} style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>Apply Status</button></div><button className="bulk-btn sales-leads-bulk-button" onClick={() => setShowBulkStatusPicker(false)}>Cancel</button></> : <button className="bulk-btn sales-leads-bulk-button" onClick={() => setShowBulkStatusPicker(true)}>Change Status</button>}<button className="bulk-btn sales-leads-bulk-button" onClick={handleExportSelected}>Export</button><button className="bulk-btn bulk-btn--danger sales-leads-bulk-button" onClick={handleBulkDelete}>Delete</button><button className="bulk-close sales-leads-bulk-close" onClick={() => { setSelected(new Set()); setShowBulkStatusPicker(false); }}><IX s={12} c="#6b7280" /></button></div>}

      {leadDataSource === "sales" && loading && (
        <div style={{ marginBottom: 16, border: "1px solid #dbe4f0", borderRadius: 16, background: "#ffffff", padding: "12px 14px", color: "#64748b", fontSize: 13, fontWeight: 600 }}>
          Loading leads. Secondary panels like deleted history, dashboard stats, and assignee names may finish a moment after the table.
        </div>
      )}

      {leadDataSource === "social" && socialLoading && (
        <div style={{ marginBottom: 16, border: "1px solid #dbe4f0", borderRadius: 16, background: "#ffffff", padding: "12px 14px", color: "#64748b", fontSize: 13, fontWeight: 600 }}>
          Loading social leads from socialCRM.
        </div>
      )}

      {leadDataSource === "sales" && viewMode === "kanban" && <KanbanBoard leads={filtered} groupBy={kanbanGroupBy} setGroupBy={setKanbanGroupBy} onUpdateLead={updateLead} onOpenDetails={fetchLeadDetail} />}

      {leadDataSource === "sales" && viewMode === "list" && <div className="table-card-shell sales-leads-table-shell"><div className="table-card sales-leads-table-card"><div className="table-scroll sales-leads-table-scroll"><table className={`table sales-leads-table ${wrapText ? "table--wrap" : ""}`}><thead><tr className="thead-row sales-leads-table-head-row"><th className="th th-check"><input type="checkbox" className="cb" checked={allOnPageSel} onChange={toggleAll} /></th>{activeCols.map((col) => <th key={col.key} className={`th sales-leads-table-head-cell th-${col.key}`} onClick={() => { if (sortBy === col.key) setSortDir((current) => current === "asc" ? "desc" : "asc"); else { setSortBy(col.key); setSortDir("asc"); } }}><span className="th-inner">{col.label}<SortIcon sortBy={sortBy} sortDir={sortDir} col={col.key} /></span></th>)}<th className="th th-actions sales-leads-table-head-cell"><button className={`icon-btn-outline ${showColPanel ? "icon-btn-outline--on" : ""}`} onClick={() => setShowColPanel(true)}><ISettings s={13} /></button></th></tr></thead><tbody>{paginated.map((lead, rowIndex) => { const serial = (page - 1) * rowsPerPage + rowIndex + 1; const initials = getInitials(lead.name); const isSel = selected.has(lead.id); return <tr key={lead.id} className={`row sales-leads-table-row ${isSel ? "row--sel" : ""}`}><td className="td td-check"><input type="checkbox" className="cb" checked={isSel} onChange={() => toggleOne(lead.id)} /></td>{activeCols.map((col) => { switch (col.key) { case "serial": return <td key="serial" className="td"><span className="cell-txt">{serial}</span></td>; case "name": return <td key="name" className="td td-name"><div className="name-cell sales-leads-name-cell"><div className="avatar sales-leads-avatar" style={{ background: lead.avatarBg }}>{initials}</div><div className="name-block sales-leads-name-block"><span className="sales-leads-name-link__label sales-leads-name-text">{lead.name}</span><button className="name-link sales-leads-name-link" onClick={() => fetchLeadDetail(lead.id)} title={`Open ${lead.name || "lead"} details`} aria-label={`Open ${lead.name || "lead"} details`}><span className="sales-leads-name-link__meta">View <IChevR s={11} /></span></button></div></div></td>; case "status": return <td key="status" className="td td-status"><StatusCell value={lead.status} onChange={(value) => updateLead(lead.id, "status", value)} /></td>; case "followUp": return <td key="followUp" className="td td-followup"><FollowUpCell value={lead.followUpBucketDueDate || lead.followUpDate} bucket={lead.followUpBucket} leadId={lead.id} onChange={(value) => updateLead(lead.id, "followUpDate", value)} /></td>; case "source": return <td key="source" className="td"><span className="cell-txt">{formatLeadSource(lead.source)}</span></td>; case "score": return <td key="score" className="td td-score"><ScoreBar score={lead.score} /></td>; case "company": return <td key="company" className="td"><span className="cell-txt">{lead.company}</span></td>; case "contact": return <td key="contact" className="td td-contact"><div className="contact-cell sales-leads-contact-cell">{lead.email ? <span className="contact-email">{lead.email}</span> : null}{lead.phone ? <span className="contact-phone">{lead.phone}</span> : null}{!lead.email && !lead.phone ? <span className="cell-txt">-</span> : null}</div></td>; case "assignee": return <td key="assignee" className="td td-assignee"><AssigneeCell value={lead.assignee} options={salesUserOptions} onChange={(value) => updateLead(lead.id, "assignee", value)} /></td>; case "createdDate": return <td key="createdDate" className="td"><span className="date-txt">{fmtDate(lead.createdDate)}</span></td>; default: return <td key={col.key} className={`td ${col.key === "comments" ? "td-wrap-limit td-comments" : ""}`}><span className="cell-txt">{String(lead[col.key] ?? "")}</span></td>; } })}<td className="td td-actions"><div className="row-acts sales-leads-row-actions"><button className="act-btn act-btn--edit sales-deals-action-button" onClick={async () => { const detailedLead = await fetchLeadForEdit(lead.id); setEditLead(detailedLead || lead); }}><IEdit s={12} /></button></div></td></tr>; })}</tbody></table></div></div></div>}

      {leadDataSource === "social" && <div className="table-card-shell sales-leads-table-shell"><div className="table-card sales-leads-table-card"><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px 8px" }}><div><div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Social Leads</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Pulled from socialCRM endpoints and shown separately from sales leads.</div></div><div style={{ fontSize: 12, fontWeight: 700, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 999, padding: "6px 10px" }}>{filteredSocialLeads.length} lead{filteredSocialLeads.length === 1 ? "" : "s"}</div></div><div className="table-scroll sales-leads-table-scroll"><table className="table sales-leads-table"><thead><tr className="thead-row sales-leads-table-head-row"><th className="th">Name</th><th className="th">Platform</th><th className="th">Contact</th><th className="th">Status</th><th className="th">Assigned To</th><th className="th">Form / Page</th><th className="th">Created</th></tr></thead><tbody>{filteredSocialLeads.length ? filteredSocialLeads.map((lead) => <tr key={`social-${lead.id}`} className="row sales-leads-table-row"><td className="td"><div className="name-cell sales-leads-name-cell"><div className="avatar sales-leads-avatar" style={{ background: "#0f766e" }}>{getInitials(lead.name || "SL")}</div><div className="name-block sales-leads-name-block"><span className="sales-leads-name-link__label sales-leads-name-text">{lead.name || "Unnamed lead"}</span><span className="sales-leads-name-link__meta">{lead.email || lead.phone || "Social lead"}</span></div></div></td><td className="td"><span className="cell-txt">{lead.platform || "Facebook"}</span></td><td className="td td-contact"><div className="contact-cell sales-leads-contact-cell">{lead.email ? <span className="contact-email">{lead.email}</span> : null}{lead.phone ? <span className="contact-phone">{lead.phone}</span> : null}{!lead.email && !lead.phone ? <span className="cell-txt">-</span> : null}</div></td><td className="td"><span className="cell-txt">{lead.status || "New"}</span></td><td className="td"><span className="cell-txt">{lead.assignedToUserName || "Unassigned"}</span></td><td className="td"><span className="cell-txt">{lead.formName || lead.formId || lead.pageName || lead.pageId || "-"}</span></td><td className="td"><span className="date-txt">{formatSocialLeadDate(lead.createdAt || lead.metaCreatedAt || lead.createdDate)}</span></td></tr>) : <tr className="row sales-leads-table-row"><td className="td" colSpan={7}><div style={{ padding: "28px 12px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>No social leads found for the current brand or search.</div></td></tr>}</tbody></table></div></div></div>}

      {leadDataSource === "sales" && <DeletedLeadsPanel leads={deletedLeads} />}

      {leadDataSource === "sales" && showColPanel && <ManageColumnsPanel visibleCols={visibleCols} setVisibleCols={setVisibleCols} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} wrapText={wrapText} setWrapText={setWrapText} onClose={() => setShowColPanel(false)} />}
      {leadDataSource === "sales" && detailsLead && <LeadDetailsModal lead={detailsLead} onClose={() => setDetailsLead(null)} onDealConverted={handleDealConverted} onActivitySaved={refreshTodayFollowUpItems} />}
      {leadDataSource === "sales" && editLead && <EditModal lead={editLead} onClose={() => setEditLead(null)} onSave={handleSaveLead} onDelete={handleDeleteLead} salesUsers={salesUsers} saving={savingLead} deleting={deletingLead} />}
      {leadDataSource === "sales" && showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImportLeads} />}
      {leadDataSource === "sales" && showFilter && <FilterModal onClose={() => setShowFilter(false)} filters={filters} activeFilterCount={activeFilterCount} onApply={setFilters} assignees={salesUserOptions} />}
      {leadDataSource === "sales" && createLeadType && <CreateLeadModal leadType={createLeadType} onClose={() => setCreateLeadType(null)} onSave={handleCreateLead} />}
      {leadDataSource === "sales" && showChart && <LeadsPerformanceChart onClose={() => setShowChart(false)} leads={leads} />}
    </div>
  );
}
