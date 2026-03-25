export const ACTIVITY_TAB_DEFS = [
  { id: "tasks", label: "Tasks" },
  { id: "calls", label: "Calls" },
  { id: "meetings", label: "Meetings" },
  { id: "emails", label: "Emails" },
];

export const ACTIVITY_BUCKET_DEFS = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "upcoming", label: "Upcoming" },
  { id: "closed", label: "Closed" },
];

export const INITIAL_ACTIVITY_BUCKETS = {
  overdue: [],
  today: [],
  tomorrow: [],
  upcoming: [],
  closed: [],
};

export const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const getRawActivityType = (item) =>
  String(item?.type || item?.activityType || item?.activityTypeName || item?.eventType || "").toLowerCase();

export const isCompletedActivity = (item) => {
  const status = String(item?.status || item?.callStatus || "").toLowerCase();
  return status.includes("complete") || status.includes("cancel") || status.includes("closed") || status.includes("done");
};

export const matchesActivityTab = (item, tabId) => {
  const raw = getRawActivityType(item);
  if (tabId === "tasks") return raw.includes("task");
  if (tabId === "calls") return raw.includes("call");
  if (tabId === "meetings") return raw.includes("meeting");
  if (tabId === "emails") return raw.includes("email");
  return false;
};

export const getLeadDisplayName = (lead) => {
  const directName = String(lead?.name || "").trim();
  if (directName) return directName;

  const firstName = String(lead?.firstName || "").trim();
  const lastName = String(lead?.lastName || "").trim();
  return `${firstName} ${lastName}`.trim();
};

export const buildLeadNamesById = (leads) =>
  (Array.isArray(leads) ? leads : []).reduce((acc, lead) => {
    const leadId = lead?.id;
    const name = getLeadDisplayName(lead);
    if (leadId != null && name) {
      acc[leadId] = name;
      acc[String(leadId)] = name;
    }
    return acc;
  }, {});

export const normalizeActivityRecord = (item, bucket, leadNamesById = {}) => ({
  id:
    item?.id ||
    `${bucket}-${item?.subject || item?.title || item?.type || "activity"}-${
      item?.dueDate || item?.activityDate || item?.callStartTime || item?.createdAt || ""
    }`,
  bucket,
  leadId: item?.leadId ?? item?.leadID ?? item?.lead?.id ?? null,
  type: item?.type || item?.activityType || item?.activityTypeName || item?.eventType || "Activity",
  title: item?.subject || item?.title || item?.name || item?.type || "Activity",
  dueDate: item?.dueDate || item?.date || item?.activityDate || item?.callStartTime || item?.startTime || item?.createdAt || "",
  status: item?.status || item?.callStatus || "",
  leadName:
    item?.leadName ||
    item?.lead?.name ||
    getLeadDisplayName(item?.lead) ||
    item?.leadFullName ||
    item?.leadDisplayName ||
    item?.contactName ||
    item?.prospectName ||
    leadNamesById[item?.leadId] ||
    leadNamesById[item?.leadID] ||
    leadNamesById[item?.lead?.id] ||
    "",
  description: item?.description || item?.body || item?.message || "",
});

export const mapBucketItems = (result, bucket, leadNamesById, { excludeCompleted = false } = {}) =>
  result.status === "fulfilled"
    ? (result.value || [])
        .filter((item) => (excludeCompleted ? !isCompletedActivity(item) : true))
        .map((item) => normalizeActivityRecord(item, bucket, leadNamesById))
    : [];
