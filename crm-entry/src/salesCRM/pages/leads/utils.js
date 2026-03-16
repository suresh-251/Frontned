import { AVATAR_COLORS, CSV_FIELD_MAP, LEAD_SOURCE_OPTIONS, STATUS_LIST } from "./constants";

export const fmtDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const todayStr = () => new Date().toISOString().split("T")[0];

export const offsetDay = (days) => new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

export function getFollowUpLabel(dateStr) {
  if (!dateStr) return null;
  const today = todayStr();
  const tomorrow = offsetDay(1);
  if (dateStr < today) return { label: fmtDate(dateStr), type: "overdue" };
  if (dateStr === today) return { label: "Today", type: "today" };
  if (dateStr === tomorrow) return { label: "Tomorrow", type: "tomorrow" };
  return { label: fmtDate(dateStr), type: "normal" };
}

export function formatStatus(status = "") {
  return String(status).replace(/([A-Z])/g, " $1").replace(/\s+/g, " ").trim();
}

export function formatLeadSource(source = "") {
  return String(source).replace(/([A-Z0-9]+)/g, " $1").replace(/\s+/g, " ").trim();
}

export function guessField(header) {
  const normalizedHeader = header.toLowerCase().trim();
  for (const [field, patterns] of Object.entries(CSV_FIELD_MAP)) {
    if (patterns.some((pattern) => normalizedHeader.includes(pattern))) return field;
  }
  return "";
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((header) => header.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const cols = [];
    let current = "";
    let inQuotes = false;
    for (const character of line) {
      if (character === '"') inQuotes = !inQuotes;
      else if (character === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else current += character;
    }
    cols.push(current.trim());
    return headers.reduce((obj, header, index) => ({ ...obj, [header]: cols[index] || "" }), {});
  });
  return { headers, rows };
}

export function getInitials(name = "") {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

export function getScoreTier(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export function splitFullName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeEnumValue(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function sanitizeStatus(status) {
  if (!status) return "FreshLead";
  const matched = STATUS_LIST.find((item) => normalizeEnumValue(item) === normalizeEnumValue(status));
  return matched || "FreshLead";
}

export function sanitizeLeadSource(source) {
  if (!source) return "CustomizedInput";
  const matched = LEAD_SOURCE_OPTIONS.find((item) => normalizeEnumValue(item) === normalizeEnumValue(source));
  return matched || "CustomizedInput";
}

export function leadToUpdatePayload(lead = {}) {
  const splitName = splitFullName(lead.name || `${lead.firstName || ""} ${lead.lastName || ""}`.trim());
  return {
    firstName: lead.firstName ?? splitName.firstName,
    lastName: lead.lastName ?? splitName.lastName,
    title: lead.title || "",
    email: lead.email || "",
    secondaryEmail: lead.secondaryEmail || "",
    phone: lead.phone || "",
    mobile: lead.mobile || "",
    company: lead.company || "",
    position: lead.position || "",
    industry: lead.industry || "",
    source: lead.source || "",
    campaignName: lead.campaignName || "",
    campaignSource: lead.campaignSource || "",
    campaignMedium: lead.campaignMedium || "",
    tags: lead.tags || "",
    rating: lead.rating || "",
    address: lead.address || "",
    city: lead.city || "",
    state: lead.state || "",
    country: lead.country || "",
    zipCode: lead.zipCode || lead.zip || "",
    comments: lead.comments || "",
    description: lead.description || "",
    whatsappEnabled: !!lead.whatsappEnabled,
    assignedToUserId: Number(lead.assignedToUserId || 0),
    nextFollowUpAt: lead.nextFollowUpAt || (lead.followUpDate ? `${lead.followUpDate}T00:00:00.000Z` : null),
  };
}

export function createLeadRecord(lead, index = 0) {
  const addressParts = [lead.address, lead.street, lead.city, lead.state, lead.postalCode ?? lead.zipCode ?? lead.zip, lead.country].filter(Boolean);
  const firstName = lead.firstName || "";
  const lastName = lead.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || lead.name || "Unknown Lead";
  return {
    ...lead,
    id: lead.id,
    name: fullName,
    firstName,
    lastName,
    email: lead.email || "",
    secondaryEmail: lead.secondaryEmail || "",
    phone: lead.phone || "",
    mobile: lead.mobile || "",
    company: lead.company || "",
    title: lead.title || "",
    position: lead.position || "",
    industry: lead.industry || "",
    status: sanitizeStatus(lead.status),
    source: sanitizeLeadSource(lead.source),
    score: lead.score ?? 50,
    deposits: lead.deposits ?? 0,
    whatsappEnabled: !!lead.whatsappEnabled,
    comments: lead.comments || "",
    description: lead.description || "",
    campaignName: lead.campaignName || "",
    campaignSource: lead.campaignSource || "",
    campaignMedium: lead.campaignMedium || "",
    tags: lead.tags || "",
    rating: lead.rating || "",
    assignee: lead.assignedToUserName || lead.assigneeName || (lead.assignedToUserId ? `User ${lead.assignedToUserId}` : "Unassigned"),
    assignedToUserId: lead.assignedToUserId ?? 0,
    avatarBg: AVATAR_COLORS[index % AVATAR_COLORS.length],
    createdDate: lead.createdAt ? lead.createdAt.split("T")[0] : todayStr(),
    createdAt: lead.createdAt || null,
    followUpDate: lead.nextFollowUpAt ? lead.nextFollowUpAt.split("T")[0] : "",
    nextFollowUpAt: lead.nextFollowUpAt || null,
    lastContacted: lead.lastContactedAt ? lead.lastContactedAt.split("T")[0] : "",
    respondedTo: "",
    address: lead.address || lead.street || addressParts.join(", "),
    city: lead.city || "",
    state: lead.state || "",
    zip: lead.postalCode || lead.zipCode || lead.zip || "",
    zipCode: lead.postalCode || lead.zipCode || lead.zip || "",
    country: lead.country || "",
  };
}

export function normalizeLeads(apiLeads = []) {
  const items = Array.isArray(apiLeads)
    ? apiLeads
    : Array.isArray(apiLeads?.leads)
      ? apiLeads.leads
      : Array.isArray(apiLeads?.items)
        ? apiLeads.items
        : Array.isArray(apiLeads?.data)
          ? apiLeads.data
          : [];
  return items.map((lead, index) => createLeadRecord(lead, index));
}
