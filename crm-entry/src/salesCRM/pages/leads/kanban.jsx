import { useEffect, useMemo, useRef, useState } from "react";
import { User } from "lucide-react";
import { STATUS_LIST, STATUS_META } from "./constants";
import { formatLeadSource, formatStatus, getInitials, getScoreTier } from "./utils";

export function KanbanBoard({ leads, groupBy, setGroupBy, onUpdateLead, onOpenDetails }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const boardRef = useRef(null);
  const dragScrollRef = useRef({ direction: 0, rafId: null });

  const grouped = useMemo(() => {
    if (groupBy === "status") {
      return STATUS_LIST.reduce((acc, status) => {
        acc[status] = leads.filter((lead) => (lead.status || STATUS_LIST[0]) === status);
        return acc;
      }, {});
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
            <option value="assignee">Assignee</option>
            <option value="source">Source</option>
          </select>
        </div>
      </div>
      <div className="kanban-board" ref={boardRef} onDragOver={handleBoardDragOver} onDragEnd={stopAutoScroll} onDrop={stopAutoScroll}>
        {columnKeys.map((columnKey) => {
          const meta = groupBy === "status" ? STATUS_META[columnKey] || { color: "#374151", bg: "#f3f4f6" } : { color: "#374151", bg: "#f3f4f6" };
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
                  onUpdateLead(draggedId, groupBy, columnKey);
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
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
