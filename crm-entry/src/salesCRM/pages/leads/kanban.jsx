import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, User } from "lucide-react";
import { STATUS_LIST, STATUS_META } from "./constants";
import { formatLeadSource, formatStatus, getFollowUpLabel, getInitials, getScoreTier, offsetDay, todayStr } from "./utils";
import { IX } from "./shared";

export function KanbanBoard({ leads, groupBy, setGroupBy, onUpdateLead, onOpenDetails }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [pendingFollowUpDrop, setPendingFollowUpDrop] = useState(null);
  const boardRef = useRef(null);
  const dragScrollRef = useRef({ direction: 0, rafId: null });
  const followUpColumns = ["Past Follow-Ups", "Today", "Tomorrow", "Upcoming", "No Follow Up"];
  const followUpMeta = {
    "Past Follow-Ups": { color: "#dc2626", bg: "#fee2e2" },
    Today: { color: "#ea580c", bg: "#ffedd5" },
    Tomorrow: { color: "#16a34a", bg: "#dcfce7" },
    Upcoming: { color: "#2563eb", bg: "#dbeafe" },
    "No Follow Up": { color: "#64748b", bg: "#e2e8f0" },
  };

  const grouped = useMemo(() => {
    if (groupBy === "status") {
      return STATUS_LIST.reduce((acc, status) => {
        acc[status] = leads.filter((lead) => (lead.status || STATUS_LIST[0]) === status);
        return acc;
      }, {});
    }

    if (groupBy === "followUpDate") {
      const map = followUpColumns.reduce((acc, label) => {
        acc[label] = [];
        return acc;
      }, {});
      const today = todayStr();
      const tomorrow = offsetDay(1);
      leads.forEach((lead) => {
        if (!lead.followUpDate) map["No Follow Up"].push(lead);
        else if (lead.followUpDate < today) map["Past Follow-Ups"].push(lead);
        else if (lead.followUpDate === today) map.Today.push(lead);
        else if (lead.followUpDate === tomorrow) map.Tomorrow.push(lead);
        else map.Upcoming.push(lead);
      });
      return map;
    }

    const map = {};
    leads.forEach((lead) => {
      let key = lead[groupBy];
      if (!key) key = "Unknown";
      if (!map[key]) map[key] = [];
      map[key].push(lead);
    });
    return map;
  }, [groupBy, leads]);

  const columnKeys = useMemo(() => {
    if (groupBy === "status") return STATUS_LIST;
    if (groupBy === "followUpDate") return followUpColumns;
    return Object.keys(grouped);
  }, [groupBy, grouped]);

  useEffect(() => () => {
    if (dragScrollRef.current.rafId) cancelAnimationFrame(dragScrollRef.current.rafId);
  }, []);

  const stopAutoScroll = () => {
    dragScrollRef.current.direction = 0;
    if (dragScrollRef.current.rafId) {
      cancelAnimationFrame(dragScrollRef.current.rafId);
      dragScrollRef.current.rafId = null;
    }
  };

  const startAutoScroll = (direction) => {
    if (!boardRef.current) return;
    dragScrollRef.current.direction = direction;
    if (dragScrollRef.current.rafId) return;

    const tick = () => {
      const board = boardRef.current;
      if (!board || !dragScrollRef.current.direction) {
        dragScrollRef.current.rafId = null;
        return;
      }
      board.scrollLeft += dragScrollRef.current.direction * 18;
      dragScrollRef.current.rafId = requestAnimationFrame(tick);
    };

    dragScrollRef.current.rafId = requestAnimationFrame(tick);
  };

  const handleBoardDragOver = (event) => {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const edge = 96;
    if (event.clientX > rect.right - edge) startAutoScroll(1);
    else if (event.clientX < rect.left + edge) startAutoScroll(-1);
    else stopAutoScroll();
  };

  const commitFollowUpDrop = (leadId, date) => {
    if (!date) return;
    onUpdateLead(leadId, "followUpDate", date);
    setPendingFollowUpDrop(null);
    setDraggedId(null);
    setDragOverCol(null);
  };

  const isSourceReadOnly = groupBy === "source";

  return (
    <>
      <div className="kanban-toolbar">
        <div className="kanban-toolbar__title-wrap">
          <div className="kanban-toolbar__eyebrow">KANBAN VIEW</div>
          <div className="kanban-toolbar__title-row">
            <div className="kanban-toolbar__label">Group by</div>
            <div className="kanban-toolbar__hint">Organize lanes by the workflow that matters most right now.</div>
          </div>
        </div>
        <div className="kanban-toolbar__control">
          <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
            <option value="status">Status</option>
            <option value="followUpDate">Follow-Up</option>
            <option value="assignee">Assignee</option>
            <option value="source">Source</option>
          </select>
        </div>
      </div>
      <div className="kanban-board" ref={boardRef} onDragOver={handleBoardDragOver} onDragEnd={stopAutoScroll} onDrop={stopAutoScroll}>
        {columnKeys.map((columnKey) => {
          const meta = groupBy === "status" ? STATUS_META[columnKey] || { color: "#374151", bg: "#f3f4f6" } : groupBy === "followUpDate" ? followUpMeta[columnKey] || { color: "#374151", bg: "#f3f4f6" } : { color: "#374151", bg: "#f3f4f6" };
          const colLeads = grouped[columnKey] || [];
          const isOver = dragOverCol === columnKey;

          return (
            <div
              key={columnKey}
              className={`kanban-column ${isOver ? "kanban-column--over" : ""}`}
              style={{ "--kanban-accent": meta.color, "--kanban-accent-bg": meta.bg }}
              onDragOver={(event) => {
                if (isSourceReadOnly) return;
                event.preventDefault();
                setDragOverCol(columnKey);
              }}
              onDragLeave={() => { if (!isSourceReadOnly) setDragOverCol(null); }}
              onDrop={(event) => {
                if (isSourceReadOnly) return;
                event.preventDefault();
                if (draggedId) {
                  let nextValue = columnKey;
                  if (groupBy === "followUpDate") {
                    if (columnKey === "Past Follow-Ups") {
                      setPendingFollowUpDrop({ leadId: draggedId, lane: columnKey, suggestedDate: offsetDay(-1), min: "", max: todayStr() });
                      stopAutoScroll();
                      return;
                    }
                    if (columnKey === "Upcoming") {
                      setPendingFollowUpDrop({ leadId: draggedId, lane: columnKey, suggestedDate: offsetDay(3), min: offsetDay(2), max: "" });
                      stopAutoScroll();
                      return;
                    }
                    if (columnKey === "Today") nextValue = todayStr();
                    else if (columnKey === "Tomorrow") nextValue = offsetDay(1);
                    else if (columnKey === "No Follow Up") nextValue = "";
                  }
                  onUpdateLead(draggedId, groupBy, nextValue);
                }
                setDraggedId(null);
                setDragOverCol(null);
                stopAutoScroll();
              }}
            >
              <div className="kanban-column__header">
                <div>
                  <div className="kanban-column__label">{groupBy === "status" ? formatStatus(columnKey) : groupBy === "source" ? formatLeadSource(columnKey) : columnKey}</div>
                  <div className="kanban-column__sub">{isSourceReadOnly ? "Read-only lane grouping" : "Drag and drop leads into this lane"}</div>
                </div>
                <span className="kanban-column__count">{colLeads.length}</span>
              </div>

              <div className="kanban-column__list">
                {colLeads.map((lead) => {
                  const initials = getInitials(lead.name);
                  const tier = getScoreTier(lead.score);
                  const scoreColors = { high: "#059669", mid: "#d97706", low: "#dc2626" };
                  const scoreBackgrounds = { high: "#d1fae5", mid: "#fef3c7", low: "#fee2e2" };

                  return (
                    <div key={lead.id} className={`kanban-card ${draggedId === lead.id ? "kanban-card--dragging" : ""}`} draggable={!isSourceReadOnly} onDragStart={(event) => { if (isSourceReadOnly) return; setDraggedId(lead.id); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { stopAutoScroll(); setDraggedId(null); setDragOverCol(null); }}>
                      <div className="kanban-card__top">
                        <div className="kanban-card__identity">
                          <div className="kanban-card__avatar" style={{ background: lead.avatarBg }}>{initials}</div>
                          <div className="kanban-card__identity-text">
                            <button type="button" className="kanban-card__name" onClick={(event) => { event.stopPropagation(); onOpenDetails(lead.id); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                              {lead.name}
                            </button>
                            <div className="kanban-card__company">{lead.company}</div>
                          </div>
                        </div>
                        <div className="kanban-card__score" style={{ background: scoreBackgrounds[tier], color: scoreColors[tier] }}>{lead.score}</div>
                      </div>

                      <div className="kanban-card__meta"><User size={10} /><span>{lead.assignee}</span></div>
                      {lead.followUpDate && (() => {
                        const info = getFollowUpLabel(lead.followUpDate);
                        const color = info.type === "overdue" ? "#dc2626" : info.type === "today" ? "#d97706" : info.type === "tomorrow" ? "#0284c7" : "#6b7280";
                        return <div className="kanban-card__followup" style={{ color }}><Calendar size={10} />{info.label}</div>;
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {pendingFollowUpDrop && (
        <div className="overlay" onClick={() => setPendingFollowUpDrop(null)}>
          <div className="modal" style={{ width: 304, borderRadius: 14 }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-hdr">
              <div><div className="modal-title">Set Follow-Up Date</div></div>
              <button className="icon-btn modal-close" onClick={() => setPendingFollowUpDrop(null)}><IX s={15} /></button>
            </div>
            <div className="modal-body" style={{ padding: "14px", display: "grid" }}>
              <input type="date" value={pendingFollowUpDrop.suggestedDate} min={pendingFollowUpDrop.min || undefined} max={pendingFollowUpDrop.max || undefined} className="kanban-followup-date-input" onChange={(event) => setPendingFollowUpDrop((current) => ({ ...current, suggestedDate: event.target.value }))} />
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setPendingFollowUpDrop(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => commitFollowUpDrop(pendingFollowUpDrop.leadId, pendingFollowUpDrop.suggestedDate)} disabled={!pendingFollowUpDrop.suggestedDate}>Save Date</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
