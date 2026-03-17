import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader2, RefreshCw, UserRound } from "lucide-react";
import activitiesAPI from "../api/activities.api";

const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 84;
const RANGE_OPTIONS = [
  { value: "today", label: "Today", days: 1 },
  { value: "tomorrow", label: "Tomorrow", days: 1 },
  { value: "3days", label: "3 days", days: 3 },
  { value: "7days", label: "7 days", days: 7 },
  { value: "custom", label: "Custom range", days: null },
];

const pad = (value) => String(value).padStart(2, "0");
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};
const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};
const toApiDateTime = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
const toInputDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const sameDay = (left, right) => startOfDay(left).getTime() === startOfDay(right).getTime();
const fmtHeaderMonth = (date) => date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
const fmtDayName = (date) => date.toLocaleDateString("en-US", { weekday: "short" });
const fmtDayNumber = (date) => date.toLocaleDateString("en-US", { day: "numeric" });
const fmtTime = (value) => {
  if (!value) return "All day";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
const getUserId = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return Number(decoded?.sub || decoded?.id || decoded?.userId || 0) || null;
  } catch {
    return null;
  }
};
const activityTypeMeta = (type = "") => {
  const raw = String(type).toLowerCase();
  if (raw.includes("task")) return { label: "Task", color: "#2563eb", background: "#dbeafe" };
  if (raw.includes("meeting")) return { label: "Meeting", color: "#0f766e", background: "#ccfbf1" };
  if (raw.includes("call")) return { label: "Call", color: "#7c3aed", background: "#ede9fe" };
  if (raw.includes("email")) return { label: "Email", color: "#b45309", background: "#fef3c7" };
  return { label: "Activity", color: "#475569", background: "#e2e8f0" };
};
const parseActivityDate = (item) => {
  const value = item?.startTime || item?.activityDate || item?.dueDate || item?.createdAt || item?.date;
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};
const getEventDurationMinutes = (item) => {
  const start = parseActivityDate(item);
  const endValue = item?.endTime || item?.dueDateEnd || item?.scheduledEndTime || null;
  const end = endValue ? new Date(endValue) : null;
  if (start && end && !Number.isNaN(end.getTime()) && end > start) {
    return Math.max(30, Math.round((end - start) / 60000));
  }
  return 45;
};
const layoutDayEvents = (items) => {
  const positioned = items.map((item) => {
    const date = parseActivityDate(item);
    const durationMinutes = getEventDurationMinutes(item);
    const endDate = date ? new Date(date.getTime() + durationMinutes * 60000) : null;
    const hour = date ? date.getHours() + (date.getMinutes() / 60) : HOUR_START;
    const normalizedHour = Math.max(HOUR_START, Math.min(HOUR_END - 0.25, hour));
    return {
      ...item,
      date,
      endDate,
      durationMinutes,
      top: (normalizedHour - HOUR_START) * HOUR_HEIGHT,
      height: Math.max(58, (durationMinutes / 60) * HOUR_HEIGHT),
      column: 0,
      columnCount: 1,
    };
  }).sort((left, right) => {
    const leftTime = left.date ? left.date.getTime() : 0;
    const rightTime = right.date ? right.date.getTime() : 0;
    return leftTime - rightTime;
  });

  let clusterStart = 0;
  while (clusterStart < positioned.length) {
    let clusterEnd = clusterStart;
    let clusterMaxEnd = positioned[clusterStart].endDate?.getTime() || 0;

    while (clusterEnd + 1 < positioned.length) {
      const nextStart = positioned[clusterEnd + 1].date?.getTime() || 0;
      if (nextStart >= clusterMaxEnd) break;
      clusterEnd += 1;
      clusterMaxEnd = Math.max(clusterMaxEnd, positioned[clusterEnd].endDate?.getTime() || 0);
    }

    const columns = [];
    for (let index = clusterStart; index <= clusterEnd; index += 1) {
      const event = positioned[index];
      let assignedColumn = columns.findIndex((endAt) => (event.date?.getTime() || 0) >= endAt);
      if (assignedColumn === -1) {
        assignedColumn = columns.length;
        columns.push(0);
      }
      columns[assignedColumn] = event.endDate?.getTime() || 0;
      event.column = assignedColumn;
      event.columnCount = columns.length;
    }

    for (let index = clusterStart; index <= clusterEnd; index += 1) {
      positioned[index].columnCount = columns.length;
    }

    clusterStart = clusterEnd + 1;
  }

  return positioned;
};

