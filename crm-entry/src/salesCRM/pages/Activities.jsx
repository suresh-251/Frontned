import "../styles/Leads.css";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import activitiesAPI from "../api/activities.api";
import leadsAPI from "../api/leads.api";
import { formatStatus, getFollowUpLabel } from "./leads/utils";

const ACTIVITY_TABS = [
  { id: "tasks", label: "Tasks" },
  { id: "calls", label: "Calls" },
  { id: "meetings", label: "Meetings" },
  { id: "emails", label: "Emails" },
];

const ACTIVITY_BUCKETS = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "upcoming", label: "Upcoming" },
  { id: "closed", label: "Closed" },
];

const INITIAL_BUCKETS = {
  overdue: [],
  today: [],
  tomorrow: [],
  upcoming: [],
  closed: [],
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getRawActivityType = (item) => String(item?.type || item?.activityType || item?.activityTypeName || item?.eventType || "").toLowerCase();
const isCompletedActivity = (item) => {
  const status = String(item?.status || item?.callStatus || "").toLowerCase();
  return status.includes("complete") || status.includes("cancel") || status.includes("closed") || status.includes("done");
};
const getLeadDisplayName = (lead) => {
  const directName = String(lead?.name || "").trim();
  if (directName) return directName;

  const firstName = String(lead?.firstName || "").trim();
  const lastName = String(lead?.lastName || "").trim();
  return `${firstName} ${lastName}`.trim();
};

const normalizeActivity = (item, bucket, leadNamesById = {}) => ({
  id: item?.id || `${bucket}-${item?.subject || item?.title || item?.type || "activity"}-${item?.dueDate || item?.activityDate || item?.callStartTime || item?.createdAt || ""}`,
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

const buildLeadNamesById = (leads) =>
  (Array.isArray(leads) ? leads : []).reduce((acc, lead) => {
    const leadId = lead?.id;
    const name = getLeadDisplayName(lead);
    if (leadId != null && name) {
      acc[leadId] = name;
      acc[String(leadId)] = name;
    }
    return acc;
  }, {});

const buildLeadOptions = (leads) => {
  const seenNames = new Set();

  return (Array.isArray(leads) ? leads : [])
    .map((lead) => ({ id: String(lead?.id ?? ""), name: getLeadDisplayName(lead) }))
    .filter((lead) => {
      const normalizedName = lead.name.trim().toLowerCase();
      if (!lead.id || !normalizedName || seenNames.has(normalizedName)) return false;
      seenNames.add(normalizedName);
      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
};

const mapBucketItems = (result, bucket, leadNamesById, { excludeCompleted = false } = {}) =>
  result.status === "fulfilled"
    ? (result.value || [])
        .filter((item) => (excludeCompleted ? !isCompletedActivity(item) : true))
        .map((item) => normalizeActivity(item, bucket, leadNamesById))
    : [];

const hasDisplayDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const matchesTab = (item, tabId) => {
  const raw = getRawActivityType(item);
  if (tabId === "tasks") return raw.includes("task");
  if (tabId === "calls") return raw.includes("call");
  if (tabId === "meetings") return raw.includes("meeting");
  if (tabId === "emails") return raw.includes("email");
  return false;
};

export default function Activities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedLeadId = searchParams.get("leadId");
  const initialTab = ACTIVITY_TABS.some((tab) => tab.id === requestedTab) ? requestedTab : "tasks";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedLeadId, setSelectedLeadId] = useState(requestedLeadId || "all");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [bucketedItems, setBucketedItems] = useState(INITIAL_BUCKETS);
  const [leadOptions, setLeadOptions] = useState([]);
  const [tabLeadOptions, setTabLeadOptions] = useState({
    tasks: [],
    calls: [],
    meetings: [],
    emails: [],
  });

  useEffect(() => {
    if (requestedTab && ACTIVITY_TABS.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    setSelectedLeadId(requestedLeadId || "all");
  }, [requestedLeadId]);

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("tab", activeTab);
      if (selectedLeadId && selectedLeadId !== "all") {
        next.set("leadId", selectedLeadId);
      } else {
        next.delete("leadId");
      }
      return next;
    }, { replace: true });
  }, [activeTab, selectedLeadId, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(now);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const leadId = selectedLeadId !== "all" ? Number(selectedLeadId) : undefined;

        const [overdueResult, todayResult, tomorrowResult, upcomingResult, closedResult, leadsResult] = await Promise.allSettled([
          activitiesAPI.getFollowUpsOverdue(leadId ? { leadId } : undefined),
          activitiesAPI.getFollowUpsToday(leadId ? { leadId } : undefined),
          activitiesAPI.getFollowUps({ ...(leadId ? { leadId } : {}), fromDate: startOfDay(tomorrow).toISOString(), toDate: endOfDay(tomorrow).toISOString() }),
          activitiesAPI.getFollowUps({ ...(leadId ? { leadId } : {}), fromDate: startOfDay(dayAfterTomorrow).toISOString() }),
          activitiesAPI.getClosed(leadId ? { leadId } : undefined),
          leadsAPI.getAll(),
        ]);

        if (cancelled) return;

        const allLeads = leadsResult.status === "fulfilled" ? (Array.isArray(leadsResult.value) ? leadsResult.value : []) : [];
        const leadNamesById = buildLeadNamesById(allLeads);
        setLeadOptions(buildLeadOptions(allLeads));

        if (!leadId) {
          const allBucketedItems = {
            overdue: mapBucketItems(overdueResult, "overdue", leadNamesById, { excludeCompleted: true }),
            today: mapBucketItems(todayResult, "today", leadNamesById, { excludeCompleted: true }),
            tomorrow: mapBucketItems(tomorrowResult, "tomorrow", leadNamesById, { excludeCompleted: true }),
            upcoming: mapBucketItems(upcomingResult, "upcoming", leadNamesById, { excludeCompleted: true }),
            closed: mapBucketItems(closedResult, "closed", leadNamesById),
          };

          const buildOptionsForTab = (tabId) => {
            const seenNames = new Set();
            const options = [];

            Object.values(allBucketedItems)
              .flat()
              .filter((item) => matchesTab(item, tabId))
              .forEach((item) => {
                const name = String(item?.leadName || "").trim();
                const id = item?.leadId;
                const normalizedName = name.toLowerCase();

                if (!name || id == null || seenNames.has(normalizedName)) return;

                seenNames.add(normalizedName);
                options.push({ id: String(id), name });
              });

            return options.sort((left, right) => left.name.localeCompare(right.name));
          };

          setTabLeadOptions({
            tasks: buildOptionsForTab("tasks"),
            calls: buildOptionsForTab("calls"),
            meetings: buildOptionsForTab("meetings"),
            emails: buildOptionsForTab("emails"),
          });
        }

        setBucketedItems({
          overdue: mapBucketItems(overdueResult, "overdue", leadNamesById, { excludeCompleted: true }),
          today: mapBucketItems(todayResult, "today", leadNamesById, { excludeCompleted: true }),
          tomorrow: mapBucketItems(tomorrowResult, "tomorrow", leadNamesById, { excludeCompleted: true }),
          upcoming: mapBucketItems(upcomingResult, "upcoming", leadNamesById, { excludeCompleted: true }),
          closed: mapBucketItems(closedResult, "closed", leadNamesById),
        });

        if (
          overdueResult.status === "rejected" &&
          todayResult.status === "rejected" &&
          tomorrowResult.status === "rejected" &&
          upcomingResult.status === "rejected" &&
          closedResult.status === "rejected"
        ) {
          setErrorMessage("Unable to load activities right now.");
        }
      } catch (error) {
        if (!cancelled) setErrorMessage("Unable to load activities right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedLeadId]);

  const filteredBuckets = useMemo(() => ACTIVITY_BUCKETS.map((bucket) => ({
    ...bucket,
    items: (bucketedItems[bucket.id] || []).filter((item) => matchesTab(item, activeTab)),
  })), [activeTab, bucketedItems]);

  const activeTabLabel = useMemo(
    () => ACTIVITY_TABS.find((tab) => tab.id === activeTab)?.label || "Activities",
    [activeTab]
  );

  const visibleLeadOptions = tabLeadOptions[activeTab] || [];

  const renderActivityCard = (item) => (
    <article key={item.id} className="sales-activities-card">
      <div className="sales-activities-card__accent" aria-hidden="true" />
      <div className="sales-activities-card__content">
        {item.leadName ? <div className="sales-activities-card__lead">{item.leadName}</div> : null}
        <div className="sales-activities-card__title">{item.title}</div>
        <div className="sales-activities-card__meta">
          {hasDisplayDate(item.dueDate) ? <span>{getFollowUpLabel(item.dueDate)?.label || item.dueDate}</span> : null}
          {item.status &&
          !(item.bucket === "today" && String(item.status).toLowerCase() === "pending") &&
          !(item.bucket === "closed" && String(item.status).toLowerCase() === "completed") ? (
            <span className="sales-activities-card__status">{formatStatus(item.status)}</span>
          ) : null}
        </div>
      </div>
    </article>
  );

  return (
    <div className="page sales-leads-page">
      <div className="page-hdr" style={{ marginBottom: 16 }}>
        <div className="page-hdr-l">
          <div className="page-title">{activeTabLabel}</div>
        </div>
        <div className="page-hdr-r">
          <select
            className="sales-activities-filter"
            value={selectedLeadId}
            onChange={(event) => setSelectedLeadId(event.target.value)}
            aria-label="Filter activities by lead"
          >
            <option value="all">All Leads</option>
            {visibleLeadOptions.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <div className="table-card-shell"><div className="table-card" style={{ padding: 16, color: "#64748b" }}>Loading activities...</div></div> : null}
      {!loading && errorMessage ? <div className="table-card-shell"><div className="table-card" style={{ padding: 16, color: "#64748b" }}>{errorMessage}</div></div> : null}

      {!loading && !errorMessage ? (
        <div className="sales-activities-board">
          <div className="sales-activities-board__rail salescrm-scroll-hidden">
            {filteredBuckets.map((bucket) => (
              <section key={bucket.id} className="table-card sales-activities-bucket">
                <div className="sales-activities-bucket__header">
                  <div className="sales-activities-bucket__title">{bucket.label}</div>
                  <div className="sales-activities-bucket__count">{bucket.items.length}</div>
                </div>
                <div className="sales-activities-bucket__body custom-scrollbar">
                  {bucket.items.length ? bucket.items.map(renderActivityCard) : (
                    <div className="sales-activities-empty">
                      No {activeTab} in {bucket.label.toLowerCase()}.
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
