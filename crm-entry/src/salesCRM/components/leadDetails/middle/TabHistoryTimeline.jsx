import { useMemo, useState } from "react";
import { fmtDate, fmtTime } from "../shared";

function HistoryTooltip({ item }) {
  const lines = [item?.meta, item?.preview].filter(Boolean).join("\n\n").trim();
  const isCall = item?.kind === "calls";
  const duration = Number(item?.durationMinutes || 0);
  const hasDuration = isCall && Number.isFinite(duration) && duration > 0;
  const normalized = hasDuration ? Math.min(1, duration / 60) : 0;
  const graphBars = [0.25, 0.4, 0.55, 0.7, 0.85].map((factor) => Math.max(0.15, factor * normalized));
  if (!lines && !hasDuration) return null;
  return (
    <div style={{ position: "absolute", left: "calc(100% + 14px)", top: 0, width: 280, padding: "12px 14px", borderRadius: 16, border: "1px solid #dbe4f0", background: "rgba(255,255,255,0.98)", boxShadow: "0 24px 50px rgba(15, 23, 42, 0.14)", color: "#334155", fontSize: 12.5, lineHeight: 1.6, whiteSpace: "pre-wrap", zIndex: 8, pointerEvents: "none" }}>
      {lines ? <div>{lines}</div> : null}
      {hasDuration ? (
        <div style={{ marginTop: lines ? 12 : 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>Call duration</div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "flex-end", gap: 4, height: 32 }}>
            {graphBars.map((height, idx) => (
              <div key={idx} style={{ width: 10, height: Math.max(6, Math.round(height * 32)), borderRadius: 6, background: "#bfdbfe" }} />
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>{duration} min</div>
        </div>
      ) : null}
    </div>
  );
}

export default function TabHistoryTimeline({ items, emptyLabel, icon: Icon }) {
  const [hoveredId, setHoveredId] = useState(null);
  const groups = useMemo(() => {
    const sortedItems = [...items].sort((a, b) => {
      const aTime = a?.date ? new Date(a.date).getTime() : 0;
      const bTime = b?.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });

    return sortedItems.reduce((acc, item) => {
      const date = item?.date ? new Date(item.date) : null;
      const key = date && !Number.isNaN(date.getTime()) ? fmtDate(date, false) : "Unknown date";
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [items]);

  if (!items.length) {
    return (
      <div style={{ border: "1px dashed #dbe4f0", borderRadius: 18, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "32px 18px" }}>
        No {emptyLabel} history available.
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: 22, background: "#ffffff", padding: "18px 16px 10px", overflow: "visible", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: "#eef4ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={17} />
        </div>
      </div>
      {Object.entries(groups).map(([date, group]) => (
        <div key={date} style={{ marginBottom: 18 }}>
          <div style={{ position: "relative", paddingBottom: 12 }}>
            <div style={{ position: "absolute", left: 117, top: "calc(100% - 1px)", width: 1, height: 13, background: "#dbe4f0" }} />
            <div style={{ display: "inline-flex", minWidth: 132, justifyContent: "center", marginLeft: 38, padding: "8px 14px", border: "1px solid #dbe4f0", borderRadius: 8, background: "#f8fbff", fontSize: 12, fontWeight: 700, color: "#475569" }}>{date}</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 117, top: 0, bottom: 0, width: 1, background: "#dbe4f0" }} />
            {group.map((item, idx) => {
              const active = hoveredId === item.id;
              return (
                <div
                  key={`${item.id}-${idx}`}
                  style={{ display: "grid", gridTemplateColumns: "82px 44px minmax(0, 1fr)", gap: 12, alignItems: "start", paddingBottom: 20 }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textAlign: "right", paddingTop: 10 }}>{fmtTime(item?.date)}</div>
                  <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #dbe4f0", background: active ? "#eef4ff" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", position: "relative", zIndex: 1 }}>
                      <Icon size={15} />
                    </div>
                  </div>
                  <div style={{ position: "relative", paddingTop: 7, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b", lineHeight: 1.4, wordBreak: "break-word" }}>{item.title}</div>
                    {item.description ? <div style={{ marginTop: 2, fontSize: 13, lineHeight: 1.5, color: "#334155", wordBreak: "break-word" }}>{item.description}</div> : null}
                    {item.author ? <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.4, color: "#64748b", wordBreak: "break-word" }}>{`by ${item.author}`}</div> : null}
                    {active ? <HistoryTooltip item={item} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