const getPresetDates = (mode, customStart, customEnd) => {
  const today = startOfDay(new Date());
  if (mode === "today") return { start: today, end: endOfDay(today) };
  if (mode === "tomorrow") {
    const tomorrow = addDays(today, 1);
    return { start: tomorrow, end: endOfDay(tomorrow) };
  }
  if (mode === "custom") return { start: startOfDay(customStart), end: endOfDay(customEnd) };
  const days = RANGE_OPTIONS.find((item) => item.value === mode)?.days || 3;
  return { start: today, end: endOfDay(addDays(today, days - 1)) };
};

function EventCard({ item }) {
  const meta = activityTypeMeta(item?.type);
  const title = item?.subject || item?.title || meta.label;
  const description = item?.description || "";
  return (
    <div
      title={`${title}\n${fmtTime(item?.date)}${description ? `\n${description}` : ""}`}
      style={{
        position: "absolute",
        left: `${8 + ((item.column || 0) * item.eventWidth)}px`,
        width: `${item.eventWidth - 10}px`,
        borderRadius: 16,
        padding: "10px 12px",
        background: meta.background,
        color: meta.color,
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 8px", borderRadius: 999, background: "rgba(255,255,255,0.64)", fontSize: 10.5, fontWeight: 800 }}>
        {meta.label}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {title}
      </div>
      <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 700 }}>{fmtTime(item?.date)}</div>
      {description ? <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.45, color: "#334155", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{description}</div> : null}
    </div>
  );
}

