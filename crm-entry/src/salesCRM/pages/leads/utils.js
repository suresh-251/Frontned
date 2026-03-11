import { AVATAR_COLORS, CSV_FIELD_MAP } from "./constants";

export const makeInitialActivity = (leads) => {
  const map = {};
  leads.forEach((lead) => {
    const acts = [{ id: Date.now() + lead.id, type: "created", date: lead.createdDate, time: "09:00 AM", notes: "Lead created" }];
    if (lead.lastContacted) {
      const type = lead.respondedTo || "call";
      acts.unshift({
        id: Date.now() + lead.id + 1,
        type,
        date: lead.lastContacted,
        time: "10:30 AM",
        notes: `${type.charAt(0).toUpperCase() + type.slice(1)} made`,
      });
    }
    map[lead.id] = acts;
  });
  return map;
};

export const fmtDate = (dateString) => {
  if (!dateString) return "—";
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

export function formatStatus(status) {
  return status.replace(/([A-Z])/g, " $1").trim();
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
      if (character === '"') {
        inQuotes = !inQuotes;
      } else if (character === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += character;
      }
    }

    cols.push(current.trim());
    return headers.reduce((obj, header, index) => ({ ...obj, [header]: cols[index] || "" }), {});
  });

  return { headers, rows };
}

export function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function getScoreTier(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export function createLeadRecord(lead, index = 0) {
  return {
    id: lead.id,
    name: lead.firstName || "Unknown Lead",
    email: lead.email || "",
    phone: lead.phone || "",
    company: lead.company || "",
    status: lead.status || "New",
    source: lead.source || "Inbound",
    score: lead.score ?? 50,
    deposits: lead.deposits ?? 0,
    whatsappEnabled: !!lead.whatsappEnabled,
    comments: lead.comments || "",
    assignee: "Unassigned",
    avatarBg: AVATAR_COLORS[index % AVATAR_COLORS.length],
    createdDate: lead.createdAt ? lead.createdAt.split("T")[0] : todayStr(),
    followUpDate: lead.nextFollowUpAt ? lead.nextFollowUpAt.split("T")[0] : "",
    lastContacted: lead.lastContactedAt ? lead.lastContactedAt.split("T")[0] : "",
    respondedTo: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  };
}

export function normalizeLeads(apiLeads = []) {
  return apiLeads.map((lead, index) => createLeadRecord(lead, index));
}
