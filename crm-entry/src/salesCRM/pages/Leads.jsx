import "../styles/Leads.css";
import "react-datepicker/dist/react-datepicker.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, History } from "lucide-react";
import leadsAPI from "../api/leads.api";
import LeadDetailsModal from "../components/LeadDetailsModal.jsx";
import { ALL_COLUMNS, CLEARED_FILTERS, DEFAULT_FILTERS, INITIAL_STATS, STAT_CARDS, STATUS_META } from "./leads/constants";
import {
  AddLeadDropdown,
  CreateLeadModal,
  EditModal,
  FilterModal,
  FollowUpCell,
  IChevD,
  IChevL,
  IChevR,
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
import { fmtDate, formatLeadSource, formatStatus, getInitials, leadToUpdatePayload, makeInitialActivity, normalizeLeads, todayStr } from "./leads/utils";

const VISIBLE_COLUMNS_STORAGE_KEY = "crm_visible_columns";
const SEARCH_FIELD_OPTIONS = [
  { value: "all", label: "All Details" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
];

function SortIcon({ sortBy, sortDir, col }) {
  return <span className="sort-ico">{sortBy === col ? (sortDir === "asc" ? <IChevU s={9} /> : <IChevD s={9} />) : <span className="sort-both"><IChevU s={8} /><IChevD s={8} /></span>}</span>;
}

function DeletedLeadsPanel({ leads }) {
  const [open, setOpen] = useState(false);
  if (!leads.length) return null;

  return (
    <div className="table-card-shell" style={{ marginTop: 18 }}>
      <div className="table-card">
        <button onClick={() => setOpen((current) => !current)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", border: "none", background: "transparent", cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 700, color: "#111827" }}><History size={16} />Deleted Leads History</span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13, fontWeight: 700 }}>{leads.length} deleted<IChevD s={12} style={{ transform: open ? "rotate(180deg)" : "none" }} /></span>
        </button>
        {open && <div className="table-scroll" style={{ borderTop: "1px solid #eef2f7" }}><table className="table"><thead><tr className="thead-row"><th className="th">Lead ID</th><th className="th">Name</th><th className="th">Company</th><th className="th">Source</th><th className="th">Status</th><th className="th">Created</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} className="row"><td className="td"><span className="cell-txt">{lead.id}</span></td><td className="td"><span className="cell-txt">{lead.name}</span></td><td className="td"><span className="cell-txt">{lead.company}</span></td><td className="td"><span className="cell-txt">{formatLeadSource(lead.source)}</span></td><td className="td"><span className="cell-txt">{formatStatus(lead.status)}</span></td><td className="td"><span className="date-txt">{fmtDate(lead.createdDate)}</span></td></tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [deletedLeads, setDeletedLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [activityLog, setActivityLog] = useState({});
  const [stats, setStats] = useState(INITIAL_STATS);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("createdDate");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(ALL_COLUMNS.map((column) => column.key));
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

  const salesUserOptions = useMemo(() => salesUsers.map((user) => user.name?.trim() || user.username || user.email || `User ${user.userId || user.id}`), [salesUsers]);

  const applyAssigneeNames = useCallback((items, users) => {
    const userMap = new Map((users || []).map((user) => [
      Number(user.id || user.userId || 0),
      user.name?.trim() || user.username || user.email || `User ${user.id || user.userId}`
    ]).filter(([id]) => id > 0));

    return items.map((lead) => ({
      ...lead,
      assignee: userMap.get(Number(lead.assignedToUserId || 0)) || lead.assignee || "Unassigned",
    }));
  }, []);

  const mergeLead = useCallback((updatedLead) => {
    setLeads((current) => current.map((lead) => (lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead)));
    setDetailsLead((current) => (current && current.id === updatedLead.id ? { ...current, ...updatedLead } : current));
    setEditLead((current) => (current && current.id === updatedLead.id ? { ...current, ...updatedLead } : current));
  }, []);

  const fetchLeadDetail = useCallback(async (id) => {
    try {
      const data = await leadsAPI.getById(id);
      const [normalized] = normalizeLeads([data]);
      setDetailsLead(normalized);
      return normalized;
    } catch (error) {
      console.error("Failed to load lead details", error);
      return null;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(visibleCols));
  }, [visibleCols]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsData, deletedData, statsData, userData] = await Promise.all([
          leadsAPI.getAll(),
          leadsAPI.getDeleted(),
          leadsAPI.getDashboard(),
          leadsAPI.getSalesUsers(),
        ]);
        const normalizedLeads = applyAssigneeNames(normalizeLeads(leadsData), userData);
        setLeads(normalizedLeads);
        setDeletedLeads(applyAssigneeNames(normalizeLeads(deletedData), userData));
        setActivityLog(makeInitialActivity(normalizedLeads));
        setStats(statsData);
        setSalesUsers(userData);
      } catch (error) {
        console.error("Error fetching leads data", error);
      }
    };
    loadData();
  }, [applyAssigneeNames]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "All") count++;
    if (filters.source !== "All") count++;
    if (filters.assignee !== "All") count++;
    if (filters.createdDateFrom || filters.createdDateTo) count++;
    if (filters.followUpDateFrom || filters.followUpDateTo) count++;
    if (filters.lastContactedDays) count++;
    if (filters.respondedTo !== "All") count++;
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
    let nextLead = { ...existing, [field]: value };
    if (field === "followUpDate") nextLead = { ...nextLead, nextFollowUpAt: value ? `${value}T00:00:00.000Z` : null };
    if (field === "assignee") {
      const selectedUser = salesUsers.find((user) => (user.name?.trim() || user.username || user.email || `User ${user.id || user.userId}`) === value);
      nextLead = {
        ...nextLead,
        assignee: value,
        assignedToUserId: Number(selectedUser?.id || selectedUser?.userId || 0),
      };
    }
    mergeLead(nextLead);
    try {
      if (field === "status") {
        const updated = await leadsAPI.updateStatus(id, value);
        const [normalized] = normalizeLeads([{ ...existing, ...updated, id }]);
        mergeLead({ ...nextLead, ...normalized, status: updated?.status || value, score: updated?.score ?? normalized?.score ?? nextLead.score });
      }
      else if (field === "followUpDate") await leadsAPI.update(id, { nextFollowUpAt: value ? `${value}T00:00:00.000Z` : null });
      else if (field === "source") await leadsAPI.update(id, { ...leadToUpdatePayload(nextLead), source: value });
      else if (field === "assignee") {
        const userId = Number(nextLead.assignedToUserId || 0);
        await leadsAPI.assignLead(id, userId);
      }
      else await leadsAPI.update(id, { [field]: value });
    } catch (error) {
      console.error("Failed to update lead", error);
      mergeLead(existing);
    }
  }, [leads, mergeLead, salesUsers]);

  const adjustScore = useCallback((id, delta) => {
    const lead = leads.find((item) => item.id === id);
    const newScore = lead ? Math.max(0, Math.min(100, lead.score + delta)) : null;
    if (newScore === null) return;
    mergeLead({ ...lead, score: newScore });
    setActivityLog((current) => ({ ...current, [id]: [{ id: Date.now(), type: "score-change", date: todayStr(), time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), notes: `Score ${delta > 0 ? "increased" : "decreased"} ${delta > 0 ? "+" : ""}${delta}` }, ...(current[id] || [])] }));
    leadsAPI.updateScore(id, newScore).catch((error) => {
      console.error("Failed to sync score", error);
      if (lead) mergeLead(lead);
    });
  }, [leads, mergeLead]);

  const handleSaveLead = async (id, form) => {
    setSavingLead(true);
    try {
      const selectedUser = salesUsers.find((user) => Number(user.id || user.userId) === Number(form.assignedToUserId));
      const updated = await leadsAPI.update(id, form);
      if (Number(form.assignedToUserId) > 0) {
        await leadsAPI.assignLead(id, Number(form.assignedToUserId));
      }
      const [normalized] = normalizeLeads([updated?.id ? updated : { ...editLead, ...form, id }]);
      mergeLead({ ...normalized, assignedToUserId: Number(form.assignedToUserId || 0), assignee: selectedUser ? (selectedUser.name?.trim() || selectedUser.username || selectedUser.email) : "Unassigned" });
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

    const escapeCsv = (value) => {
      const text = String(value ?? "").replace(/\r?\n|\r/g, " ").trim();
      return '"' + text.replace(/"/g, '""') + '"';
    };

    const rows = selectedLeads.map((lead) => columns.map(([_, key]) => {
      const value = key === "status"
        ? formatStatus(lead[key])
        : key === "source"
          ? formatLeadSource(lead[key])
          : key === "createdDate" || key === "followUpDate"
            ? (lead[key] ? fmtDate(lead[key]) : "")
            : lead[key];
      return escapeCsv(value);
    }).join(","));

    const csv = [columns.map(([label]) => escapeCsv(label)).join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-crm-leads-${todayStr()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => leads.filter((lead) => {
    const query = search.trim().toLowerCase();
    if (query) {
      const targets = {
        all: [lead.id, lead.name, lead.email, lead.phone, lead.address || ""].join(" ").toLowerCase(),
        name: lead.name.toLowerCase(),
        email: lead.email.toLowerCase(),
        phone: lead.phone.toLowerCase(),
        address: (lead.address || "").toLowerCase(),
      };
      if (!targets[searchField]?.includes(query)) return false;
    }
    if (filters.status !== "All" && lead.status !== filters.status) return false;
    if (filters.source !== "All" && lead.source !== filters.source) return false;
    if (filters.assignee !== "All" && lead.assignee !== filters.assignee) return false;
    return true;
  }).sort((a, b) => {
    const av = sortBy === "score" ? a.score : a[sortBy] ?? "";
    const bv = sortBy === "score" ? b.score : b[sortBy] ?? "";
    const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === "desc" ? -cmp : cmp;
  }), [filters, leads, search, searchField, sortBy, sortDir]);

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

  const handleClearFilters = useCallback(() => setFilters(CLEARED_FILTERS), []);
  const hasActiveFilters = Boolean(search) || activeFilterCount > 0;
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await Promise.all(ids.map((id) => leadsAPI.delete(id)));
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

  return (
    <div className="page">
      <div className="stat-grid">{STAT_CARDS.map(({ label, key, detailKey, detailLabel, helper, icon, alert, c }, index) => <StatCard key={label} label={label} value={stats[key] ?? 0} detailValue={stats[detailKey] ?? 0} detailLabel={detailLabel} helper={helper} icon={icon} alert={alert} c={c} delay={`${index * 0.07}s`} />)}</div>

      <div className="toolbar"><div className="toolbar-mid"><button className={`btn-ghost ${activeFilterCount > 0 ? "btn-ghost--active" : ""}`} onClick={() => setShowFilter(true)}><IFilter s={12} />&ensp;Filter{activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}</button><div className="toolbar-divider" /><div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "white" }}>{[{ k: "list", l: "List", I: IRows }, { k: "kanban", l: "Kanban", I: IKanban }].map(({ k, l, I }) => <button key={k} onClick={() => setViewMode(k)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", border: "none", borderRight: k === "list" ? "1px solid #e5e7eb" : "none", background: viewMode === k ? "#eef2ff" : "transparent", color: viewMode === k ? "#4f46e5" : "#6b7280" }}><I s={13} />{l}</button>)}</div><div className="toolbar-divider" /><div className="unified-search"><select className="search-field-select" value={searchField} onChange={(event) => setSearchField(event.target.value)}>{SEARCH_FIELD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><div className="unified-divider" /><div className="search-wrap"><span className="search-ico"><ISearch s={14} c="#9ca3af" /></span><input type="text" className="search-inp unified-inp" placeholder={`Search by ${activeSearchFieldLabel.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="toolbar-divider" /><button className={`icon-btn-outline ${showChart ? "icon-btn-outline--on" : ""}`} onClick={() => setShowChart(!showChart)}><BarChart3 size={14} /></button><div className="toolbar-divider" /><AddLeadDropdown onSelectType={handleAddLeadType} /></div></div>

      {hasActiveFilters && <div className="chips-bar">{search && <span className="chip">{activeSearchFieldLabel}: &ldquo;{search}&rdquo;<button className="chip-x" onClick={() => setSearch("")}><IX s={9} c="#4f46e5" /></button></span>}{filters.status !== "All" && <span className="chip"><span className="chip-dot" style={{ background: STATUS_META[filters.status]?.color || "#4f46e5" }} />Status: {formatStatus(filters.status)}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, status: "All" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.source !== "All" && <span className="chip">Source: {formatLeadSource(filters.source)}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, source: "All" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.assignee !== "All" && <span className="chip">Assignee: {filters.assignee}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, assignee: "All" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.createdDateFrom && <span className="chip">Created from: {filters.createdDateFrom}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, createdDateFrom: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.createdDateTo && <span className="chip">Created to: {filters.createdDateTo}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, createdDateTo: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.followUpDateFrom && <span className="chip">Follow-up from: {filters.followUpDateFrom}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, followUpDateFrom: "" }))}><IX s={9} c="#4f46e5" /></button></span>}{filters.followUpDateTo && <span className="chip">Follow-up to: {filters.followUpDateTo}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, followUpDateTo: "" }))}><IX s={9} c="#4f46e5" /></button></span>}<button className="chip-clearall" onClick={() => { setSearch(""); handleClearFilters(); }}>Clear all</button></div>}

      {selected.size > 0 && <div className="bulk-bar"><span className="bulk-cnt">{selected.size} selected</span><button className="bulk-btn">Assign Assignee</button><button className="bulk-btn">Change Status</button><button className="bulk-btn" onClick={handleExportSelected}>Export</button><button className="bulk-btn bulk-btn--danger" onClick={handleBulkDelete}>Delete</button><button className="bulk-close" onClick={() => setSelected(new Set())}><IX s={12} c="#6b7280" /></button></div>}

      {viewMode === "kanban" && <KanbanBoard leads={filtered} groupBy={kanbanGroupBy} setGroupBy={setKanbanGroupBy} onUpdateLead={updateLead} onOpenDetails={fetchLeadDetail} onAdjustScore={adjustScore} />}

      {viewMode === "list" && <div className="table-card-shell"><div className="table-card"><div className="table-scroll"><table className={`table ${wrapText ? "table--wrap" : ""}`}><thead><tr className="thead-row"><th className="th th-check"><input type="checkbox" className="cb" checked={allOnPageSel} onChange={toggleAll} /></th>{activeCols.map((col) => <th key={col.key} className={`th th-${col.key}`} onClick={() => { if (sortBy === col.key) setSortDir((current) => current === "asc" ? "desc" : "asc"); else { setSortBy(col.key); setSortDir("asc"); } }}><span className="th-inner">{col.label}<SortIcon sortBy={sortBy} sortDir={sortDir} col={col.key} /></span></th>)}<th className="th th-actions"><button className={`icon-btn-outline ${showColPanel ? "icon-btn-outline--on" : ""}`} onClick={() => setShowColPanel(true)}><ISettings s={13} /></button></th></tr></thead><tbody>{paginated.map((lead) => { const initials = getInitials(lead.name); const isSel = selected.has(lead.id); return <tr key={lead.id} className={`row ${isSel ? "row--sel" : ""}`}><td className="td td-check"><input type="checkbox" className="cb" checked={isSel} onChange={() => toggleOne(lead.id)} /></td>{activeCols.map((col) => { switch (col.key) { case "id": return <td key="id" className="td"><span className="cell-txt">{lead.id}</span></td>; case "name": return <td key="name" className="td td-name"><div className="name-cell"><div className="avatar" style={{ background: lead.avatarBg }}>{initials}</div><div className="name-block"><button className="name-link" onClick={() => fetchLeadDetail(lead.id)}>{lead.name}</button></div></div></td>; case "status": return <td key="status" className="td td-status"><StatusCell value={lead.status} onChange={(value) => updateLead(lead.id, "status", value)} /></td>; case "followUp": return <td key="followUp" className="td td-followup"><FollowUpCell value={lead.followUpDate} onChange={(value) => updateLead(lead.id, "followUpDate", value)} /></td>; case "source": return <td key="source" className="td"><span className="cell-txt">{formatLeadSource(lead.source)}</span></td>; case "score": return <td key="score" className="td td-score"><ScoreBar score={lead.score} /></td>; case "company": return <td key="company" className="td"><span className="cell-txt">{lead.company}</span></td>; case "phone": return <td key="phone" className="td"><a href={`tel:${lead.phone}`} className="link-cell">{lead.phone}</a></td>; case "email": return <td key="email" className="td"><a href={`mailto:${lead.email}`} className="link-cell">{lead.email}</a></td>; case "assignee": return <td key="assignee" className="td"><span className="cell-txt">{lead.assignee}</span></td>; case "createdDate": return <td key="createdDate" className="td"><span className="date-txt">{fmtDate(lead.createdDate)}</span></td>; default: return <td key={col.key} className="td"><span className="cell-txt">{String(lead[col.key] ?? "")}</span></td>; } })}<td className="td td-actions"><div className="row-acts"><button className="act-btn act-btn--edit" onClick={() => setEditLead(lead)}><IEdit s={12} /></button></div></td></tr>; })}</tbody></table></div></div></div>}

      <DeletedLeadsPanel leads={deletedLeads} />

      {showColPanel && <ManageColumnsPanel visibleCols={visibleCols} setVisibleCols={setVisibleCols} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} wrapText={wrapText} setWrapText={setWrapText} onClose={() => setShowColPanel(false)} />}
      {detailsLead && <LeadDetailsModal lead={detailsLead} onClose={() => setDetailsLead(null)} />}
      {editLead && <EditModal lead={editLead} onClose={() => setEditLead(null)} onSave={handleSaveLead} onDelete={handleDeleteLead} salesUsers={salesUsers} saving={savingLead} deleting={deletingLead} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={(newLeads) => setLeads((current) => [...current, ...newLeads])} />}
      {showFilter && <FilterModal onClose={() => setShowFilter(false)} filters={filters} activeFilterCount={activeFilterCount} onApply={setFilters} assignees={salesUserOptions} />}
      {createLeadType && <CreateLeadModal leadType={createLeadType} onClose={() => setCreateLeadType(null)} onSave={handleCreateLead} />}
      {showChart && <LeadsPerformanceChart onClose={() => setShowChart(false)} leads={leads} />}
    </div>
  );
}



