import { useEffect, useMemo, useState } from "react";
import { BarChart3, Calendar, FileText, History, Mail, Phone } from "lucide-react";
import activitiesAPI from "../../api/activities.api";
import { STATUS_LIST } from "./constants";
import { fmtDate, formatLeadSource, formatStatus, getInitials } from "./utils";
import { IChevD, IChevR, IChevU, IEdit, IFilter, IKanban, IRows, ISearch, ISettings, ITrash, IX } from "./shared";
import { AddLeadDropdown, AssigneeCell, FollowUpCell, ScoreBar, StatusCell } from "./components";
import { LEAD_DATA_SOURCE_OPTIONS, LEAD_VIEW_OPTIONS, formatSocialLeadDate } from "./pageHelpers";

const ACTIVITY_PANEL_TABS = [
  { id: "tasks", label: "Tasks", icon: FileText },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "emails", label: "Emails", icon: Mail },
];

const ACTIVITY_BUCKETS = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "upcoming", label: "Upcoming" },
];

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
const normalizePanelActivity = (item, bucket) => ({
  id: item?.id || `${bucket}-${item?.subject || item?.title || item?.type || "activity"}-${item?.dueDate || item?.activityDate || item?.callStartTime || item?.createdAt || ""}`,
  bucket,
  type: item?.type || item?.activityType || item?.activityTypeName || item?.eventType || "Activity",
  title: item?.subject || item?.title || item?.name || item?.type || "Activity",
  dueDate: item?.dueDate || item?.activityDate || item?.callStartTime || item?.startTime || item?.createdAt || "",
  status: item?.status || item?.callStatus || "",
  leadName: item?.leadName || item?.lead?.name || item?.contactName || item?.prospectName || "",
  description: item?.description || item?.body || item?.message || "",
});
const matchesPanelTab = (item, tabId) => {
  const raw = getRawActivityType(item);
  if (tabId === "tasks") return raw.includes("task");
  if (tabId === "calls") return raw.includes("call");
  if (tabId === "meetings") return raw.includes("meeting");
  if (tabId === "emails") return raw.includes("email");
  return false;
};