function DayColumn({ day, items, columnWidth }) {
  const totalHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  const positionedItems = layoutDayEvents(items).map((item) => {
    const usableWidth = Math.max(120, columnWidth - 18);
    return {
      ...item,
      eventWidth: usableWidth / Math.max(1, item.columnCount || 1),
    };
  });

  return (
    <div style={{ minWidth: columnWidth, width: columnWidth, borderRight: "1px solid #e2e8f0", background: "#ffffff" }}>
      <div style={{ position: "relative", height: totalHeight }}>
        {Array.from({ length: HOUR_END - HOUR_START }).map((_, index) => (
          <div key={index} style={{ position: "absolute", left: 0, right: 0, top: index * HOUR_HEIGHT, height: HOUR_HEIGHT, borderBottom: "1px dashed #dbe4f0" }} />
        ))}
        {positionedItems.map((item) => (
          <div key={`${item.id}-${item.subject || item.title || item.date}`} style={{ position: "absolute", top: item.top, left: 0, right: 0, height: item.height }}>
            <EventCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = startOfDay(new Date());
  const [rangeMode, setRangeMode] = useState("3days");
  const [anchorDate, setAnchorDate] = useState(today);
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(addDays(today, 2));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = useMemo(() => getUserId(), []);
  const { start, end } = useMemo(() => {
    if (rangeMode === "custom") return getPresetDates(rangeMode, customStart, customEnd);
    const based = rangeMode === "today" || rangeMode === "tomorrow"
      ? anchorDate
      : anchorDate;
    if (rangeMode === "today") return { start: startOfDay(based), end: endOfDay(based) };
    if (rangeMode === "tomorrow") {
      const tomorrow = addDays(startOfDay(based), 1);
      return { start: tomorrow, end: endOfDay(tomorrow) };
    }
    const days = RANGE_OPTIONS.find((item) => item.value === rangeMode)?.days || 3;
    return { start: startOfDay(based), end: endOfDay(addDays(startOfDay(based), days - 1)) };
  }, [anchorDate, customEnd, customStart, rangeMode]);

  const dayColumns = useMemo(() => {
    const days = [];
    const cursor = startOfDay(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [end, start]);

  const loadCalendar = async () => {
    if (!userId) {
      setItems([]);
      setError("Unable to identify the signed-in user for calendar data.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await activitiesAPI.getCalendar({
        startDate: toApiDateTime(startOfDay(start)),
        endDate: toApiDateTime(endOfDay(end)),
        userId,
      });
      setItems(Array.isArray(data) ? data.map((item) => ({
        ...item,
        date: item?.startTime || item?.activityDate || item?.dueDate || item?.createdAt || item?.date,
      })) : []);
    } catch (err) {
      setItems([]);
      setError(err?.response?.data?.message || "Unable to load calendar activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [end.getTime(), start.getTime(), userId]);

  const itemsByDay = useMemo(() => items.reduce((acc, item) => {
    const date = parseActivityDate(item);
    if (!date) return acc;
    const key = toInputDate(date);
    (acc[key] ||= []).push(item);
    acc[key].sort((left, right) => parseActivityDate(left) - parseActivityDate(right));
    return acc;
  }, {}), [items]);

  const todayItems = useMemo(() => items.filter((item) => {
    const date = parseActivityDate(item);
    return date ? sameDay(date, today) : false;
  }), [items, today]);

  const tomorrowItems = useMemo(() => items.filter((item) => {
    const date = parseActivityDate(item);
    return date ? sameDay(date, addDays(today, 1)) : false;
  }), [items, today]);

  const rangeSummary = [
    { label: "Today", count: todayItems.length, accent: "#2563eb", bg: "#eff6ff" },
    { label: "Tomorrow", count: tomorrowItems.length, accent: "#7c3aed", bg: "#f5f3ff" },
    { label: "In Range", count: items.length, accent: "#0f766e", bg: "#ecfeff" },
  ];

  const shiftRange = (direction) => {
    if (rangeMode === "custom") {
      const span = Math.max(1, Math.round((endOfDay(customEnd) - startOfDay(customStart)) / 86400000) + 1);
      setCustomStart((current) => addDays(current, direction * span));
      setCustomEnd((current) => addDays(current, direction * span));
      return;
    }

    const span = rangeMode === "today" || rangeMode === "tomorrow" ? 1 : (RANGE_OPTIONS.find((item) => item.value === rangeMode)?.days || 3);
    setAnchorDate((current) => addDays(current, direction * span));
  };

  const columnWidth = dayColumns.length <= 3 ? 340 : 240;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 22, alignItems: "start" }}>
      <section style={{ border: "1px solid #dbe4f0", borderRadius: 28, background: "#ffffff", boxShadow: "0 24px 50px rgba(15, 23, 42, 0.06)", overflow: "hidden" }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase" }}>Follow-up Scheduler</div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, color: "#0f172a" }}>
              <CalendarDays size={20} />
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{fmtHeaderMonth(start)}</h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <select value={rangeMode} onChange={(event) => setRangeMode(event.target.value)} style={selectStyle}>
              {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {rangeMode === "custom" ? (
              <>
                <input type="date" value={toInputDate(customStart)} onChange={(event) => setCustomStart(new Date(`${event.target.value}T00:00:00`))} style={inputStyle} />
                <input type="date" value={toInputDate(customEnd)} onChange={(event) => setCustomEnd(new Date(`${event.target.value}T00:00:00`))} style={inputStyle} />
              </>
            ) : null}
            <button type="button" onClick={() => shiftRange(-1)} style={navBtnStyle}><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => { setAnchorDate(today); setCustomStart(today); setCustomEnd(addDays(today, 2)); }} style={{ ...navBtnStyle, minWidth: 88 }}>Today</button>
            <button type="button" onClick={() => shiftRange(1)} style={navBtnStyle}><ChevronRight size={16} /></button>
            <button type="button" onClick={loadCalendar} style={navBtnStyle} title="Refresh calendar">
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
            </button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {rangeSummary.map((item) => (
              <div key={item.label} style={{ minWidth: 134, borderRadius: 18, padding: "14px 16px", background: item.bg, color: item.accent }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{item.count}</div>
              </div>
            ))}
          </div>

          {error ? <div style={errorStyle}>{error}</div> : null}

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", background: "#fcfdff" }}>
            <div style={{ display: "grid", gridTemplateColumns: `76px repeat(${dayColumns.length}, minmax(${columnWidth}px, 1fr))`, borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ padding: "16px 10px", fontSize: 12, fontWeight: 800, color: "#64748b", borderRight: "1px solid #e2e8f0" }}>IST</div>
              {dayColumns.map((day) => (
                <div key={day.toISOString()} style={{ padding: "14px 14px 12px", borderRight: "1px solid #e2e8f0", background: sameDay(day, today) ? "#f8fbff" : "#ffffff" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: sameDay(day, today) ? "#4f46e5" : "#64748b" }}>{fmtDayName(day)}</div>
                  <div style={{ marginTop: 2, fontSize: 28, fontWeight: 800, color: sameDay(day, today) ? "#4f46e5" : "#0f172a", lineHeight: 1 }}>{fmtDayNumber(day)}</div>
                </div>
              ))}
            </div>

            <div style={{ maxHeight: "68vh", overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: `76px repeat(${dayColumns.length}, minmax(${columnWidth}px, 1fr))` }}>
                <div style={{ position: "relative", borderRight: "1px solid #e2e8f0", background: "#ffffff" }}>
                  {Array.from({ length: HOUR_END - HOUR_START }).map((_, index) => {
                    const hour = HOUR_START + index;
                    return (
                      <div key={hour} style={{ height: HOUR_HEIGHT, borderBottom: "1px dashed #dbe4f0", padding: "8px 10px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                        {hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                      </div>
                    );
                  })}
                </div>
                {dayColumns.map((day) => (
                  <DayColumn key={day.toISOString()} day={day} items={itemsByDay[toInputDate(day)] || []} columnWidth={columnWidth} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside style={{ border: "1px solid #dbe4f0", borderRadius: 28, background: "#ffffff", boxShadow: "0 24px 50px rgba(15, 23, 42, 0.06)", overflow: "hidden", position: "sticky", top: 92 }}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>Quick Glance</div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Upcoming Follow-ups</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>{items.length} item{items.length === 1 ? "" : "s"} across this view</div>
        </div>
        <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {!items.length ? (
            <div style={{ border: "1px dashed #dbe4f0", borderRadius: 18, padding: 20, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
              No follow-ups are scheduled in this range.
            </div>
          ) : items.map((item) => {
            const meta = activityTypeMeta(item?.type);
            return (
              <div key={`${item?.id}-${item?.subject || item?.title || item?.date}`} style={{ border: "1px solid #e2e8f0", borderRadius: 20, padding: 16, background: "#fcfdff" }}>
                <div style={{ display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 999, background: meta.background, color: meta.color, fontSize: 11.5, fontWeight: 800 }}>
                  {meta.label}
                </div>
                <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>
                  {item?.subject || item?.title || meta.label}
                </div>
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  <div style={metaRowStyle}><Clock3 size={14} /><span>{fmtTime(item?.date)}</span></div>
                  {item?.assignedUserId ? <div style={metaRowStyle}><UserRound size={14} /><span>User #{item.assignedUserId}</span></div> : null}
                  {item?.priority ? <div style={metaRowStyle}><CalendarDays size={14} /><span>Priority: {item.priority}</span></div> : null}
                  {item?.description ? <div style={{ marginTop: 2, fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>{item.description}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

const navBtnStyle = {
  minWidth: 40,
  height: 40,
  borderRadius: 12,
  border: "1px solid #dbe4f0",
  background: "#ffffff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const selectStyle = {
  minWidth: 132,
  height: 40,
  borderRadius: 12,
  border: "1px solid #dbe4f0",
  background: "#ffffff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  padding: "0 12px",
  outline: "none",
};

const inputStyle = {
  height: 40,
  borderRadius: 12,
  border: "1px solid #dbe4f0",
  background: "#ffffff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 600,
  padding: "0 12px",
  outline: "none",
};

const errorStyle = {
  marginBottom: 14,
  border: "1px solid #fecaca",
  borderRadius: 16,
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 600,
  padding: "12px 14px",
};

const metaRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12.5,
  fontWeight: 600,
  color: "#475569",
};
