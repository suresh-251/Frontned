import * as XLSX from "xlsx";
import { ALL_COLUMNS, STATUS_META } from "./constants";
import { fmtDate, formatLeadSource, formatStatus, normalizeFollowUpDateTime } from "./utils";

export const VISIBLE_COLUMNS_STORAGE_KEY = "crm_visible_columns";

export const SEARCH_FIELD_OPTIONS = [
  { value: "all", label: "All Details" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
];

export const LEAD_DATA_SOURCE_OPTIONS = [
  { key: "sales", label: "Sales Leads" },
  { key: "social", label: "Social Leads" },
];

export const LEAD_VIEW_OPTIONS = [
  { key: "list", label: "List" },
  { key: "kanban", label: "Kanban" },
];

export function getVisibleColumnsFromStorage() {
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
}

export const isRealDate = (date) => date && !Number.isNaN(date.getTime()) && date.getUTCFullYear() > 1900;

export function formatFilterChipDate(value) {
  if (!value) return "";

  const raw = String(value).trim();
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw.split(" ")[0];
  const parsed = new Date(raw.includes("T") ? raw : `${dateOnly}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return dateOnly || raw;

  const hasTime = raw.includes("T") && !raw.endsWith("T00:00:00") && !raw.endsWith("T00:00");
  return parsed.toLocaleDateString("en-US", hasTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" });
}

export function sameFilterDay(a, b) {
  if (!a || !b) return false;

  const left = String(a).split("T")[0].split(" ")[0];
  const right = String(b).split("T")[0].split(" ")[0];
  return left && left === right;
}

export function normalizeFilterText(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function collectLocationValues(input, bucket = [], seen = new WeakSet()) {
  if (input == null) return bucket;

  if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
    bucket.push(String(input));
    return bucket;
  }

  if (typeof input !== "object" || seen.has(input)) return bucket;
  seen.add(input);

  if (Array.isArray(input)) {
    input.forEach((item) => collectLocationValues(item, bucket, seen));
    return bucket;
  }

  Object.entries(input).forEach(([key, value]) => {
    if (value == null) return;

    if (typeof value === "object") {
      collectLocationValues(value, bucket, seen);
      return;
    }

    if (/(address|street|city|state|country|zip|postal|location|landmark|area)/i.test(key)) {
      bucket.push(String(value));
    }
  });

  return bucket;
}

export function buildLocationText(lead) {
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

  return normalizeFilterText([...explicitParts, ...collectLocationValues(lead)].join(" "));
}

export function getSalesUserLabel(user) {
  return user?.name?.trim() || user?.username || user?.email || `User ${user?.userId || user?.id || ""}`;
}

export function buildTodayFollowUpStats(items = []) {
  const list = Array.isArray(items) ? items : [];
  const countByType = (matcher) => list.filter((item) => matcher(String(item?.type || item?.activityType || item?.activityTypeName || ""))).length;

  return {
    callsToMakeDueToday: countByType((type) => type.toLowerCase().includes("call")),
    emailsToSendDueToday: countByType((type) => type.toLowerCase().includes("email")),
    meetingsToScheduleDueToday: countByType((type) => type.toLowerCase().includes("meeting")),
  };
}

export function countFreshLeadsCreatedToday(items = []) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (Array.isArray(items) ? items : []).filter((lead) => {
    const raw = String(lead?.createdAt || lead?.createdDate || "").trim();
    if (!raw) return false;

    const createdKey = raw.includes("T") ? raw.split("T")[0] : raw.split(" ")[0];
    return createdKey === todayKey;
  }).length;
}

export function countActiveLeadFilters(filters) {
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
}

export function enrichLeadsWithFollowUpBuckets(leads, followUpBuckets) {
  return leads.map((lead) => {
    const followUpInfo = followUpBuckets[lead.id];

    return {
      ...lead,
      followUpBucket: followUpInfo?.bucket || "none",
      followUpBucketDueDate: followUpInfo?.dueDate || "",
    };
  });
}

export function matchesLeadFilters(lead, filters, search, searchField) {
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
}

export function sortLeads(items, sortBy, sortDir) {
  return [...items].sort((a, b) => {
    const leftValue = sortBy === "score" ? a.score : a[sortBy] ?? "";
    const rightValue = sortBy === "score" ? b.score : b[sortBy] ?? "";
    const comparison = typeof leftValue === "number"
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue));

    return sortDir === "desc" ? -comparison : comparison;
  });
}

export function filterSocialLeads(leads, search) {
  const query = normalizeFilterText(search);

  return leads.filter((lead) => {
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
}

export function formatSocialLeadDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function exportLeadsToWorkbook(leads) {
  if (!leads.length) return;

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

  const rows = leads.map((lead) => Object.fromEntries(columns.map(([label, key]) => {
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
  XLSX.writeFile(workbook, `sales-crm-leads-${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function buildLeadFilterChips({ search, activeSearchFieldLabel, filters, onUpdateFilters, onClearSearch, onClearAll }) {
  const chips = [];

  if (search) {
    chips.push({
      key: "search",
      label: `${activeSearchFieldLabel}: "${search}"`,
      onRemove: onClearSearch,
    });
  }

  if (filters.status !== "All") {
    chips.push({
      key: "status",
      label: `Status: ${formatStatus(filters.status)}`,
      dotColor: STATUS_META[filters.status]?.color || "#4f46e5",
      onRemove: () => onUpdateFilters({ status: "All" }),
    });
  }

  if (filters.source !== "All") {
    chips.push({
      key: "source",
      label: `Source: ${formatLeadSource(filters.source)}`,
      onRemove: () => onUpdateFilters({ source: "All" }),
    });
  }

  if (filters.assignee !== "All") {
    chips.push({
      key: "assignee",
      label: `Assignee: ${filters.assignee}`,
      onRemove: () => onUpdateFilters({ assignee: "All" }),
    });
  }

  if (filters.followUp !== "All") {
    chips.push({
      key: "followUp",
      label: `Follow-up bucket: ${filters.followUp}`,
      onRemove: () => onUpdateFilters({ followUp: "All" }),
    });
  }

  if (sameFilterDay(filters.createdDateFrom, filters.createdDateTo)) {
    chips.push({
      key: "createdDate",
      label: `Created Date: ${formatFilterChipDate(filters.createdDateFrom)}`,
      onRemove: () => onUpdateFilters({ createdDateFrom: "", createdDateTo: "" }),
    });
  } else {
    if (filters.createdDateFrom) {
      chips.push({
        key: "createdDateFrom",
        label: `Created from: ${formatFilterChipDate(filters.createdDateFrom)}`,
        onRemove: () => onUpdateFilters({ createdDateFrom: "" }),
      });
    }

    if (filters.createdDateTo) {
      chips.push({
        key: "createdDateTo",
        label: `Created to: ${formatFilterChipDate(filters.createdDateTo)}`,
        onRemove: () => onUpdateFilters({ createdDateTo: "" }),
      });
    }
  }

  if (sameFilterDay(filters.followUpDateFrom, filters.followUpDateTo)) {
    chips.push({
      key: "followUpDate",
      label: `Follow-up: ${formatFilterChipDate(filters.followUpDateFrom)}`,
      onRemove: () => onUpdateFilters({ followUpDateFrom: "", followUpDateTo: "" }),
    });
  } else {
    if (filters.followUpDateFrom) {
      chips.push({
        key: "followUpDateFrom",
        label: `Follow-up from: ${formatFilterChipDate(filters.followUpDateFrom)}`,
        onRemove: () => onUpdateFilters({ followUpDateFrom: "" }),
      });
    }

    if (filters.followUpDateTo) {
      chips.push({
        key: "followUpDateTo",
        label: `Follow-up to: ${formatFilterChipDate(filters.followUpDateTo)}`,
        onRemove: () => onUpdateFilters({ followUpDateTo: "" }),
      });
    }
  }

  ["address", "city", "state", "country", "zip"].forEach((key) => {
    if (!filters[key]) return;

    const labels = {
      address: "Address",
      city: "City",
      state: "State",
      country: "Country",
      zip: "Zip",
    };

    chips.push({
      key,
      label: `${labels[key]}: ${filters[key]}`,
      onRemove: () => onUpdateFilters({ [key]: "" }),
    });
  });

  return {
    chips,
    clearAll: onClearAll,
  };
}

export { normalizeFollowUpDateTime };