export function LeadActivitiesPanel({ open, activeTab, onTabChange, onClose }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bucketedItems, setBucketedItems] = useState({ overdue: [], today: [], tomorrow: [], upcoming: [] });

  useEffect(() => {
    if (!open) return undefined;

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

        const [overdueResult, todayResult, tomorrowResult, upcomingResult] = await Promise.allSettled([
          activitiesAPI.getFollowUpsOverdue(),
          activitiesAPI.getFollowUpsToday(),
          activitiesAPI.getFollowUps({ fromDate: startOfDay(tomorrow).toISOString(), toDate: endOfDay(tomorrow).toISOString() }),
          activitiesAPI.getFollowUps({ fromDate: startOfDay(dayAfterTomorrow).toISOString() }),
        ]);

        if (cancelled) return;

        const nextBuckets = {
          overdue: overdueResult.status === "fulfilled" ? (overdueResult.value || []).filter((item) => !isCompletedActivity(item)).map((item) => normalizePanelActivity(item, "overdue")) : [],
          today: todayResult.status === "fulfilled" ? (todayResult.value || []).filter((item) => !isCompletedActivity(item)).map((item) => normalizePanelActivity(item, "today")) : [],
          tomorrow: tomorrowResult.status === "fulfilled" ? (tomorrowResult.value || []).filter((item) => !isCompletedActivity(item)).map((item) => normalizePanelActivity(item, "tomorrow")) : [],
          upcoming: upcomingResult.status === "fulfilled" ? (upcomingResult.value || []).filter((item) => !isCompletedActivity(item)).map((item) => normalizePanelActivity(item, "upcoming")) : [],
        };

        setBucketedItems(nextBuckets);
        if (
          overdueResult.status === "rejected" &&
          todayResult.status === "rejected" &&
          tomorrowResult.status === "rejected" &&
          upcomingResult.status === "rejected"
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
  }, [open]);

  const filteredBuckets = useMemo(() => ACTIVITY_BUCKETS.map((bucket) => ({
    ...bucket,
    items: (bucketedItems[bucket.id] || []).filter((item) => matchesPanelTab(item, activeTab)),
  })), [activeTab, bucketedItems]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.18)", zIndex: 620 }} />
      <aside style={{ position: "fixed", top: 0, right: 0, width: "min(420px, 100vw)", height: "100vh", background: "#ffffff", borderLeft: "1px solid #dbe4f0", boxShadow: "-16px 0 40px rgba(15, 23, 42, 0.12)", zIndex: 621, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #e8eef5", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>Activities</div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: "#64748b" }}>Overdue, today, tomorrow, and upcoming follow-ups.</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} style={{ width: 32, height: 32, padding: 0 }}>
            <IX s={14} />
          </button>
        </div>

        <div style={{ padding: "12px 18px 10px", borderBottom: "1px solid #eef2f7", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ACTIVITY_PANEL_TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 11px", borderRadius: 12, border: "1.5px solid", borderColor: active ? "#93c5fd" : "#dbe4f0", background: active ? "#eff6ff" : "#ffffff", color: active ? "#1d4ed8" : "#475569", fontSize: 12.5, fontWeight: 800 }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="salescrm-scroll-hidden" style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {loading ? <div style={{ fontSize: 13, color: "#64748b" }}>Loading activities...</div> : null}
          {!loading && errorMessage ? <div style={{ border: "1px solid #dbe4f0", borderRadius: 16, background: "#fbfdff", color: "#64748b", padding: "14px 16px", fontSize: 13 }}>{errorMessage}</div> : null}
          {!loading && !errorMessage && filteredBuckets.map((bucket) => (
            <section key={bucket.id} style={{ border: "1px solid #e5edf6", borderRadius: 18, background: "#ffffff", overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#fbfdff" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>{bucket.label}</div>
                <div style={{ minWidth: 28, height: 24, borderRadius: 999, padding: "0 8px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#eef6ff", color: "#315c85", fontSize: 11.5, fontWeight: 800 }}>
                  {bucket.items.length}
                </div>
              </div>
              <div style={{ padding: 14, display: "grid", gap: 10 }}>
                {bucket.items.length ? bucket.items.map((item) => (
                  <div key={item.id} style={{ border: "1px solid #edf2f8", borderRadius: 14, background: "#ffffff", padding: "12px 13px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{item.leadName || item.type}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#334155" }}>{fmtDate(item.dueDate)}</div>
                    {item.status ? <div style={{ marginTop: 4, fontSize: 11.5, color: "#64748b" }}>{formatStatus(item.status)}</div> : null}
                  </div>
                )) : (
                  <div style={{ border: "1px dashed #dbe4f0", borderRadius: 14, background: "#fbfdff", color: "#94a3b8", fontSize: 12.5, textAlign: "center", padding: "20px 12px" }}>
                    No {activeTab} in {bucket.label.toLowerCase()}.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </aside>
    </>
  );
}

export function DeletedLeadsPanel({ leads, open, onToggleOpen }) {
  if (!leads.length) return null;

  return (
    <div className="table-card-shell sales-leads-history-shell" style={{ marginTop: 18, marginInline: "auto", width: "fit-content", maxWidth: "100%" }}>
      <div className="table-card sales-leads-history-card" style={{ width: "fit-content", maxWidth: "100%" }}>
        <button onClick={onToggleOpen} style={{ width: "fit-content", maxWidth: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "8px", border: "none", background: "transparent", cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 700, color: "#111827" }}>
            <History size={12} />
            Deleted Leads History
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 11, fontWeight: 700 }}>
            {leads.length} deleted
            <IChevD s={12} style={{ transform: open ? "rotate(180deg)" : "none" }} />
          </span>
        </button>
        {open && (
          <div className="table-scroll sales-leads-history-scroll" style={{ width: "fit-content", maxWidth: "100%", borderTop: "1px solid #eef2f7" }}>
            <table className="table sales-leads-history-table">
              <thead>
                <tr className="thead-row">
                  <th className="th">No.</th>
                  <th className="th">Name</th>
                  <th className="th">Company</th>
                  <th className="th">Source</th>
                  <th className="th">Status</th>
                  <th className="th">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <tr key={lead.id} className="row sales-leads-history-row">
                    <td className="td"><span className="cell-txt">{index + 1}</span></td>
                    <td className="td"><span className="cell-txt">{lead.name}</span></td>
                    <td className="td"><span className="cell-txt">{lead.company}</span></td>
                    <td className="td"><span className="cell-txt">{formatLeadSource(lead.source)}</span></td>
                    <td className="td"><span className="cell-txt">{formatStatus(lead.status)}</span></td>
                    <td className="td"><span className="date-txt">{fmtDate(lead.createdDate)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function LeadsToolbar({
  leadDataSource,
  activeFilterCount,
  showChart,
  searchField,
  searchFieldOptions,
  activeSearchFieldLabel,
  search,
  onOpenFilters,
  onSearchFieldChange,
  onSearchChange,
  onToggleChart,
  onOpenImport,
  onAddLeadType,
}) {
  const controlHeight = 32;

  return (
    <div className="toolbar" style={{ gap: 10, marginBottom: 10, justifyContent: "center" }}>
      <div className="toolbar-mid" style={{ gap: 8, rowGap: 8, width: "fit-content", maxWidth: "100%", justifyContent: "center" }}>
        {leadDataSource === "sales" && (
          <>
            <button className={`btn-ghost ${activeFilterCount > 0 ? "btn-ghost--active" : ""}`} onClick={onOpenFilters} style={{ minHeight: controlHeight, height: controlHeight, padding: "0 12px", fontSize: 13 }}>
              <IFilter s={12} />
              &ensp;Filter
              {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            </button>
            <div className="toolbar-divider" style={{ margin: "0 2px", height: controlHeight - 10 }} />
          </>
        )}

        <div className="unified-search" style={{ minHeight: controlHeight, height: controlHeight, padding: "1px 2px" }}>
          {leadDataSource === "sales" && (
            <>
              <select className="search-field-select" style={{ minWidth: 100, padding: "0 6px 0 8px", height: controlHeight - 4 }} value={searchField} onChange={(event) => onSearchFieldChange(event.target.value)}>
                {searchFieldOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <div className="unified-divider" style={{ margin: "0 4px", height: controlHeight - 12 }} />
            </>
          )}
          <div className="search-wrap">
            <span className="search-ico"><ISearch s={14} c="#9ca3af" /></span>
            <input
              type="text"
              className="search-inp unified-inp"
              style={{ width: leadDataSource === "social" ? 260 : 220, height: controlHeight - 4, padding: "5px 28px 5px 34px", fontSize: 13.5 }}
              placeholder={leadDataSource === "social" ? "Search social leads..." : `Search by ${activeSearchFieldLabel.toLowerCase()}...`}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

        {leadDataSource === "sales" && (
          <>
            <div className="toolbar-divider" style={{ margin: "0 2px", height: controlHeight - 10 }} />
            <button className={`icon-btn-outline ${showChart ? "icon-btn-outline--on" : ""}`} onClick={onToggleChart} style={{ width: controlHeight, height: controlHeight }}>
              <BarChart3 size={14} />
            </button>
            <div className="toolbar-divider" style={{ margin: "0 2px", height: controlHeight - 10 }} />
            <button className="btn-ghost" onClick={onOpenImport} style={{ minHeight: controlHeight, height: controlHeight, padding: "0 12px", fontSize: 13 }}>Import</button>
            <div className="toolbar-divider" style={{ margin: "0 2px", height: controlHeight - 10 }} />
            <AddLeadDropdown onSelectType={onAddLeadType} />
          </>
        )}
      </div>
    </div>
  );
}

export function LeadsViewSwitcher({ leadDataSource, viewMode, onLeadDataSourceChange, onViewModeChange }) {
  const controlHeight = 32;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", height: controlHeight, border: "1.5px solid var(--cborder)", borderRadius: 8, overflow: "hidden", background: "var(--cs)", boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)" }}>
        {LEAD_DATA_SOURCE_OPTIONS.map((option, index, array) => (
          <button
            key={option.key}
            onClick={() => onLeadDataSourceChange(option.key)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 112,
              padding: "0 10px",
              border: "none",
              borderRight: index < array.length - 1 ? "1px solid var(--cborder)" : "none",
              background: leadDataSource === option.key ? "color-mix(in srgb, var(--ci) 12%, var(--cs))" : "#ffffff",
              color: leadDataSource === option.key ? "var(--ci)" : "var(--ct2)",
              fontSize: 13,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      {leadDataSource === "sales" && (
        <div style={{ display: "flex", height: controlHeight, border: "1.5px solid var(--cborder)", borderRadius: 8, overflow: "hidden", background: "var(--cs)", boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)" }}>
          {LEAD_VIEW_OPTIONS.map(({ key, label }) => {
            const Icon = key === "list" ? IRows : IKanban;

            return (
              <button
                key={key}
                onClick={() => onViewModeChange(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  height: "100%",
                  padding: "0 10px",
                  border: "none",
                  borderRight: key === "list" ? "1px solid var(--cborder)" : "none",
                  background: viewMode === key ? "color-mix(in srgb, var(--ci) 12%, var(--cs))" : "transparent",
                  color: viewMode === key ? "var(--ci)" : "var(--cm)",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon s={12} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LeadsFilterChips({ chips, onClearAll }) {
  if (!chips.length) return null;

  return (
    <div className="chips-bar sales-leads-filter-chips">
      {chips.map((chip) => (
        <span key={chip.key} className="chip sales-leads-filter-chip">
          {chip.dotColor && <span className="chip-dot sales-leads-filter-chip-dot" style={{ background: chip.dotColor }} />}
          {chip.label}
          <button className="chip-x sales-leads-filter-chip-remove" onClick={chip.onRemove}>
            <IX s={9} c="#4f46e5" />
          </button>
        </span>
      ))}
      <button className="chip-clearall sales-leads-filter-clearall" onClick={onClearAll}>Clear all</button>
    </div>
  );
}

export function LeadsBulkBar({
  selectedCount,
  showBulkStatusPicker,
  bulkStatus,
  onBulkStatusChange,
  onApplyBulkStatus,
  onToggleBulkStatusPicker,
  onExportSelected,
  onBulkDelete,
  onClearSelection,
}) {
  if (selectedCount <= 0) return null;

  return (
    <div className="bulk-bar sales-leads-bulk-bar">
      <span className="bulk-cnt sales-leads-bulk-count">{selectedCount} selected</span>
      {showBulkStatusPicker ? (
        <>
          <div style={{ display: "inline-flex", alignItems: "stretch", border: "1.5px solid var(--cborder)", borderRadius: 10, overflow: "hidden", background: "var(--cs)" }}>
            <select className="bulk-select sales-leads-bulk-select" value={bulkStatus} onChange={(event) => onBulkStatusChange(event.target.value)} style={{ border: "none", borderRight: "1.5px solid var(--cborder)", borderRadius: 0, minWidth: 170, background: "transparent" }}>
              {STATUS_LIST.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
            <button className="bulk-btn sales-leads-bulk-button" onClick={onApplyBulkStatus} style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>Apply Status</button>
          </div>
          <button className="bulk-btn sales-leads-bulk-button" onClick={() => onToggleBulkStatusPicker(false)}>Cancel</button>
        </>
      ) : (
        <button className="bulk-btn sales-leads-bulk-button" onClick={() => onToggleBulkStatusPicker(true)}>Change Status</button>
      )}
      <button className="bulk-btn sales-leads-bulk-button" onClick={onExportSelected}>Export</button>
      <button
        className="bulk-btn bulk-btn--danger sales-leads-bulk-button sales-leads-bulk-button--icon"
        onClick={onBulkDelete}
        title="Delete selected leads"
        aria-label="Delete selected leads"
      >
        <ITrash s={13} />
      </button>
      <button className="bulk-close sales-leads-bulk-close" onClick={onClearSelection}>
        <IX s={12} c="#6b7280" />
      </button>
    </div>
  );
}

export function LeadsLoadingNotice({ children }) {
  return (
    <div style={{ marginBottom: 16, border: "1px solid #dbe4f0", borderRadius: 16, background: "#ffffff", padding: "12px 14px", color: "#64748b", fontSize: 13, fontWeight: 600 }}>
      {children}
    </div>
  );
}

export function SalesLeadsTable({
  wrapText,
  allOnPageSelected,
  onToggleAll,
  activeColumns,
  sortBy,
  sortDir,
  onSort,
  showColumnPanel,
  onOpenColumnPanel,
  leads,
  page,
  rowsPerPage,
  selected,
  onToggleOne,
  onOpenDetails,
  onUpdateLead,
  salesUserOptions,
  onOpenEdit,
  onDeleteLead,
}) {
  return (
    <div className="table-card-shell sales-leads-table-shell">
      <div className="table-card sales-leads-table-card">
        <div className="table-scroll sales-leads-table-scroll">
          <table className={`table sales-leads-table ${wrapText ? "table--wrap" : ""}`}>
            <thead>
              <tr className="thead-row sales-leads-table-head-row">
                <th className="th th-check"><input type="checkbox" className="cb" checked={allOnPageSelected} onChange={onToggleAll} /></th>
                {activeColumns.map((column) => (
                  <th key={column.key} className={`th sales-leads-table-head-cell th-${column.key}`} onClick={() => onSort(column.key)}>
                    <span className="th-inner">
                      {column.label}
                      <SortIcon sortBy={sortBy} sortDir={sortDir} columnKey={column.key} />
                    </span>
                  </th>
                ))}
                <th className="th th-actions sales-leads-table-head-cell">
                  <button className={`icon-btn-outline ${showColumnPanel ? "icon-btn-outline--on" : ""}`} onClick={onOpenColumnPanel}>
                    <ISettings s={13} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, rowIndex) => {
                const serial = (page - 1) * rowsPerPage + rowIndex + 1;
                const initials = getInitials(lead.name);
                const isSelected = selected.has(lead.id);

                return (
                  <tr key={lead.id} className={`row sales-leads-table-row ${isSelected ? "row--sel" : ""}`}>
                    <td className="td td-check"><input type="checkbox" className="cb" checked={isSelected} onChange={() => onToggleOne(lead.id)} /></td>
                    {activeColumns.map((column) => renderLeadTableCell({ columnKey: column.key, lead, serial, initials, salesUserOptions, onOpenDetails, onUpdateLead }))}
                    <td className="td td-actions">
                      <div className="row-acts sales-leads-row-actions">
                        <button className="act-btn act-btn--edit sales-deals-action-button" onClick={() => onOpenEdit(lead)}>
                          <IEdit s={12} />
                        </button>
                        <button
                          className="act-btn act-btn--delete sales-deals-action-button"
                          onClick={() => onDeleteLead(lead.id)}
                          title="Delete lead"
                          aria-label="Delete lead"
                        >
                          <ITrash s={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SocialLeadsTable({ leads }) {
  return (
    <div className="table-card-shell sales-leads-table-shell">
      <div className="table-card sales-leads-table-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px 8px" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Social Leads</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 999, padding: "6px 10px" }}>
            {leads.length} lead{leads.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="table-scroll sales-leads-table-scroll">
          <table className="table sales-leads-table">
            <thead>
              <tr className="thead-row sales-leads-table-head-row">
                <th className="th">Name</th>
                <th className="th">Platform</th>
                <th className="th">Contact</th>
                <th className="th">Status</th>
                <th className="th">Assigned To</th>
                <th className="th">Form / Page</th>
                <th className="th">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.length ? leads.map((lead) => (
                <tr key={`social-${lead.id}`} className="row sales-leads-table-row">
                  <td className="td">
                    <div className="name-cell sales-leads-name-cell">
                      <div className="avatar sales-leads-avatar" style={{ background: "#0f766e" }}>{getInitials(lead.name || "SL")}</div>
                      <div className="name-block sales-leads-name-block">
                        <span className="sales-leads-name-link__label sales-leads-name-text">{lead.name || "Unnamed lead"}</span>
                        <span className="sales-leads-name-link__meta">{lead.email || lead.phone || "Social lead"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="td"><span className="cell-txt">{lead.platform || "Facebook"}</span></td>
                  <td className="td td-contact">
                    <div className="contact-cell sales-leads-contact-cell">
                      {lead.email ? <span className="contact-email">{lead.email}</span> : null}
                      {lead.phone ? <span className="contact-phone">{lead.phone}</span> : null}
                      {!lead.email && !lead.phone ? <span className="cell-txt">-</span> : null}
                    </div>
                  </td>
                  <td className="td"><span className="cell-txt">{lead.status || "New"}</span></td>
                  <td className="td"><span className="cell-txt">{lead.assignedToUserName || "Unassigned"}</span></td>
                  <td className="td"><span className="cell-txt">{lead.formName || lead.formId || lead.pageName || lead.pageId || "-"}</span></td>
                  <td className="td"><span className="date-txt">{formatSocialLeadDate(lead.createdAt || lead.metaCreatedAt || lead.createdDate)}</span></td>
                </tr>
              )) : (
                <tr className="row sales-leads-table-row">
                  <td className="td" colSpan={7}>
                    <div style={{ padding: "28px 12px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                      No social leads found for the current brand or search.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortIcon({ sortBy, sortDir, columnKey }) {
  return (
    <span className="sort-ico">
      {sortBy === columnKey
        ? (sortDir === "asc"
          ? <IChevU s={9} />
          : <IChevD s={9} />)
        : <span className="sort-both"><IChevU s={8} /><IChevD s={8} /></span>}
    </span>
  );
}

function renderLeadTableCell({ columnKey, lead, serial, initials, salesUserOptions, onOpenDetails, onUpdateLead }) {
  switch (columnKey) {
    case "serial":
      return <td key="serial" className="td"><span className="cell-txt">{serial}</span></td>;
    case "name":
      return (
        <td key="name" className="td td-name">
          <div className="name-cell sales-leads-name-cell">
            <div className="avatar sales-leads-avatar" style={{ background: lead.avatarBg }}>{initials}</div>
            <div className="name-block sales-leads-name-block">
              <span className="sales-leads-name-link__label sales-leads-name-text">{lead.name}</span>
              <button className="name-link sales-leads-name-link" onClick={() => onOpenDetails(lead.id)} title={`Open ${lead.name || "lead"} details`} aria-label={`Open ${lead.name || "lead"} details`}>
                <span className="sales-leads-name-link__meta">View <IChevR s={11} /></span>
              </button>
            </div>
          </div>
        </td>
      );
    case "status":
      return <td key="status" className="td td-status"><StatusCell value={lead.status} onChange={(value) => onUpdateLead(lead.id, "status", value)} /></td>;
    case "followUp":
      return <td key="followUp" className="td td-followup"><FollowUpCell value={lead.followUpBucketDueDate || lead.followUpDate} bucket={lead.followUpBucket} leadId={lead.id} onChange={(value) => onUpdateLead(lead.id, "followUpDate", value)} /></td>;
    case "source":
      return <td key="source" className="td"><span className="cell-txt">{formatLeadSource(lead.source)}</span></td>;
    case "score":
      return <td key="score" className="td td-score"><ScoreBar score={lead.score} /></td>;
    case "company":
      return <td key="company" className="td"><span className="cell-txt">{lead.company}</span></td>;
    case "contact":
      return (
        <td key="contact" className="td td-contact">
          <div className="contact-cell sales-leads-contact-cell">
            {lead.email ? <span className="contact-email">{lead.email}</span> : null}
            {lead.phone ? <span className="contact-phone">{lead.phone}</span> : null}
            {!lead.email && !lead.phone ? <span className="cell-txt">-</span> : null}
          </div>
        </td>
      );
    case "assignee":
      return <td key="assignee" className="td td-assignee"><AssigneeCell value={lead.assignee} options={salesUserOptions} onChange={(value) => onUpdateLead(lead.id, "assignee", value)} /></td>;
    case "createdDate":
      return <td key="createdDate" className="td"><span className="date-txt">{fmtDate(lead.createdDate)}</span></td>;
    default:
      return (
        <td key={columnKey} className={`td ${columnKey === "comments" ? "td-wrap-limit td-comments" : ""}`}>
          <span className="cell-txt">{String(lead[columnKey] ?? "")}</span>
        </td>
      );
  }
}
