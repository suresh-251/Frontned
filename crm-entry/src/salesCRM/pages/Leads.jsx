import "../styles/Leads.css";
import "react-datepicker/dist/react-datepicker.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import leadsAPI from "../api/leads.api";
import LeadDetailsModal from "../components/LeadDetailsModal.jsx";
import { ALL_COLUMNS, DEFAULT_FILTERS, INITIAL_STATS, STAT_CARDS, STATUS_META } from "./leads/constants";
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
  IMail,
  IPhone,
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
import { fmtDate, getInitials, makeInitialActivity, normalizeLeads, todayStr } from "./leads/utils";

const VISIBLE_COLUMNS_STORAGE_KEY = "crm_visible_columns";

function SortIcon({ sortBy, sortDir, col }) {
  return (
    <span className="sort-ico">
      {sortBy === col ? (sortDir === "asc" ? <IChevU s={9} /> : <IChevD s={9} />) : <span className="sort-both"><IChevU s={8} /><IChevD s={8} /></span>}
    </span>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
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
  const [showImport, setShowImport] = useState(false);
  const [createLeadType, setCreateLeadType] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [kanbanGroupBy, setKanbanGroupBy] = useState("status");
  const [showChart, setShowChart] = useState(false);

  const fetchLeadDetail = useCallback(async (id) => {
    try {
      const data = await leadsAPI.getById(id);
      const [normalized] = normalizeLeads([data]);
      setDetailsLead(normalized);
    } catch (error) {
      console.error("Failed to load lead details", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(visibleCols));
  }, [visibleCols]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const leadsData = await leadsAPI.getAll();
        const normalizedLeads = normalizeLeads(leadsData);
        setLeads(normalizedLeads);
        setActivityLog(makeInitialActivity(normalizedLeads));
      } catch (error) {
        console.error("Error fetching leads", error);
      }

      try {
        const statsData = await leadsAPI.getDashboard();
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      }
    };

    loadData();
  }, []);

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

  const updateLead = useCallback(async (id, field, value) => {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, [field]: value } : lead)));
    setDetailsLead((current) => (current && current.id === id ? { ...current, [field]: value } : current));
    try {
      if (field === "status") {
        await leadsAPI.updateStatus(id, value);
      } else {
        await leadsAPI.update(id, { [field]: value });
      }
    } catch (error) {
      console.error("Failed to update lead", error);
    }
  }, []);

  const adjustScore = useCallback((id, delta, customActivity = null) => {
    const lead = leads.find((item) => item.id === id);
    const newScore = lead ? Math.max(0, Math.min(100, lead.score + delta)) : null;
    setLeads((current) => current.map((item) => (item.id !== id ? item : { ...item, score: newScore })));
    setDetailsLead((current) => (!current || current.id !== id ? current : { ...current, score: newScore }));
    const now = new Date();
    const act = customActivity || { type: "score-change", date: todayStr(), time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), notes: `Score ${delta > 0 ? "increased" : "decreased"} ${delta > 0 ? "+" : ""}${delta}` };
    if (delta !== 0 || customActivity) {
      setActivityLog((current) => ({ ...current, [id]: [{ id: Date.now(), ...act }, ...(current[id] || [])] }));
    }
    if (newScore !== null) {
      leadsAPI.update(id, { score: newScore }).catch((error) => console.error("Failed to sync score", error));
    }
  }, [leads]);

  const handleSort = (column) => {
    if (sortBy === column) setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const query = search.trim().toLowerCase();
      if (query) {
        const targets = {
          all: [lead.name, lead.company, lead.email, lead.phone, lead.address || "", lead.assignee].join(" ").toLowerCase(),
          name: lead.name.toLowerCase(),
          email: lead.email.toLowerCase(),
          phone: lead.phone.toLowerCase(),
          address: (lead.address || "").toLowerCase(),
          score: String(lead.score),
        };
        if (!targets[searchField]?.includes(query)) return false;
      }
      if (filters.status !== "All" && lead.status !== filters.status) return false;
      if (filters.source !== "All" && lead.source !== filters.source) return false;
      if (filters.assignee !== "All" && lead.assignee !== filters.assignee) return false;
      if (filters.createdDateFrom && lead.createdDate < filters.createdDateFrom) return false;
      if (filters.createdDateTo && lead.createdDate > filters.createdDateTo) return false;
      if (filters.followUpDateFrom && (!lead.followUpDate || lead.followUpDate < filters.followUpDateFrom)) return false;
      const today = todayStr();
      if (filters.followUp === "today" && lead.followUpDate !== today) return false;
      if (filters.followUp === "overdue" && lead.followUpDate >= today) return false;
      if (filters.followUp === "upcoming" && lead.followUpDate <= today) return false;
      if (filters.followUpDateTo && (!lead.followUpDate || lead.followUpDate > filters.followUpDateTo)) return false;
      if (filters.lastContactedDays && lead.lastContacted) {
        const daysSince = Math.floor((new Date() - new Date(lead.lastContacted)) / (1000 * 60 * 60 * 24));
        if (daysSince > parseInt(filters.lastContactedDays, 10)) return false;
      }
      if (filters.respondedTo !== "All" && lead.respondedTo !== filters.respondedTo.toLowerCase()) return false;
      if (filters.city && !lead.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.state && !lead.state?.toLowerCase().includes(filters.state.toLowerCase())) return false;
      if (filters.zip && !lead.zip?.toLowerCase().includes(filters.zip.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      let av = a[sortBy] ?? "";
      let bv = b[sortBy] ?? "";
      if (sortBy === "score") {
        av = a.score;
        bv = b.score;
      }
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [filters, leads, search, searchField, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => setPage(1), [search, filters, rowsPerPage]);

  const allOnPageSel = paginated.length > 0 && paginated.every((lead) => selected.has(lead.id));
  const toggleAll = () => {
    if (allOnPageSel) {
      setSelected((current) => {
        const next = new Set(current);
        paginated.forEach((lead) => next.delete(lead.id));
        return next;
      });
      return;
    }
    setSelected((current) => {
      const next = new Set(current);
      paginated.forEach((lead) => next.add(lead.id));
      return next;
    });
  };

  const toggleOne = (id) => setSelected((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleApplyFilters = (nextFilters) => setFilters(nextFilters);
  const handleClearFilters = () => setFilters({ status: "All", source: "All", assignee: "All", createdDateFrom: "", createdDateTo: "", followUpDateFrom: "", followUpDateTo: "", lastContactedDays: "", respondedTo: "All", city: "", state: "", country: "", zip: "" });
  const hasActiveFilters = search || activeFilterCount > 0;
  const handleAddLeadType = (leadType) => (leadType.key === "import" ? setShowImport(true) : setCreateLeadType(leadType));

  const handleCreateLead = async (newLead) => {
    try {
      const created = await leadsAPI.create(newLead);
      setLeads((current) => [created, ...current]);
      setActivityLog((current) => ({ ...current, [created.id]: [{ id: Date.now(), type: "created", date: todayStr(), time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), notes: "Lead created" }] }));
    } catch (error) {
      console.error("Failed to create lead", error);
    }
  };

  return (
    <div className="page">
      <div className="stat-grid">
        {STAT_CARDS.map(({ label, key, icon, alert, c }, index) => <StatCard key={label} label={label} value={stats[key] ?? 0} change="" icon={icon} alert={alert} c={c} delay={`${index * 0.07}s`} />)}
      </div>

      <div className="toolbar">
        <div className="toolbar-mid">
          <button className={`btn-ghost ${activeFilterCount > 0 ? "btn-ghost--active" : ""}`} onClick={() => setShowFilter(true)}><IFilter s={12} />&ensp;Filter{activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}</button>
          <div className="toolbar-divider" />
          <AddLeadDropdown onSelectType={handleAddLeadType} />
          <div className="toolbar-divider" />
          <div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "white" }}>
            {[{ k: "list", l: "List", I: IRows }, { k: "kanban", l: "Kanban", I: IKanban }].map(({ k, l, I }) => (
              <button key={k} onClick={() => setViewMode(k)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", border: "none", borderRight: k === "list" ? "1px solid #e5e7eb" : "none", background: viewMode === k ? "#eef2ff" : "transparent", color: viewMode === k ? "#4f46e5" : "#6b7280", fontSize: "13.5px", fontWeight: viewMode === k ? 700 : 500, cursor: "pointer" }}><I s={13} />{l}</button>
            ))}
          </div>
          <div className="toolbar-divider" />
          <div className="unified-search"><div className="search-wrap"><span className="search-ico"><ISearch s={14} c="#9ca3af" /></span><input type="text" className="search-inp unified-inp" placeholder="Search leads…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
          <div className="toolbar-divider" />
          <button className={`icon-btn-outline ${showChart ? "icon-btn-outline--on" : ""}`} onClick={() => setShowChart(!showChart)} title="View Performance Chart"><BarChart3 size={14} /></button>
        </div>
      </div>

      {hasActiveFilters && <div className="chips-bar">{search && <span className="chip">Search: &ldquo;{search}&rdquo;<button className="chip-x" onClick={() => setSearch("")}><IX s={9} c="#4f46e5" /></button></span>}{filters.status !== "All" && <span className="chip"><span className="chip-dot" style={{ background: STATUS_META[filters.status]?.dot }} />Status: {filters.status}<button className="chip-x" onClick={() => setFilters({ ...filters, status: "All" })}><IX s={9} c="#4f46e5" /></button></span>}{filters.source !== "All" && <span className="chip">Source: {filters.source}<button className="chip-x" onClick={() => setFilters({ ...filters, source: "All" })}><IX s={9} c="#4f46e5" /></button></span>}{filters.assignee !== "All" && <span className="chip">Owner: {filters.assignee}<button className="chip-x" onClick={() => setFilters({ ...filters, assignee: "All" })}><IX s={9} c="#4f46e5" /></button></span>}<button className="chip-clearall" onClick={() => { setSearch(""); handleClearFilters(); }}>Clear all</button></div>}

      {selected.size > 0 && <div className="bulk-bar"><span className="bulk-cnt">{selected.size} selected</span><button className="bulk-btn">Assign Owner</button><button className="bulk-btn">Change Status</button><button className="bulk-btn bulk-btn--danger">Delete</button><button className="bulk-close" onClick={() => setSelected(new Set())}><IX s={12} c="#6b7280" /></button></div>}

      {viewMode === "kanban" && <><div className="kanban-toolbar"><label>Group by:</label><select value={kanbanGroupBy} onChange={(event) => setKanbanGroupBy(event.target.value)}><option value="status">Status</option><option value="followUpDate">Follow-Up</option><option value="source">Source</option><option value="assignee">Assignee</option></select></div><KanbanBoard leads={filtered} groupBy={kanbanGroupBy} onUpdateLead={updateLead} onOpenDetails={fetchLeadDetail} onAdjustScore={adjustScore} /></>}

      {viewMode === "list" && (
        <div className="table-card">
          <div className="table-scroll">
            <table className={`table ${wrapText ? "table--wrap" : ""}`}>
              <thead>
                <tr className="thead-row">
                  <th className="th th-check"><input type="checkbox" className="cb" checked={allOnPageSel} onChange={toggleAll} /></th>
                  {activeCols.map((col) => <th key={col.key} className={`th th-${col.key} ${sortBy === col.key ? "th--sorted" : ""}`} onClick={() => handleSort(col.key)}><span className="th-inner">{col.label}<SortIcon sortBy={sortBy} sortDir={sortDir} col={col.key} /></span></th>)}
                  <th className="th th-actions" style={{ textAlign: "right", paddingRight: "10px" }}><button className={`icon-btn-outline ${showColPanel ? "icon-btn-outline--on" : ""}`} onClick={() => setShowColPanel(true)} title="Manage Columns" style={{ padding: "4px 6px", marginLeft: "45px" }}><ISettings s={13} /></button></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? <tr><td colSpan={activeCols.length + 2}><div className="empty-state"><ISearch s={32} c="#d1d5db" /><p>No leads match your filters</p><span>Try adjusting your search or clearing active filters</span></div></td></tr> : paginated.map((lead, index) => {
                  const initials = getInitials(lead.name);
                  const isSel = selected.has(lead.id);
                  return (
                    <tr key={lead.id} className={`row ${isSel ? "row--sel" : ""}`} style={{ animationDelay: `${index * 0.02}s` }}>
                      <td className="td td-check"><input type="checkbox" className="cb" checked={isSel} onChange={() => toggleOne(lead.id)} /></td>
                      {activeCols.map((col) => {
                        switch (col.key) {
                          case "name":
                            return <td key="name" className="td td-name"><div className="name-cell"><div className="avatar" style={{ background: lead.avatarBg }}>{initials}</div><div className="name-block"><button className="name-link" onClick={() => fetchLeadDetail(lead.id)}>{lead.name}</button></div></div></td>;
                          case "status":
                            return <td key="status" className="td td-status"><StatusCell value={lead.status} onChange={(value) => updateLead(lead.id, "status", value)} /></td>;
                          case "followUp":
                            return <td key="followUp" className="td td-followup"><FollowUpCell value={lead.followUpDate} onChange={(value) => updateLead(lead.id, "followUpDate", value)} /></td>;
                          case "phone":
                            return <td key="phone" className="td"><a href={`tel:${lead.phone}`} className="link-cell">{lead.phone}</a></td>;
                          case "email":
                            return <td key="email" className="td"><a href={`mailto:${lead.email}`} className="link-cell">{lead.email}</a></td>;
                          case "company":
                            return <td key="company" className="td"><span className="cell-txt">{lead.company}</span></td>;
                          case "source":
                            return <td key="source" className="td"><span className="pill">{lead.source}</span></td>;
                          case "score":
                            return <td key="score" className="td td-score"><ScoreBar score={lead.score} onAdjust={(delta) => adjustScore(lead.id, delta)} /></td>;
                          case "assignee":
                            return <td key="assignee" className="td"><div className="owner-cell"><div className="owner-av" style={{ background: lead.avatarBg }}>{getInitials(lead.assignee)}</div><span className="cell-txt">{lead.assignee}</span></div></td>;
                          case "createdDate":
                            return <td key="createdDate" className="td"><span className="date-txt">{fmtDate(lead.createdDate)}</span></td>;
                          case "deposits":
                            return <td key="deposits" className="td"><span className="cell-txt">{lead.deposits}</span></td>;
                          case "assignedToUserId":
                            return <td key="assignedToUserId" className="td"><span className="cell-txt">{lead.assignedToUserId}</span></td>;
                          case "comments":
                            return <td key="comments" className="td"><span className="cell-txt">{lead.comments}</span></td>;
                          case "whatsappEnabled":
                            return <td key="whatsappEnabled" className="td"><span className="cell-txt">{lead.whatsappEnabled ? "Yes" : "No"}</span></td>;
                          default:
                            return null;
                        }
                      })}
                      <td className="td td-actions"><div className="row-acts"><button className="act-btn" title="Call"><IPhone s={12} /></button><button className="act-btn" title="Email"><IMail s={12} /></button><button className="act-btn act-btn--edit" title="Edit" onClick={() => setEditLead(lead)}><IEdit s={12} /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination"><span className="pg-info">{filtered.length === 0 ? "No records" : `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)} of ${filtered.length} records`}</span><div className="pg-btns"><button className="pg-btn" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><IChevL s={12} />Prev</button>{Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => Math.abs(value - page) <= 2 || value === 1 || value === totalPages).reduce((acc, value, index, arr) => { if (index > 0 && value - arr[index - 1] > 1) acc.push(<span key={`e${value}`} className="pg-ellipsis">…</span>); acc.push(<button key={value} className={`pg-btn pg-num ${page === value ? "pg-num--on" : ""}`} onClick={() => setPage(value)}>{value}</button>); return acc; }, [])}<button className="pg-btn" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>Next<IChevR s={12} /></button></div></div>
        </div>
      )}

      {showColPanel && <ManageColumnsPanel visibleCols={visibleCols} setVisibleCols={setVisibleCols} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} wrapText={wrapText} setWrapText={setWrapText} onClose={() => setShowColPanel(false)} />}
      {detailsLead && <LeadDetailsModal lead={detailsLead} onClose={() => setDetailsLead(null)} />}
      {editLead && <EditModal lead={editLead} onClose={() => setEditLead(null)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={(newLeads) => setLeads((current) => [...current, ...newLeads])} />}
      {showFilter && <FilterModal onClose={() => setShowFilter(false)} filters={filters} activeFilterCount={activeFilterCount} onApply={handleApplyFilters} />}
      {createLeadType && <CreateLeadModal leadType={createLeadType} onClose={() => setCreateLeadType(null)} onSave={handleCreateLead} />}
      {showChart && <LeadsPerformanceChart onClose={() => setShowChart(false)} leads={leads} />}
    </div>
  );
}
