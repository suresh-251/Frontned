import "../styles/Leads.css";
import "react-datepicker/dist/react-datepicker.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import leadsAPI from "../api/leads.api";
import activitiesAPI from "../api/activities.api";
import { getLeads as getSocialLeads } from "../../socialCRM/api/facebook.leads.api";
import LeadDetailsModal from "../components/LeadDetailsModal.jsx";
import { ALL_COLUMNS, CLEARED_FILTERS, DEFAULT_FILTERS, INITIAL_STATS, STAT_CARDS, STATUS_LIST } from "./leads/constants";
import {
  CreateLeadModal,
  EditModal,
  FilterModal,
  ImportModal,
  KanbanBoard,
  LeadsPerformanceChart,
  ManageColumnsPanel,
  StatCard,
} from "./leads/components";
import { getLeadAvatarColor, leadToUpdatePayload, normalizeLeads, sanitizeStatus } from "./leads/utils";
import {
  buildLeadFilterChips,
  buildTodayFollowUpStats,
  countActiveLeadFilters,
  countFreshLeadsCreatedToday,
  enrichLeadsWithFollowUpBuckets,
  exportLeadsToWorkbook,
  filterSocialLeads,
  getSalesUserLabel,
  getVisibleColumnsFromStorage,
  matchesLeadFilters,
  normalizeFollowUpDateTime,
  SEARCH_FIELD_OPTIONS,
  sortLeads,
  VISIBLE_COLUMNS_STORAGE_KEY,
} from "./leads/pageHelpers";
import {
  DeletedLeadsPanel,
  LeadsBulkBar,
  LeadsFilterChips,
  LeadsLoadingNotice,
  LeadsToolbar,
  LeadsViewSwitcher,
  SalesLeadsTable,
  SocialLeadsTable,
} from "./leads/pageSections";

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
  const [visibleCols, setVisibleCols] = useState(getVisibleColumnsFromStorage);
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
  const [showDeletedLeadsHistory, setShowDeletedLeadsHistory] = useState(false);

  const salesUserOptions = useMemo(() => {
    const names = salesUsers.map((user) => getSalesUserLabel(user)).filter(Boolean);
    return Array.from(new Set(names));
  }, [salesUsers]);

  const activeFilterCount = useMemo(() => countActiveLeadFilters(filters), [filters]);
  const activeColumns = useMemo(() => ALL_COLUMNS.filter((column) => column.always || visibleCols.includes(column.key)), [visibleCols]);
  const activeSearchFieldLabel = useMemo(() => SEARCH_FIELD_OPTIONS.find((option) => option.value === searchField)?.label || "All Details", [searchField]);
  const hasActiveFilters = Boolean(search) || activeFilterCount > 0;

  const applyAssigneeNames = useCallback((items, users) => {
    const userMap = new Map((users || []).map((user) => [
      Number(user.id || user.userId || 0),
      getSalesUserLabel(user),
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
    localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(visibleCols));
  }, [visibleCols]);

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
      .then((data) => {
        if (!active) return;
        const normalized = normalizeLeads(data);
        setDeletedLeads(resolvedUsers.length ? applyAssigneeNames(normalized, resolvedUsers) : normalized);
      })
      .catch((error) => {
        if (active) {
          console.error("Failed to fetch deleted leads", error);
          setDeletedLeads([]);
        }
      });

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
      .catch((error) => {
        if (active) {
          console.error("Failed to fetch lead stats", error);
          setStats(INITIAL_STATS);
        }
      });

    return () => {
      active = false;
    };
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
    return () => {
      active = false;
    };
  }, [leadDataSource]);

  useEffect(() => {
    setStats((current) => ({
      ...current,
      totalNewLeadsDueToday: countFreshLeadsCreatedToday(leads),
      ...buildTodayFollowUpStats(todayFollowUpItems),
    }));
  }, [leads, todayFollowUpItems]);

  useEffect(() => {
    setPage(1);
  }, [search, searchField, filters, rowsPerPage]);

  const enrichedLeads = useMemo(() => enrichLeadsWithFollowUpBuckets(leads, followUpBuckets), [followUpBuckets, leads]);
  const filteredLeads = useMemo(() => sortLeads(
    enrichedLeads.filter((lead) => matchesLeadFilters(lead, filters, search, searchField)),
    sortBy,
    sortDir,
  ), [enrichedLeads, filters, search, searchField, sortBy, sortDir]);
  const filteredSocialLeads = useMemo(() => filterSocialLeads(socialLeads, search), [search, socialLeads]);
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / rowsPerPage));
  const paginatedLeads = filteredLeads.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const allOnPageSelected = paginatedLeads.length > 0 && paginatedLeads.every((lead) => selected.has(lead.id));

  const filterChips = useMemo(() => buildLeadFilterChips({
    search,
    activeSearchFieldLabel,
    filters,
    onUpdateFilters: (patch) => setFilters((current) => ({ ...current, ...patch })),
    onClearSearch: () => setSearch(""),
    onClearAll: () => {
      setSearch("");
      setFilters({ ...CLEARED_FILTERS, followUp: "All" });
    },
  }), [activeSearchFieldLabel, filters, search]);

  const updateLead = useCallback(async (id, field, value) => {
    const existing = leads.find((lead) => lead.id === id);
    if (!existing) return;

    const normalizedValue = field === "status" ? sanitizeStatus(value) : value;
    let nextLead = { ...existing, [field]: normalizedValue };

    if (field === "status") {
      nextLead = { ...nextLead, avatarBg: getLeadAvatarColor(normalizedValue) };
    }

    if (field === "followUpDate") {
      nextLead = { ...nextLead, nextFollowUpAt: normalizeFollowUpDateTime(value) };
    }

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
      } else if (field === "followUpDate") {
        await leadsAPI.update(id, { nextFollowUpAt: normalizeFollowUpDateTime(value) });
      } else if (field === "source") {
        await leadsAPI.update(id, { ...leadToUpdatePayload(nextLead), source: value });
      } else {
        await leadsAPI.update(id, { [field]: value });
      }
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
      const [normalized] = normalizeLeads([updated?.id ? updated : { ...editLead, ...form, id }]);
      mergeLead({
        ...normalized,
        assignedToUserId: Number(form.assignedToUserId || 0),
        assignee: selectedUser ? getSalesUserLabel(selectedUser) : "Unassigned",
      });
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
    exportLeadsToWorkbook(selectedLeads);
  };

  const toggleAll = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allOnPageSelected) {
        paginatedLeads.forEach((lead) => next.delete(lead.id));
      } else {
        paginatedLeads.forEach((lead) => next.add(lead.id));
      }
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
    const applyStatus = (items) => items.map((lead) => (selected.has(lead.id) ? { ...lead, status: bulkStatus } : lead));

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

  const handleAddLeadType = (leadType) => {
    if (leadType.key === "import") {
      setShowImport(true);
      return;
    }
    setCreateLeadType(leadType);
  };

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

  const handleOpenEdit = async (lead) => {
    const detailedLead = await fetchLeadForEdit(lead.id);
    setEditLead(detailedLead || lead);
  };

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(columnKey);
    setSortDir("asc");
  };

  return (
    <div className="page sales-leads-page">
      {leadDataSource === "sales" && (
        <div className="stat-grid">
          {STAT_CARDS.map(({ label, key, detailKey, detailLabel, helper, icon, alert, c }, index) => (
            <StatCard
              key={label}
              label={label}
              value={stats[key] ?? 0}
              detailValue={stats[detailKey] ?? 0}
              detailLabel={detailLabel}
              helper={helper}
              icon={icon}
              alert={alert}
              c={c}
              delay={`${index * 0.07}s`}
            />
          ))}
        </div>
      )}

      <LeadsToolbar
        leadDataSource={leadDataSource}
        activeFilterCount={activeFilterCount}
        showChart={showChart}
        searchField={searchField}
        searchFieldOptions={SEARCH_FIELD_OPTIONS}
        activeSearchFieldLabel={activeSearchFieldLabel}
        search={search}
        onOpenFilters={() => setShowFilter(true)}
        onSearchFieldChange={setSearchField}
        onSearchChange={setSearch}
        onToggleChart={() => setShowChart((current) => !current)}
        onOpenImport={() => setShowImport(true)}
        onAddLeadType={handleAddLeadType}
      />

      <LeadsViewSwitcher
        leadDataSource={leadDataSource}
        viewMode={viewMode}
        onLeadDataSourceChange={setLeadDataSource}
        onViewModeChange={setViewMode}
      />

      {leadDataSource === "sales" && hasActiveFilters && (
        <LeadsFilterChips chips={filterChips.chips} onClearAll={filterChips.clearAll} />
      )}

      <LeadsBulkBar
        selectedCount={selected.size}
        showBulkStatusPicker={showBulkStatusPicker}
        bulkStatus={bulkStatus}
        onBulkStatusChange={setBulkStatus}
        onApplyBulkStatus={handleBulkStatusChange}
        onToggleBulkStatusPicker={setShowBulkStatusPicker}
        onExportSelected={handleExportSelected}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => {
          setSelected(new Set());
          setShowBulkStatusPicker(false);
        }}
      />

      {leadDataSource === "sales" && loading && (
        <LeadsLoadingNotice>
          Loading leads. Secondary panels like deleted history, dashboard stats, and assignee names may finish a moment after the table.
        </LeadsLoadingNotice>
      )}

      {leadDataSource === "social" && socialLoading && (
        <LeadsLoadingNotice>
          Loading social leads from socialCRM.
        </LeadsLoadingNotice>
      )}

      {leadDataSource === "sales" && viewMode === "kanban" && (
        <KanbanBoard
          leads={filteredLeads}
          groupBy={kanbanGroupBy}
          setGroupBy={setKanbanGroupBy}
          onUpdateLead={updateLead}
          onOpenDetails={fetchLeadDetail}
        />
      )}

      {leadDataSource === "sales" && viewMode === "list" && (
        <SalesLeadsTable
          wrapText={wrapText}
          allOnPageSelected={allOnPageSelected}
          onToggleAll={toggleAll}
          activeColumns={activeColumns}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          showColumnPanel={showColPanel}
          onOpenColumnPanel={() => setShowColPanel(true)}
          leads={paginatedLeads}
          page={page}
          rowsPerPage={rowsPerPage}
          selected={selected}
          onToggleOne={toggleOne}
          onOpenDetails={fetchLeadDetail}
          onUpdateLead={updateLead}
          salesUserOptions={salesUserOptions}
          onOpenEdit={handleOpenEdit}
        />
      )}

      {leadDataSource === "social" && <SocialLeadsTable leads={filteredSocialLeads} />}

      {leadDataSource === "sales" && (
        <DeletedLeadsPanel
          leads={deletedLeads}
          open={showDeletedLeadsHistory}
          onToggleOpen={() => setShowDeletedLeadsHistory((current) => !current)}
        />
      )}

      {leadDataSource === "sales" && showColPanel && (
        <ManageColumnsPanel
          visibleCols={visibleCols}
          setVisibleCols={setVisibleCols}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          wrapText={wrapText}
          setWrapText={setWrapText}
          onClose={() => setShowColPanel(false)}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      )}

      {leadDataSource === "sales" && detailsLead && (
        <LeadDetailsModal
          lead={detailsLead}
          onClose={() => setDetailsLead(null)}
          onDealConverted={handleDealConverted}
          onActivitySaved={refreshTodayFollowUpItems}
        />
      )}

      {leadDataSource === "sales" && editLead && (
        <EditModal
          lead={editLead}
          onClose={() => setEditLead(null)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          salesUsers={salesUsers}
          saving={savingLead}
          deleting={deletingLead}
        />
      )}

      {leadDataSource === "sales" && showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={handleImportLeads} />
      )}

      {leadDataSource === "sales" && showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          filters={filters}
          activeFilterCount={activeFilterCount}
          onApply={setFilters}
          assignees={salesUserOptions}
        />
      )}

      {leadDataSource === "sales" && createLeadType && (
        <CreateLeadModal
          leadType={createLeadType}
          onClose={() => setCreateLeadType(null)}
          onSave={handleCreateLead}
        />
      )}

      {leadDataSource === "sales" && showChart && (
        <LeadsPerformanceChart onClose={() => setShowChart(false)} leads={leads} />
      )}
    </div>
  );
}
