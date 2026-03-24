import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  fmtCurrency,
  fmtDate,
  formatStageLabel,
  getAccountName,
  getContactName,
  getCreatedTime,
  getDealId,
  getDealTitle,
  getDealType,
  normalizeAmount,
  normalizeClosingDate,
  normalizeStage,
  STAGE_META,
  STAGE_ORDER,
} from "./shared";

function DealKanbanCard({ deal, stage, onOpenDeal, onDeleteDeal, draggable = false, isDragging = false, onDragStart, onDragEnd }) {
  return (
    <div
      className={`kanban-card ${isDragging ? "kanban-card--dragging" : ""}`}
      style={{ position: "relative", paddingRight: 36 }}
      draggable={draggable}
      onDragStart={draggable ? (event) => {
        event.dataTransfer.setData("text/plain", String(getDealId(deal)));
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(event);
      } : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      <button
        type="button"
        aria-label="Delete deal"
        onClick={(event) => {
          event.stopPropagation();
          onDeleteDeal(deal);
        }}
        style={{ position: "absolute", top: 8, right: 8, border: "none", background: "color-mix(in srgb, var(--bg-card) 92%, #ffffff)", cursor: "pointer", padding: 2, borderRadius: 6, boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)" }}
      >
        <Trash2 size={15} />
      </button>
      <div style={{ display: "grid", gap: 8 }}>
        <button type="button" onClick={() => onOpenDeal(deal)} style={{ border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer", minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {getDealTitle(deal)}
          </div>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(79,70,229,0.12)", color: "#4f46e5" }}>
            {formatStageLabel(stage)}
          </span>
          {getDealType(deal) !== "-" ? <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "color-mix(in srgb, var(--bg-card) 78%, #ffffff)", color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>{getDealType(deal)}</span> : null}
          {deal.priority ? <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "color-mix(in srgb, var(--bg-card) 78%, #ffffff)", color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>{deal.priority}</span> : null}
        </div>

        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Account · {getAccountName(deal)}</div>
          <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Contact · {getContactName(deal)}</div>
          <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Owner · {deal.dealOwner || "-"}</div>
        </div>

        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Next Step · {deal.nextStep || "-"}</div>
          <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>
            {draggable ? `Source · ${deal.leadSource || "-"}` : `Next Activity · ${deal.nextActivity || "-"}`}
          </div>
        </div>

        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--text-main) 68%, #94a3b8)", whiteSpace: "nowrap" }}>
            {draggable ? "Expected" : "Amount"}: <strong style={{ color: "var(--text-main)" }}>{fmtCurrency(draggable ? deal.expectedRevenue || 0 : normalizeAmount(deal))}</strong>
          </div>
          {draggable ? <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>Created: {fmtDate(getCreatedTime(deal))}</div> : <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--text-main) 68%, #94a3b8)", whiteSpace: "nowrap" }}>Expected: <strong style={{ color: "var(--text-main)" }}>{fmtCurrency(deal.expectedRevenue || 0)}</strong></div>}
          <div style={{ fontSize: 12, color: "#ef4444", whiteSpace: "nowrap" }}>Closing: {fmtDate(normalizeClosingDate(deal))}</div>
        </div>
      </div>
    </div>
  );
}

export function DealsKanban({ deals, onOpenDeal, onDeleteDeal }) {
  const grouped = useMemo(() => STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter((deal) => normalizeStage(deal) === stage);
    return acc;
  }, {}), [deals]);

  return (
    <div className="kanban-board">
      {STAGE_ORDER.map((stage) => {
        const items = grouped[stage] || [];
        const totalAmount = items.reduce((sum, deal) => sum + normalizeAmount(deal), 0);
        const meta = STAGE_META[stage] || { color: "#334155", bg: "#e2e8f0" };
        return (
          <div key={stage} className="kanban-column" style={{ "--kanban-accent": meta.color, "--kanban-accent-bg": meta.bg, display: "flex", flexDirection: "column", height: 560 }}>
            <div className="kanban-column__header" style={{ alignItems: "flex-start" }}>
              <div>
                <div className="kanban-column__label">{formatStageLabel(stage)}</div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "color-mix(in srgb, var(--text-main) 84%, #94a3b8)" }}>{fmtCurrency(totalAmount)}</div>
              </div>
              <span className="kanban-column__count">{items.length}</span>
            </div>
            <div className="kanban-column__list" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
              {!items.length ? <div className="kanban-card" style={{ borderStyle: "dashed", color: "color-mix(in srgb, var(--text-main) 60%, #94a3b8)" }}>No deals in this stage</div> : items.map((deal) => (
                <DealKanbanCard key={getDealId(deal) || `${getDealTitle(deal)}-${normalizeClosingDate(deal) || "none"}`} deal={deal} stage={stage} onOpenDeal={onOpenDeal} onDeleteDeal={onDeleteDeal} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DealsKanbanBoard({ deals, onOpenDeal, onDeleteDeal, onStageDrop }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const boardRef = useRef(null);
  const dragScrollRef = useRef({ direction: 0, rafId: null });
  const grouped = useMemo(() => STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter((deal) => normalizeStage(deal) === stage);
    return acc;
  }, {}), [deals]);

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

  return (
    <div className="kanban-board" ref={boardRef} onDragOver={handleBoardDragOver} onDragEnd={stopAutoScroll} onDrop={stopAutoScroll}>
      {STAGE_ORDER.map((stage) => {
        const items = grouped[stage] || [];
        const totalExpected = items.reduce((sum, deal) => sum + Number(deal.expectedRevenue || 0), 0);
        const meta = STAGE_META[stage] || { color: "#334155", bg: "#e2e8f0" };
        const isOver = dragOverStage === stage;

        return (
          <div
            key={stage}
            className={`kanban-column ${isOver ? "kanban-column--over" : ""}`}
            style={{ "--kanban-accent": meta.color, "--kanban-accent-bg": meta.bg, display: "flex", flexDirection: "column", height: 560 }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(event) => {
              event.preventDefault();
              const dealId = Number(event.dataTransfer.getData("text/plain") || 0);
              if (dealId) onStageDrop?.(dealId, stage);
              setDraggedId(null);
              setDragOverStage(null);
              stopAutoScroll();
            }}
          >
            <div className="kanban-column__header" style={{ alignItems: "flex-start" }}>
              <div>
                <div className="kanban-column__label">{formatStageLabel(stage)}</div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "color-mix(in srgb, var(--text-main) 84%, #94a3b8)" }}>{fmtCurrency(totalExpected)}</div>
              </div>
              <span className="kanban-column__count">{items.length}</span>
            </div>
            <div className="kanban-column__list" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
              {!items.length ? <div className="kanban-card" style={{ borderStyle: "dashed", color: "color-mix(in srgb, var(--text-main) 60%, #94a3b8)" }}>No deals in this stage</div> : items.map((deal) => (
                <DealKanbanCard
                  key={getDealId(deal) || `${getDealTitle(deal)}-${getCreatedTime(deal) || "none"}`}
                  deal={deal}
                  stage={stage}
                  onOpenDeal={onOpenDeal}
                  onDeleteDeal={onDeleteDeal}
                  draggable
                  isDragging={draggedId === getDealId(deal)}
                  onDragStart={() => setDraggedId(getDealId(deal))}
                  onDragEnd={() => {
                    stopAutoScroll();
                    setDraggedId(null);
                    setDragOverStage(null);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
