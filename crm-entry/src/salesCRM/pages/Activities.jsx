import "../styles/Leads.css";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import activitiesAPI from "../api/activities.api";
import leadsAPI from "../api/leads.api";
import { formatStatus, getFollowUpLabel } from "./leads/utils";
import {
  ACTIVITY_BUCKET_DEFS,
  ACTIVITY_TAB_DEFS,
  INITIAL_ACTIVITY_BUCKETS,
  buildLeadNamesById,
  endOfDay,
  mapBucketItems,
  matchesActivityTab,
  startOfDay,
} from "../utils/activityBuckets";

const hasDisplayDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export default function Activities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedLeadId = searchParams.get("leadId");
  const initialTab = ACTIVITY_TAB_DEFS.some((tab) => tab.id === requestedTab) ? requestedTab : "tasks";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedLeadId, setSelectedLeadId] = useState(requestedLeadId || "all");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [bucketedItems, setBucketedItems] = useState(INITIAL_ACTIVITY_BUCKETS);
  const [tabLeadOptions, setTabLeadOptions] = useState({
    tasks: [],
    calls: [],
    meetings: [],
    emails: [],
  });

  useEffect(() => {
    if (requestedTab && ACTIVITY_TAB_DEFS.some((tab) => tab.id === requestedTab)) {
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
              .filter((item) => matchesActivityTab(item, tabId))
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
      } catch {
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

  const filteredBuckets = useMemo(() => ACTIVITY_BUCKET_DEFS.map((bucket) => ({
    ...bucket,
    items: (bucketedItems[bucket.id] || []).filter((item) => matchesActivityTab(item, activeTab)),
  })), [activeTab, bucketedItems]);

  const activeTabLabel = useMemo(
    () => ACTIVITY_TAB_DEFS.find((tab) => tab.id === activeTab)?.label || "Activities",
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
