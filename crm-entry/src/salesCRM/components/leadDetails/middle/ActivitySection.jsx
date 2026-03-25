import { useMemo } from "react";
import { Calendar, FileText, Phone } from "lucide-react";
import { formatStatus } from "../../../pages/leads/utils";
import { fmtDate, hasValue } from "../shared";

const hasDisplayDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

function Lane({ title, Icon, items, stacked = false, mobile = false }) {
  const LaneIcon = Icon;
  const sortedItems = useMemo(() => [...items].sort((a, b) => {
    const aTime = a?.date ? new Date(a.date).getTime() : 0;
    const bTime = b?.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  }), [items]);
  const showRightDivider = stacked ? true : title !== "Calls";

  return (
    <div style={{ minWidth: 0, flex: stacked ? "0 0 auto" : "1 1 0", minHeight: stacked && !mobile ? 188 : 0, maxHeight: stacked && !mobile ? 240 : "none", display: "flex", flexDirection: "column", overflow: "hidden", border: stacked ? "1.5px solid #cfddeb" : "none", borderRight: stacked ? "1.5px solid #cfddeb" : showRightDivider ? "1px solid #dde7f1" : "none", borderBottom: stacked ? "1.5px solid #cfddeb" : "none", borderRadius: stacked ? 18 : 0, background: "#ffffff", boxShadow: stacked ? "0 0 0 1px rgba(207, 221, 235, 0.34), 0 10px 24px rgba(148, 163, 184, 0.08)" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: stacked ? "16px 16px 14px" : "12px 14px", borderBottom: "1px solid #edf3f9", background: "#fbfdff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: stacked ? 36 : 28, height: stacked ? 36 : 28, borderRadius: stacked ? 10 : 8, background: "#ffffff", border: "1.5px solid #c9d9ea", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><LaneIcon size={stacked ? 16 : 14} /></div>
          <div style={{ fontSize: stacked ? 15 : 13.5, fontWeight: 800, color: "#1e293b" }}>{title}</div>
        </div>
        <div style={{ minWidth: stacked ? 30 : 24, height: stacked ? 30 : 24, padding: stacked ? "0 9px" : "0 7px", borderRadius: 999, background: "#ffffff", border: "1.5px solid #c9d9ea", color: "#475569", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: stacked ? 12.5 : 12, fontWeight: 800 }}>{items.length}</div>
      </div>
      <div style={{ flex: stacked && !mobile ? 1 : "0 0 auto", minHeight: stacked && !mobile ? 126 : 0, overflowY: stacked && !mobile ? "auto" : "visible", padding: stacked ? "16px" : "12px" }}>
        {!items.length ? (
          <div style={{ minHeight: stacked ? 84 : 92, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed #b4c7dc", borderRadius: 12, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: stacked ? "16px 12px" : 0 }}>No records found</div>
        ) : sortedItems.map((item) => (
          <div key={item.id} style={{ padding: stacked ? "0 0 14px" : "0 0 12px", marginBottom: stacked ? 14 : 12, borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: stacked ? 14 : 13.5, fontWeight: 800, color: "#334155" }}>{item.title}</div>
            {hasDisplayDate(item.date) ? <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>{fmtDate(item.date)}</div> : null}
            {hasValue(item.status) ? <div style={{ marginTop: 5, fontSize: 11.5, color: "#94a3b8" }}>{formatStatus(item.status)}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActivitySection({ items, stacked = false, mobile = false }) {
  const tasks = items.filter((x) => String(x.type).toLowerCase().includes("task"));
  const meetings = items.filter((x) => String(x.type).toLowerCase().includes("meeting"));
  const calls = items.filter((x) => String(x.type).toLowerCase().includes("call"));
  const hasAnyItems = tasks.length || meetings.length || calls.length;

  return (
    <section style={{ flex: hasAnyItems && !mobile ? "1 1 auto" : "0 0 auto", minHeight: hasAnyItems ? 0 : "auto", border: stacked ? "none" : "1px solid #d9e4ef", borderRadius: 18, background: "#ffffff", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: stacked ? "none" : "0 6px 18px rgba(148, 163, 184, 0.08)" }}>
      <div style={{ flex: hasAnyItems && !mobile ? "1 1 auto" : "0 0 auto", display: "flex", flexDirection: stacked ? "column" : "row", gap: stacked ? 12 : 0, height: hasAnyItems && !mobile ? "100%" : "auto", overflowX: stacked ? "hidden" : "auto", overflowY: stacked ? "visible" : "hidden", padding: stacked ? "0" : 0, alignItems: "stretch", minHeight: 0 }}>
        <Lane title="Tasks" Icon={FileText} items={tasks} stacked={stacked} mobile={mobile} />
        <Lane title="Meetings" Icon={Calendar} items={meetings} stacked={stacked} mobile={mobile} />
        <Lane title="Calls" Icon={Phone} items={calls} stacked={stacked} mobile={mobile} />
      </div>
    </section>
  );
}
